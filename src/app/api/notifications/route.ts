import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  getNotifications,
  getUnreadCount,
} from "@/lib/db/queries/notifications";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const [notificationsList, unreadCount] = await Promise.all([
    getNotifications(user.id),
    getUnreadCount(user.id),
  ]);

  return NextResponse.json({
    notifications: notificationsList,
    unreadCount,
  });
}
