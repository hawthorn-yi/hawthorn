import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, AtSign, MessageSquare, Inbox, ChevronRight,
  CornerDownRight, CheckCircle2, Clock,
} from "lucide-react";
import { useMyMentions } from "@/hooks/useMyMentions";

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

export default function MyMentions() {
  const navigate = useNavigate();
  const { mentions, loading } = useMyMentions();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const repliedCount = mentions.filter((m) => m.has_reply).length;
  const unrepliedCount = mentions.filter((m) => !m.has_reply).length;

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
        <h1 className="text-lg font-bold text-[#1E293B]">我@别人的</h1>
        <div className="flex-1" />
      </header>

      <div className="max-w-[800px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
              <AtSign className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <div>
              <p className="text-[1.375rem] font-bold text-[#1E293B] tabular-nums">{mentions.length}</p>
              <p className="text-xs text-[#94A3B8]">全部@消息</p>
            </div>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#ECFDF5] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            </div>
            <div>
              <p className="text-[1.375rem] font-bold text-[#1E293B] tabular-nums">{repliedCount}</p>
              <p className="text-xs text-[#94A3B8]">已回复</p>
            </div>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFF1F2] flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#F43F5E]" />
            </div>
            <div>
              <p className="text-[1.375rem] font-bold text-[#1E293B] tabular-nums">{unrepliedCount}</p>
              <p className="text-xs text-[#94A3B8]">待回复</p>
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
        {!loading && mentions.length === 0 && (
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
            <p className="text-sm text-[#94A3B8] mt-1">当你在任务中 @别人 时，会在这里显示</p>
          </motion.div>
        )}

        {/* Mention List */}
        {!loading && mentions.length > 0 && (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {mentions.map((m, index) => {
                const isExpanded = expandedId === m.id;

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200"
                    style={{
                      borderLeftWidth: "3px",
                      borderLeftColor: m.has_reply ? "#10B981" : "#F59E0B",
                    }}
                  >
                    {/* Main content */}
                    <div
                      onClick={() => { navigate(`/?taskId=${m.task_id}`); }}
                      className="px-5 py-4 cursor-pointer hover:bg-[#F8FAFC] transition-colors rounded-xl"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Header row */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#EFF6FF] text-[#3B82F6]">
                              <AtSign className="w-3 h-3" />
                              {m.mentioned_username}
                            </span>
                            <ChevronRight className="w-3 h-3 text-[#CBD5E1]" />
                            <span className="text-xs text-[#64748B] truncate max-w-[200px] font-medium">
                              {m.task_name}
                            </span>
                            {m.has_reply ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[0.625rem] font-medium bg-[#ECFDF5] text-[#059669]">
                                <CheckCircle2 className="w-2.5 h-2.5" />已回复
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[0.625rem] font-medium bg-[#FFFBEB] text-[#D97706]">
                                <Clock className="w-2.5 h-2.5" />待回复
                              </span>
                            )}
                          </div>
                          {/* Note content */}
                          <p className="text-sm text-[#334155] leading-relaxed">
                            {m.note}
                          </p>
                        </div>
                        <span className="text-[0.625rem] text-[#94A3B8] font-mono shrink-0 mt-1 tabular-nums">
                          {formatTime(m.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Replies section */}
                    {m.replies.length > 0 && (
                      <div className="px-5 pb-2 border-t border-[#F1F5F9]">
                        {(!isExpanded ? m.replies.slice(-2) : m.replies).map((r) => (
                          <div key={r.id} className="flex items-start gap-2 py-1.5">
                            <CornerDownRight className="w-3 h-3 text-[#CBD5E1] mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-[0.6875rem] font-semibold text-[#7C3AED]">{r.from_username}</span>
                              <span className="text-[0.6875rem] text-[#64748B] ml-1.5">{r.content}</span>
                            </div>
                            <span className="text-[0.625rem] text-[#CBD5E1] font-mono shrink-0">{formatTime(r.created_at)}</span>
                          </div>
                        ))}
                        {m.replies.length > 2 && !isExpanded && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleExpand(m.id); }}
                            className="text-[0.6875rem] text-[#7C3AED] hover:text-[#5B21B6] mt-1 ml-5 cursor-pointer"
                          >
                            查看全部 {m.replies.length} 条回复
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
