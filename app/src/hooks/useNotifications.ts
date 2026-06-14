import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";


export interface NotificationReply {
  id: string;
  notification_id: string;
  from_username: string;
  content: string;
  created_at: string;
}

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
  reply_count: number;
  replies: NotificationReply[];
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Collect ALL possible user IDs for the current user
  // notifications table may use either auth.uid() or legacy app_users.id
  const [userIds, setUserIds] = useState<string[]>([]);
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const authUid = data.session?.user?.id || null;
      if (!authUid) return;
      const ids = [authUid];
      
      // Also try to find the legacy app_users.id for this user
      // Match by: 1) user_roles.display_name == app_users.username, or
      //           2) email prefix match
      try {
        // Get current user's display_name from user_roles
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("display_name")
          .eq("user_id", authUid)
          .maybeSingle();
        
        if (userRole) {
          const displayName = (userRole as Record<string, unknown>).display_name as string;
          if (displayName) {
            // Find matching app_users record by username
            const { data: appUser } = await supabase
              .from("app_users")
              .select("id")
              .eq("username", displayName)
              .maybeSingle();
            if (appUser) {
              const legacyId = (appUser as Record<string, unknown>).id as string;
              if (legacyId && legacyId !== authUid) {
                ids.push(legacyId);
              }
            }
          }
        }
        
        // Also try email prefix match as fallback
        const emailPrefix = data.session?.user?.email?.split("@")[0] || "";
        if (emailPrefix && ids.length < 2) {
          const { data: appUserByEmail } = await supabase
            .from("app_users")
            .select("id")
            .eq("username", emailPrefix)
            .maybeSingle();
          if (appUserByEmail) {
            const legacyId = (appUserByEmail as Record<string, unknown>).id as string;
            if (legacyId && !ids.includes(legacyId)) {
              ids.push(legacyId);
            }
          }
        }
      } catch (e) {
        // Ignore errors in legacy lookup
      }
      
      setUserIds(ids);
    });
  }, [])

  const fetchNotifications = useCallback(async () => {
    if (userIds.length === 0) return;
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
          reply_count,
          created_at,
          from_user:from_user_id ( username ),
          task:task_id ( name )
        `)
        .in("to_user_id", userIds)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Failed to fetch notifications:", error);
        return;
      }

      // Fetch replies for all notifications
      const notifIds = (data || []).map((n: Record<string, unknown>) => n.id as string);
      let repliesMap = new Map<string, NotificationReply[]>();

      if (notifIds.length > 0) {
        const { data: repliesData } = await supabase
          .from("mention_replies")
          .select(`
            id,
            notification_id,
            content,
            created_at,
            from_user:from_user_id ( username )
          `)
          .in("notification_id", notifIds)
          .order("created_at", { ascending: true });

        for (const r of (repliesData || [])) {
          const reply = r as Record<string, unknown>;
          const fromUser = reply.from_user as Record<string, unknown> | null;
          const notifId = reply.notification_id as string;
          if (!repliesMap.has(notifId)) repliesMap.set(notifId, []);
          repliesMap.get(notifId)!.push({
            id: reply.id as string,
            notification_id: notifId,
            from_username: (fromUser?.username as string) || "未知",
            content: reply.content as string,
            created_at: reply.created_at as string,
          });
        }
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
          reply_count: (n.reply_count as number) || 0,
          created_at: n.created_at as string,
          replies: repliesMap.get(n.id as string) || [],
        };
      });

      setNotifications(mapped);
      setUnreadCount(mapped.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [userIds]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription for new notifications
  useEffect(() => {
    if (userIds.length === 0) return;

    // Subscribe for each possible user ID
    const channels = userIds.map((uid) => {
      const channel = supabase
        .channel(`notifications-realtime-${uid}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `to_user_id=eq.${uid}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();
      return channel;
    });

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [userIds, fetchNotifications]);

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
    if (userIds.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("to_user_id", userIds)
      .eq("is_read", false);
  }, [userIds]);

  // Add reply to a notification
  const addReply = useCallback(
    async (notificationId: string, progressEntryId: string, taskId: string, content: string) => {
      const fromUserId = userIds.length > 0 ? userIds[0] : null;
      const fromUsername = "用户";
      // TODO: get username from session
      if (!fromUserId || !content.trim()) return;

      const replyId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Optimistic update: add reply + mark as read
      setNotifications((prev) =>
        prev.map((n) => {
          if (n.id !== notificationId) return n;
          return {
            ...n,
            is_read: true,
            reply_count: n.reply_count + 1,
            replies: [
              ...n.replies,
              {
                id: replyId,
                notification_id: notificationId,
                from_username: fromUsername,
                content: content.trim(),
                created_at: now,
              },
            ],
          };
        })
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Write reply to mention_replies
      await supabase.from("mention_replies").insert({
        id: replyId,
        notification_id: notificationId,
        progress_entry_id: progressEntryId,
        from_user_id: fromUserId,
        content: content.trim(),
      });

      // Increment reply_count
      const { data: current } = await supabase
        .from("notifications")
        .select("reply_count")
        .eq("id", notificationId)
        .single();
      const currentCount = (current?.reply_count as number) || 0;
      await supabase
        .from("notifications")
        .update({ reply_count: currentCount + 1, is_read: true })
        .eq("id", notificationId);

      // Also write a progress_entry so the reply appears in task update history
      const entryId = crypto.randomUUID();
      // Find the original sender (who sent the @mention)
      const notif = notifications.find((n) => n.id === notificationId);
      const repliedToUser = notif?.from_username || "用户";
      // The reply note should show: "test 回复了 @kevin: 内容"
      // where fromUsername is current user (replier) and repliedToUser is original @sender
      if (!notif || !repliedToUser) return;
      const replyNote = `${fromUsername} 回复了 @${repliedToUser}: ${content.trim()}`;
      await supabase.from("progress_entries").insert({
        id: entryId,
        task_id: taskId,
        timestamp: now,
        progress: 0,
        note: replyNote,
        username: fromUsername,
      });
    },
    [notifications]
  );

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addReply,
    refresh: fetchNotifications,
  };
}
