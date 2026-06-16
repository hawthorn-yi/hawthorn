import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";


export interface MyMentionReply {
  id: string;
  notification_id: string;
  from_username: string;
  content: string;
  created_at: string;
}

export interface MyMention {
  id: string;
  from_user_id: string;
  from_username: string;
  to_user_id: string;
  to_username: string;
  task_id: string;
  task_name: string;
  progress_entry_id: string;
  note: string;
  mentioned_username: string;
  is_read: boolean;
  reply_count: number;
  has_reply: boolean;
  dismissed: boolean;
  created_at: string;
  replies: MyMentionReply[];
}

// Grouped: multiple @mentions in the same note share the same progress_entry_id
export interface MyMentionGroup {
  progress_entry_id: string;
  task_id: string;
  task_name: string;
  note: string;
  created_at: string;
  // All @'d users in this group
  mentioned_users: string[];
  // The first mention's replies (shared across the group)
  replies: MyMentionReply[];
  has_reply: boolean;
  dismissed: boolean;
}

export function useMyMentions() {
  const [mentions, setMentions] = useState<MyMention[]>([]);
  const [groupedMentions, setGroupedMentions] = useState<MyMentionGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id || null;
      setUserId(uid);
    });
  }, []);

  // Helper: regroup mentions after local state changes
  const regroup = useCallback((flatMentions: MyMention[]) => {
    const groupMap = new Map<string, MyMentionGroup>();
    for (const m of flatMentions) {
      if (!groupMap.has(m.progress_entry_id)) {
        groupMap.set(m.progress_entry_id, {
          progress_entry_id: m.progress_entry_id,
          task_id: m.task_id,
          task_name: m.task_name,
          note: m.note,
          created_at: m.created_at,
          mentioned_users: [],
          replies: [],
          has_reply: false,
          dismissed: false,
        });
      }
      const group = groupMap.get(m.progress_entry_id)!;
      // Dedupe mentioned users
      if (!group.mentioned_users.includes(m.mentioned_username)) {
        group.mentioned_users.push(m.mentioned_username);
      }
      // Merge replies (same progress_entry_id may have multiple rows)
      for (const r of m.replies) {
        if (!group.replies.some((gr) => gr.id === r.id)) {
          group.replies.push(r);
        }
      }
      if (m.has_reply) group.has_reply = true;
      if (m.dismissed) group.dismissed = true;
    }

    // Sort groups by created_at desc
    const groups = Array.from(groupMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setGroupedMentions(groups);
  }, []);

  const fetchMyMentions = useCallback(async () => {
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
          reply_count,
          dismissed,
          created_at,
          from_user:from_user_id ( username ),
          to_user:to_user_id ( username ),
          task:task_id ( name )
        `)
        .eq("from_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Failed to fetch my mentions:", error);
        return;
      }

      // Fetch replies for all these notifications
      const notifIds = (data || []).map((n: Record<string, unknown>) => n.id as string);
      let repliesMap = new Map<string, MyMentionReply[]>();

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

      const mapped: MyMention[] = (data || []).map((n: Record<string, unknown>) => {
        const fromUser = n.from_user as Record<string, unknown> | null;
        const toUser = n.to_user as Record<string, unknown> | null;
        const task = n.task as Record<string, unknown> | null;
        const nid = n.id as string;
        const replyCount = (n.reply_count as number) || 0;
        const dismissed = (n.dismissed as boolean) || false;
        return {
          id: nid,
          from_user_id: n.from_user_id as string,
          from_username: (fromUser?.username as string) || (n.mentioned_username as string),
          to_user_id: n.to_user_id as string,
          to_username: (toUser?.username as string) || "未知",
          task_id: n.task_id as string,
          task_name: (task?.name as string) || "未知任务",
          progress_entry_id: n.progress_entry_id as string,
          note: n.note as string,
          mentioned_username: n.mentioned_username as string,
          is_read: (n.is_read as boolean) || false,
          reply_count: replyCount,
          has_reply: replyCount > 0 || dismissed,
          dismissed,
          created_at: n.created_at as string,
          replies: repliesMap.get(nid) || [],
        };
      });

      setMentions(mapped);
      regroup(mapped);
    } catch (err) {
      console.error("Error fetching my mentions:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, regroup]);

  useEffect(() => {
    fetchMyMentions();
  }, [fetchMyMentions]);

  // Realtime subscription for new notifications (I @ others) and new replies
  useEffect(() => {
    if (!userId) return;

    const notifChannel = supabase
      .channel(`my-mentions-notif-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `from_user_id=eq.${userId}` },
        () => { fetchMyMentions(); }
      )
      .subscribe();

    const replyChannel = supabase
      .channel("my-mentions-replies")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mention_replies" },
        () => { fetchMyMentions(); }
      )
      .subscribe();

    // Listen for dismissed updates
    const dismissChannel = supabase
      .channel("my-mentions-dismiss")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `from_user_id=eq.${userId}` },
        () => { fetchMyMentions(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(replyChannel);
      supabase.removeChannel(dismissChannel);
    };
  }, [userId, fetchMyMentions]);

  // Dismiss a mention group: mark all notifications with the same progress_entry_id as dismissed
  const dismissMention = useCallback(async (progressEntryId: string) => {
    // Find all notification ids for this group
    const notifIds = mentions
      .filter((m) => m.progress_entry_id === progressEntryId)
      .map((m) => m.id);

    if (notifIds.length === 0) return;

    // Optimistic update
    const updatedMentions = mentions.map((m) =>
      m.progress_entry_id === progressEntryId
        ? { ...m, dismissed: true, has_reply: true }
        : m
    );
    setMentions(updatedMentions);
    regroup(updatedMentions);

    // Update Supabase
    const { error } = await supabase
      .from("notifications")
      .update({ dismissed: true, is_read: true })
      .in("id", notifIds);

    if (error) {
      console.error("Failed to dismiss mention:", error);
      toast.error("操作失败，请重试");
      // Rollback
      setMentions(mentions);
      regroup(mentions);
    }
  }, [mentions, regroup]);

  const unrepliedCount = groupedMentions.filter((g) => !g.has_reply).length;
  const totalCount = groupedMentions.length;

  return {
    mentions,
    groupedMentions,
    loading,
    unrepliedCount,
    totalCount,
    dismissMention,
    refresh: fetchMyMentions,
  };
}
