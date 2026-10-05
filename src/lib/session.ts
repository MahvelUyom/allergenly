import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export class UnauthorizedError extends Error {
  status = 401;
}
export class ForbiddenError extends Error {
  status = 403;
}

/**
 * Every dashboard/menu-management/settings API route calls this FIRST.
 * The restaurant id always comes from the session, never from the
 * request body/query — see the security requirements in the build
 * spec ("derive the restaurant's identity from the session/JWT, never
 * from an ID passed in the request body").
 */
// The JWT is populated on sign-in; if a restaurant was created after
// token issuance in the same session, fall back to a fresh lookup
// rather than incorrectly rejecting the request. Explicit Promise<string>
// return type so callers always get a definite restaurant id, never
// `string | null`.
async function resolveRestaurantId(userId: string, tokenRestaurantId: string | null): Promise<string> {
  if (tokenRestaurantId) return tokenRestaurantId;
  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId: userId },
    select: { id: true },
  });
  if (!restaurant) throw new ForbiddenError("No restaurant is associated with this account");
  return restaurant.id;
}

export async function requireRestaurantSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new UnauthorizedError("Not authenticated");

  const restaurantId = await resolveRestaurantId(session.user.id, session.user.restaurantId);

  return { userId: session.user.id, restaurantId, role: session.user.role, session };
}

/** Admin-only actions must check the role server-side against the DB. */
export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new UnauthorizedError("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") throw new ForbiddenError("Admin role required");

  return { userId: session.user.id, session };
}
