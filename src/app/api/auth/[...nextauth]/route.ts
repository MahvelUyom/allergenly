import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// A first-time Google sign-in does OAuth token exchange + profile
// fetch + several sequential Prisma round trips (account lookup/
// linking, then the createUser event's own restaurant/location/menu
// transaction, which alone is allowed up to 15s — see lib/auth.ts) —
// all in this one request. Vercel's default function timeout (10s)
// can kill it mid-flight before that ever finishes, which looks like
// a generic platform error to the browser and "works on retry" once
// warm. Extending this route specifically covers the worst case.
export const maxDuration = 30;

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
