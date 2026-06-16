import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, AtSign, Inbox, ChevronRight,
  CornerDownRight, CheckCircle2, Clock,
  ChevronDown, X, OctagonX,
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
  const { groupedMentions, loading, dismissMention } = useMyMentions();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mentionedUserFilter, setMentionedUserFilter] = useState<string>("");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleDismiss = async (progressEntryId: string) => {
    setDismissingId(progressEntryId);
    try {
      await dismissMention(progressEntryId);
    } finally {
      setDismissingId(null);
    }
  };

  // Extract all unique mentioned users for filter
  const allMentionedUsers = useMemo(() => {
    const users = new Set<string>();
    for (const g of groupedMentions) {
      for (const u of g.mentioned_users) {
        users.add(u);
      }
    }
    return Array.from(users).sort();
  }, [groupedMentions]);

  // Filter groups by selected user
  const filteredGroups = useMemo(() => {
    if (!mentionedUserFilter) return groupedMentions;
    return groupedMentions.filter((g) => g.mentioned_users.includes(mentionedUserFilter));
  }, [groupedMentions, mentionedUserFilter]);

  const repliedCount = filteredGroups.filter((g) => g.has_reply && !g.dismissed).length;
  const dismissedCount = filteredGroups.filter((g) => g.dismissed).length;
  const unrepliedCount = filteredGroups.filter((g) => !g.has_reply).length;

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
          className="grid grid-cols-4 gap-3 mb-6"
        >
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
              <AtSign className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <div>
              <p className="text-[1.375rem] font-bold text-[#1E293B] tabular-nums">{filteredGroups.length}</p>
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
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] flex items-center justify-center">
              <OctagonX className="w-5 h-5 text-[#94A3B8]" />
            </div>
            <div>
              <p className="text-[1.375rem] font-bold text-[#1E293B] tabular-nums">{dismissedCount}</p>
              <p className="text-xs text-[#94A3B8]">回复终止</p>
            </div>
          </div>
        </motion.div>

        {/* Mentioned User Filter */}
        {allMentionedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative mb-4"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#64748B] shrink-0">按@人筛选:</span>
              <button
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#334155] hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors cursor-pointer"
              >
                {mentionedUserFilter ? (
                  <span className="inline-flex items-center gap-1">
                    <AtSign className="w-3 h-3" />{mentionedUserFilter}
                  </span>
                ) : (
                  <span>全部</span>
                )}
                <ChevronDown className={`w-3 h-3 text-[#94A3B8] transition-transform ${filterDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {mentionedUserFilter && (
                <button
                  onClick={() => setMentionedUserFilter("")}
                  className="p-1 rounded hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#64748B] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <AnimatePresence>
              {filterDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setFilterDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-1 z-20 bg-white border border-[#E2E8F0] rounded-lg shadow-lg py-1.5 min-w-[160px]"
                  >
                    <button
                      onClick={() => { setMentionedUserFilter(""); setFilterDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer ${!mentionedUserFilter ? "bg-[#EFF6FF] text-[#2563EB] font-medium" : "text-[#475569] hover:bg-[#F8FAFC]"}`}
                    >
                      全部 ({groupedMentions.length})
                    </button>
                    {allMentionedUsers.map((user) => {
                      const count = groupedMentions.filter((g) => g.mentioned_users.includes(user)).length;
                      return (
                        <button
                          key={user}
                          onClick={() => { setMentionedUserFilter(user); setFilterDropdownOpen(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer ${mentionedUserFilter === user ? "bg-[#EFF6FF] text-[#2563EB] font-medium" : "text-[#475569] hover:bg-[#F8FAFC]"}`}
                        >
                          <AtSign className="w-3 h-3 shrink-0" />{user}
                          <span className="ml-auto text-[#94A3B8] tabular-nums">({count})</span>
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#E2E8F0] border-t-[#3B82F6] rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredGroups.length === 0 && (
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
            <p className="text-sm text-[#94A3B8] mt-1">
              {mentionedUserFilter ? `没有@${mentionedUserFilter}的消息` : "当你在任务中 @别人 时，会在这里显示"}
            </p>
            {mentionedUserFilter && (
              <button
                onClick={() => setMentionedUserFilter("")}
                className="mt-3 text-xs font-medium text-[#3B82F6] hover:underline cursor-pointer"
              >
                清除筛选
              </button>
            )}
          </motion.div>
        )}

        {/* Mention List */}
        {!loading && filteredGroups.length > 0 && (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {filteredGroups.map((g, index) => {
                const isExpanded = expandedId === g.progress_entry_id;

                // Determine border color and status
                const borderColor = g.dismissed ? "#94A3B8" : g.has_reply ? "#10B981" : "#F59E0B";
                const cardOpacity = g.dismissed ? 0.6 : 1;

                return (
                  <motion.div
                    key={g.progress_entry_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200"
                    style={{
                      borderLeftWidth: "3px",
                      borderLeftColor: borderColor,
                      opacity: cardOpacity,
                    }}
                  >
                    {/* Main content */}
                    <div
                      onClick={() => { navigate(`/?taskId=${g.task_id}`); }}
                      className="px-5 py-4 cursor-pointer hover:bg-[#F8FAFC] transition-colors rounded-xl"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* @'d users */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {g.mentioned_users.map((user) => (
                              <span key={user} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#EFF6FF] text-[#3B82F6]">
                                <AtSign className="w-3 h-3" />
                                {user}
                              </span>
                            ))}
                            <ChevronRight className="w-3 h-3 text-[#CBD5E1] shrink-0" />
                            <span className="text-xs text-[#64748B] truncate max-w-[200px] font-medium">
                              {g.task_name}
                            </span>
                            {/* Status badge */}
                            {g.dismissed ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[0.625rem] font-medium bg-[#F1F5F9] text-[#94A3B8]">
                                <OctagonX className="w-2.5 h-2.5" />回复终止
                              </span>
                            ) : g.has_reply ? (
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
                          <p className={`text-sm leading-relaxed ${g.dismissed ? "text-[#94A3B8] line-through" : "text-[#334155]"}`}>
                            {g.note}
                          </p>
                        </div>
                        <span className="text-[0.625rem] text-[#94A3B8] font-mono shrink-0 mt-1 tabular-nums">
                          {formatTime(g.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Replies section */}
                    {g.replies.length > 0 && (
                      <div className="px-5 pb-2 border-t border-[#F1F5F9]">
                        {(!isExpanded ? g.replies.slice(-2) : g.replies).map((r) => (
                          <div key={r.id} className="flex items-start gap-2 py-1.5">
                            <CornerDownRight className="w-3 h-3 text-[#CBD5E1] mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-[0.6875rem] font-semibold text-[#7C3AED]">{r.from_username}</span>
                              <span className="text-[0.6875rem] text-[#64748B] ml-1.5">{r.content}</span>
                            </div>
                            <span className="text-[0.625rem] text-[#CBD5E1] font-mono shrink-0">{formatTime(r.created_at)}</span>
                          </div>
                        ))}
                        {g.replies.length > 2 && !isExpanded && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleExpand(g.progress_entry_id); }}
                            className="text-[0.6875rem] text-[#7C3AED] hover:text-[#5B21B6] mt-1 ml-5 cursor-pointer"
                          >
                            查看全部 {g.replies.length} 条回复
                          </button>
                        )}
                      </div>
                    )}

                    {/* Dismiss button - only for unreplied mentions */}
                    {!g.has_reply && !g.dismissed && (
                      <div className="px-5 pb-3 border-t border-[#F1F5F9] pt-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDismiss(g.progress_entry_id); }}
                          disabled={dismissingId === g.progress_entry_id}
                          className="flex items-center gap-1.5 text-[0.6875rem] text-[#94A3B8] hover:text-[#64748B] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <OctagonX className="w-3 h-3" />
                          {dismissingId === g.progress_entry_id ? "处理中..." : "终止回复"}
                        </button>
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
