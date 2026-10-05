import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      restaurantId: string | null;
      restaurantName: string | null;
      restaurantSlug: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    restaurantId?: string;
    restaurantName?: string;
    restaurantSlug?: string;
  }
}
