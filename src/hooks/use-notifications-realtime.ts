"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

/**
 * useNotificationsRealtime
 *
 * Subscribes to Supabase Realtime INSERT events on the `notifications` table,
 * filtered by the current user's ID. On each new notification, invalidates
 * the TanStack Query cache so consuming components refetch automatically.
 *
 * Called exactly ONCE in `(owner)/layout.tsx` via a thin RealtimeProvider wrapper.
 * Does NOT manage local state — relies entirely on TanStack Query cache.
 */
export function useNotificationsRealtime(userId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
