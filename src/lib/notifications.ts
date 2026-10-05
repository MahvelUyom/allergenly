import { prisma } from "./prisma";

/**
 * The header bell reads the ActivityEvent feed directly (filtered by
 * `read`) rather than a separate notifications table — every
 * notification IS an activity event; see the model comment in
 * schema.prisma.
 */
export async function getNotifications(restaurantId: string, limit = 20) {
  const [items, unreadCount] = await Promise.all([
    prisma.activityEvent.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.activityEvent.count({ where: { restaurantId, read: false } }),
  ]);
  return { items, unreadCount };
}

export async function markAllNotificationsRead(restaurantId: string) {
  await prisma.activityEvent.updateMany({
    where: { restaurantId, read: false },
    data: { read: true },
  });
}
