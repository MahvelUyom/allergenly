import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Protects every dashboard-area route. next-auth/middleware redirects
// unauthenticated requests to /login (via pages.signIn in authOptions).
// This is defense-in-depth alongside the per-route session checks in
// each API handler — the API routes never rely on middleware alone.
export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/menus/:path*",
    "/qr-codes/:path*",
    "/analytics/:path*",
    "/settings/:path*",
  ],
};
