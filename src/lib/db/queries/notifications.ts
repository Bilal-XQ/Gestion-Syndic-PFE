import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";

/**
 * All notifications for a user, newest first.
 */
export async function getNotifications(userId: string) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

/**
 * Count of unread notifications for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );

  return Number(result?.count ?? 0);
}

/**
 * Mark a single notification as read (scoped to user).
 */
export async function markAsRead(notificationId: string, userId: string) {
  return db
    .update(notifications)
    .set({ isRead: true, updatedAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );
}

/**
 * Mark all unread notifications as read for a user.
 */
export async function markAllAsRead(userId: string) {
  return db
    .update(notifications)
    .set({ isRead: true, updatedAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );
}
