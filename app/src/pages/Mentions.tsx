import { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, AtSign, MessageSquare, Inbox, ChevronRight,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

function formatTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHr < 24) return `${diffHr}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

export default function Mentions() {
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, markAllAsRead } = useNotifications();

  // Auto mark all as read when entering the page
  useEffect(() => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC]">
      {/* Header */}
      <header className="h-14 md:h-16 sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-[#E2E8F0] flex items-center px-3 sm:px-4 md:px-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-[#64748B] hover:text-[#334155] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">返回项目</span>
        </button>
        <div className="flex-1" />
        <h1 className="text-lg font-bold text-[#1E293B]">@给我的消息</h1>
        <div className="flex-1" />
      </header>

      <div className="max-w-[800px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EDE9FE] flex items-center justify-center">
              <AtSign className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div>
              <p className="text-[1.375rem] font-bold text-[#1E293B] tabular-nums">{notifications.length}</p>
              <p className="text-xs text-[#94A3B8]">全部消息</p>
            </div>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFF1F2] flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[#F43F5E]" />
            </div>
            <div>
              <p className="text-[1.375rem] font-bold text-[#1E293B] tabular-nums">{unreadCount}</p>
              <p className="text-xs text-[#94A3B8]">未读</p>
            </div>
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#E2E8F0] border-t-[#3B82F6] rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && notifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <Inbox className="w-16 h-16 text-[#CBD5E1] mb-4" />
            </motion.div>
            <p className="text-xl font-semibold text-[#64748B]">暂无@消息</p>
            <p className="text-sm text-[#94A3B8] mt-1">当有人在任务中 @你 时，会在这里显示</p>
          </motion.div>
        )}

        {/* Notification List */}
        {!loading && notifications.length > 0 && (
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {notifications.map((n, index) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}
                  onClick={() => navigate(`/?taskId=${n.task_id}`)}
                  className={`bg-white border rounded-xl px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-[#CBD5E1] transition-all duration-200 cursor-pointer ${
                    n.is_read ? "border-[#E2E8F0]" : "border-[#C4B5FD] bg-[#FAFAFE]"
                  }`}
                  style={{ borderLeftWidth: n.is_read ? "3px" : "3px", borderLeftColor: n.is_read ? "#E2E8F0" : "#7C3AED" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Header row: from_user → task */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#EDE9FE] text-[#7C3AED]">
                          <AtSign className="w-3 h-3" />
                          {n.from_username}
                        </span>
                        <ChevronRight className="w-3 h-3 text-[#CBD5E1]" />
                        <span className="text-xs text-[#64748B] truncate max-w-[200px]">
                          {n.task_name}
                        </span>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-[#7C3AED] shrink-0" />
                        )}
                      </div>
                      {/* Note content */}
                      <p className="text-sm text-[#334155] leading-relaxed line-clamp-2">
                        {n.note}
                      </p>
                    </div>
                    <span className="text-[0.625rem] text-[#94A3B8] font-mono shrink-0 mt-1 tabular-nums">
                      {formatTime(n.created_at)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
