import { useMemo } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ClipboardList, Clock, User, Calendar,
  ChevronRight, AlertTriangle, Inbox,
} from "lucide-react";
import { useTaskManager } from "@/hooks/useTaskManager";
import { useAuth } from "@/contexts/AuthContext";
import type { Task } from "@/types";

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

function getWeekday(dateStr: string): string {
  if (!dateStr) return "";
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const d = new Date(dateStr + "T00:00:00");
  return weekdays[d.getDay()];
}

function isDueSoon(task: Task): boolean {
  if (task.status === "completed") return false;
  const today = new Date(new Date().toISOString().split("T")[0]);
  const deadline = new Date(task.deadline);
  const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
  return diffDays >= 0 && diffDays <= 3;
}

function getStatusBadge(task: Task): { text: string; bg: string; textColor: string } {
  if (task.status === "completed") return { text: "已完成", bg: "#ECFDF5", textColor: "#059669" };
  if (task.status === "overdue") return { text: "已逾期", bg: "#FFF1F2", textColor: "#E11D48" };
  return { text: "进行中", bg: "#EFF6FF", textColor: "#2563EB" };
}

export default function FollowUp() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tasks, allCategories } = useTaskManager();

  // Filter tasks assigned to current user, not completed/terminated
  const followUpTasks = useMemo(() => {
    if (!user) return [];
    return tasks.filter(
      (t) => t.assignee_id === user.id && t.status !== "completed" && t.status !== "terminated"
    );
  }, [tasks, user]);

  const stats = useMemo(() => {
    const total = followUpTasks.length;
    const overdue = followUpTasks.filter((t) => t.status === "overdue").length;
    const dueSoon = followUpTasks.filter((t) => isDueSoon(t) && t.status !== "overdue").length;
    return { total, overdue, dueSoon };
  }, [followUpTasks]);

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
        <h1 className="text-lg font-bold text-[#1E293B]">跟进任务</h1>
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
              <ClipboardList className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <div>
              <p className="text-[1.375rem] font-bold text-[#1E293B] tabular-nums">{stats.total}</p>
              <p className="text-xs text-[#94A3B8]">待跟进</p>
            </div>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFFBEB] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-[1.375rem] font-bold text-[#1E293B] tabular-nums">{stats.dueSoon}</p>
              <p className="text-xs text-[#94A3B8]">即将到期</p>
            </div>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFF1F2] flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#F43F5E]" />
            </div>
            <div>
              <p className="text-[1.375rem] font-bold text-[#1E293B] tabular-nums">{stats.overdue}</p>
              <p className="text-xs text-[#94A3B8]">已逾期</p>
            </div>
          </div>
        </motion.div>

        {/* Task List */}
        {followUpTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <Inbox className="w-16 h-16 text-[#CBD5E1] mb-4" />
            </motion.div>
            <p className="text-xl font-semibold text-[#64748B]">没有待跟进任务</p>
            <p className="text-sm text-[#94A3B8] mt-1">所有指派给你的任务都已完成 🎉</p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {followUpTasks.map((task, index) => {
                const badge = getStatusBadge(task);
                const catInfo = allCategories.find((c) => c.id === task.category);
                const borderColor = task.status === "overdue" ? "#F43F5E"
                  : isDueSoon(task) ? "#F59E0B" : "#3B82F6";

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.35, delay: index * 0.06 }}
                    whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    onClick={() => navigate(`/?taskId=${task.id}`)}
                    className="bg-white border border-[#E2E8F0] rounded-xl px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-[#CBD5E1] transition-all duration-200 cursor-pointer"
                    style={{ borderLeftWidth: "3px", borderLeftColor: borderColor }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-mono text-xs text-[#94A3B8]">#{index + 1}</span>
                          <span className="text-sm font-semibold text-[#334155] truncate">{task.name}</span>
                          {catInfo && (
                            <span className="shrink-0 px-2 py-0.5 rounded-full text-[0.625rem] font-medium whitespace-nowrap"
                              style={{ backgroundColor: catInfo.color + "20", color: catInfo.color }}>
                              {catInfo.name}
                            </span>
                          )}
                          <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                            style={{ backgroundColor: badge.bg, color: badge.textColor }}>
                            {badge.text}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap text-xs">
                          <div className="flex items-center gap-1 text-[#94A3B8]">
                            <Calendar className="w-3 h-3" />
                            <span className="font-mono">截止: {formatDate(task.deadline)} {getWeekday(task.deadline)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-[60px] h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-[#3B82F6]" style={{ width: `${task.progress}%` }} />
                            </div>
                            <span className="text-[#475569] font-semibold tabular-nums">{task.progress}%</span>
                          </div>
                          {task.assignee_username && (
                            <div className="flex items-center gap-1 text-[#8B5CF6]">
                              <User className="w-3 h-3" />
                              <span>指派给: {task.assignee_username}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#CBD5E1] shrink-0 mt-1" />
                    </div>
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
