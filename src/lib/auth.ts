import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { loginSchema } from "./zod-schemas";
import { uniqueRestaurantSlug } from "./slug";

// NextAuth (Auth.js) config: Prisma adapter + Credentials (email/
// password, bcrypt-hashed) + Google OAuth. Session strategy is JWT
// (required for the Credentials provider — database sessions only work
// for providers that don't need a custom authorize() callback).
//
// Per the product decision: a new sign-up gets dashboard access
// immediately, no email verification gate. We still send a
// verification email in the background (see /api/auth/signup) purely
// for record-keeping — nothing here blocks on emailVerified.
export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  events: {
    // Fires exactly once when the Prisma adapter creates a brand-new
    // user — which only happens for a first-time Google OAuth sign-in
    // (our Credentials sign-up path creates the User directly in
    // /api/auth/signup, alongside its Restaurant, and never goes
    // through the adapter). Without this, a Google-only sign-up would
    // land on a dashboard with no restaurant and get bounced back to
    // /login by the (app) layout's guard. Grants the same "immediate
    // access, no gate" treatment as the Credentials flow.
    async createUser({ user }) {
      if (!user.id || !user.email) return;
      const existing = await prisma.restaurant.findUnique({ where: { ownerId: user.id } });
      if (existing) return;

      const name = user.name ? `${user.name}'s Restaurant` : "My Restaurant";
      const slug = await uniqueRestaurantSlug(name);

      await prisma.$transaction(
        async (tx) => {
          const restaurant = await tx.restaurant.create({
            data: { ownerId: user.id, name, slug, contactEmail: user.email },
          });
          const location = await tx.location.create({
            data: { restaurantId: restaurant.id, name: "Main Location" },
          });
          await tx.menu.create({
            data: { restaurantId: restaurant.id, locationId: location.id, name: "Main Menu" },
          });
        },
        { maxWait: 10_000, timeout: 15_000 } // Prisma's defaults (2s/5s) are too tight on a slow connection
      );
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "OWNER";
        // Stamped at the moment this token is minted, so session() can
        // later tell whether the password changed after this sign-in —
        // see the passwordChangedAt field comment on the User model.
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { passwordChangedAt: true },
        });
        token.pwStamp = dbUser?.passwordChangedAt?.getTime() ?? 0;
      }
      if (!token.restaurantId && token.id) {
        const restaurant = await prisma.restaurant.findUnique({
          where: { ownerId: token.id as string },
          select: { id: true, name: true, slug: true },
        });
        if (restaurant) {
          token.restaurantId = restaurant.id;
          token.restaurantName = restaurant.name;
          token.restaurantSlug = restaurant.slug;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (!token.id) return session;

      // JWT sessions can't be revoked server-side by deleting a row —
      // this is the actual enforcement for "log out other sessions"
      // after a password reset/change: if the password changed after
      // this particular token was issued, the session comes back
      // signed-out instead of trusting a 30-day-old token blindly.
      //
      // This runs on every single getServerSession() call in the app,
      // so a transient DB hiccup here must never take down every
      // authenticated page/request — fail OPEN (trust the token for
      // this one check) rather than closed. The real fix for a
      // password-changed-elsewhere session is still enforced on every
      // other request; a stale-but-valid-looking session surviving one
      // request during a DB blip is a far smaller risk than every user
      // getting logged out whenever the DB has a momentary issue.
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { passwordChangedAt: true },
        });
        const currentStamp = dbUser?.passwordChangedAt?.getTime() ?? 0;
        if (currentStamp > ((token.pwStamp as number) ?? 0)) {
          // Every consumer of getServerSession() in this app checks
          // `session?.user?.id` before reading further (never a bare
          // `session.user.x`), so an absent `user` on a present session
          // object correctly reads as "signed out" everywhere — see the
          // guard in (app)/layout.tsx and requireRestaurantSession().
          return { ...session, user: undefined } as unknown as typeof session;
        }
      } catch (error) {
        console.error("passwordChangedAt check failed, failing open:", error);
      }

      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "OWNER";
        session.user.restaurantId = (token.restaurantId as string) ?? null;
        session.user.restaurantName = (token.restaurantName as string) ?? null;
        session.user.restaurantSlug = (token.restaurantSlug as string) ?? null;
      }
      return session;
    },
  },
};
