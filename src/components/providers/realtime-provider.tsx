"use client";

import { useNotificationsRealtime } from "@/hooks/use-notifications-realtime";

/**
 * Thin client wrapper that calls the realtime hook.
 * Mounted exactly once in (owner)/layout.tsx.
 */
export function RealtimeProvider({ userId }: { userId: string }) {
  useNotificationsRealtime(userId);
  return null;
}
