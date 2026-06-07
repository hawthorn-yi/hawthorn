import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getAuthToken } from "@/lib/auth";

export interface Notification {
  id: string;
  from_user_id: string;
  from_username: string;
  to_user_id: string;
  task_id: string;
  task_name: string;
  progress_entry_id: string;
  note: string;
  mentioned_username: string;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const userId = getAuthToken()?.id;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id,
          from_user_id,
          to_user_id,
          task_id,
          progress_entry_id,
          note,
          mentioned_username,
          is_read,
          created_at,
          from_user:from_user_id ( username ),
          task:task_id ( name )
        `)
        .eq("to_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Failed to fetch notifications:", error);
        return;
      }

      const mapped: Notification[] = (data || []).map((n: Record<string, unknown>) => {
        const fromUser = n.from_user as Record<string, unknown> | null;
        const task = n.task as Record<string, unknown> | null;
        return {
          id: n.id as string,
          from_user_id: n.from_user_id as string,
          from_username: (fromUser?.username as string) || (n.mentioned_username as string),
          to_user_id: n.to_user_id as string,
          task_id: n.task_id as string,
          task_name: (task?.name as string) || "未知任务",
          progress_entry_id: n.progress_entry_id as string,
          note: n.note as string,
          mentioned_username: n.mentioned_username as string,
          is_read: (n.is_read as boolean) || false,
          created_at: n.created_at as string,
        };
      });

      setNotifications(mapped);
      setUnreadCount(mapped.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `to_user_id=eq.${userId}`,
        },
        () => {
          // Refetch to get the full joined data
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
    },
    []
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("to_user_id", userId)
      .eq("is_read", false);
  }, [userId]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
