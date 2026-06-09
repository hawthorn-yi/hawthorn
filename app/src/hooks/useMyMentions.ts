import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getAuthToken } from "@/lib/auth";

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
  created_at: string;
  replies: MyMentionReply[];
}

export function useMyMentions() {
  const [mentions, setMentions] = useState<MyMention[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = getAuthToken()?.id;

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
          has_reply: replyCount > 0,
          created_at: n.created_at as string,
          replies: repliesMap.get(nid) || [],
        };
      });

      setMentions(mapped);
    } catch (err) {
      console.error("Error fetching my mentions:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMyMentions();
  }, [fetchMyMentions]);

  // Realtime subscription for new replies
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("my-mentions-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mention_replies" },
        () => {
          fetchMyMentions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchMyMentions]);

  return {
    mentions,
    loading,
    refresh: fetchMyMentions,
  };
}
