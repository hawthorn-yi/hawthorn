import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Inbox } from "lucide-react";
import type { GanttGroup } from "@/hooks/useAnalytics";
import { STATUS_CONFIG } from "@/lib/analytics-utils";

interface GanttChartProps {
  ganttByEmployee: GanttGroup[];
  ganttByCategory: GanttGroup[];
}

function parseDate(s: string): number {
  return new Date(s + "T00:00:00").getTime();
}

function formatDateShort(s: string): string {
  if (!s) return "-";
  const d = new Date(s + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function GanttChart({ ganttByEmployee, ganttByCategory }: GanttChartProps) {
  const [mode, setMode] = useState<"employee" | "category">("employee");

  const groups = mode === "employee" ? ganttByEmployee : ganttByCategory;

  // 计算时间范围
  const { startMs, endMs, totalMs } = useMemo(() => {
    const allTasks = groups.flatMap((g) => g.tasks);
    if (allTasks.length === 0) {
      const now = Date.now();
      return { startMs: now, endMs: now + 86400000, totalMs: 86400000 };
    }

    let minDate = parseDate(allTasks[0].createdDate);
    let maxDate = parseDate(allTasks[0].deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    allTasks.forEach((t) => {
      const c = parseDate(t.createdDate);
      const d = parseDate(t.deadline);
      if (c < minDate) minDate = c;
      if (d > maxDate) maxDate = d;
    });

    if (todayMs > maxDate) maxDate = todayMs;
    if (todayMs < minDate) minDate = todayMs;

    // padding 2 天
    minDate -= 86400000 * 2;
    maxDate += 86400000 * 2;

    return { startMs: minDate, endMs: maxDate, totalMs: maxDate - minDate };
  }, [groups]);

  const getLeftPct = (dateStr: string) => {
    return ((parseDate(dateStr) - startMs) / totalMs) * 100;
  };

  const getWidthPct = (createdDate: string, deadline: string) => {
    return ((parseDate(deadline) - parseDate(createdDate)) / totalMs) * 100;
  };

  const todayLeftPct = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return ((today.getTime() - startMs) / totalMs) * 100;
  })();

  // 月份刻度
  const monthTicks = useMemo(() => {
    const ticks: { label: string; left: number }[] = [];
    const d = new Date(startMs);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    while (d.getTime() <= endMs) {
      const left = ((d.getTime() - startMs) / totalMs) * 100;
      if (left >= 0 && left <= 100) {
        ticks.push({ label: `${d.getFullYear()}/${d.getMonth() + 1}`, left });
      }
      d.setMonth(d.getMonth() + 1);
    }
    return ticks;
  }, [startMs, endMs, totalMs]);

  const allTasks = groups.flatMap((g) => g.tasks);

  if (allTasks.length === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[#1E293B] mb-3">任务甘特图</h3>
        <div className="flex flex-col items-center justify-center" style={{ height: 240 }}>
          <Inbox className="w-10 h-10 text-[#CBD5E1] mb-2" />
          <p className="text-sm text-[#94A3B8]">暂无数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
      {/* 标题 + 切换 */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-[#1E293B]">任务甘特图</h3>
        <div className="flex items-center gap-1 bg-[#F1F5F9] rounded-lg p-0.5">
          <button
            onClick={() => setMode("employee")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              mode === "employee"
                ? "bg-white text-[#3B82F6] shadow-sm"
                : "text-[#64748B] hover:text-[#334155]"
            }`}
          >
            按员工
          </button>
          <button
            onClick={() => setMode("category")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              mode === "category"
                ? "bg-white text-[#3B82F6] shadow-sm"
                : "text-[#64748B] hover:text-[#334155]"
            }`}
          >
            按分类
          </button>
        </div>
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((key) => (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: STATUS_CONFIG[key].color }}
            />
            <span className="text-xs text-[#64748B]">{STATUS_CONFIG[key].label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-0.5 h-3 bg-[#E11D48]" />
          <span className="text-xs text-[#64748B]">今日</span>
        </div>
      </div>

      {/* 甘特图主体 */}
      <div className="overflow-x-auto">
        <div className="relative" style={{ minWidth: 700 }}>
          {/* 时间轴标尺 */}
          <div className="flex border-b border-[#E2E8F0] pb-1 mb-2">
            <div className="w-[160px] shrink-0 text-xs text-[#94A3B8] font-medium">
              {mode === "employee" ? "员工 / 任务" : "分类 / 任务"}
            </div>
            <div className="flex-1 relative h-5">
              {monthTicks.map((tick, i) => (
                <div
                  key={i}
                  className="absolute top-0 text-[0.625rem] text-[#94A3B8]"
                  style={{ left: `${tick.left}%`, transform: "translateX(-50%)" }}
                >
                  {tick.label}
                </div>
              ))}
            </div>
          </div>

          {/* 分组列表 */}
          <div className="space-y-3">
            {groups.map((group, gi) => (
              <div key={group.name}>
                {/* 组标题 */}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-[160px] shrink-0 flex items-center gap-1.5">
                    {group.color && (
                      <div
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: group.color }}
                      />
                    )}
                    <span className="text-xs font-semibold text-[#334155] truncate">
                      {group.name}
                    </span>
                    <span className="text-[0.625rem] text-[#94A3B8]">({group.tasks.length})</span>
                  </div>
                </div>

                {/* 任务条 */}
                <div className="space-y-1">
                  {group.tasks.map((task, ti) => {
                    const left = getLeftPct(task.createdDate);
                    const width = Math.max(getWidthPct(task.createdDate, task.deadline), 0.5);
                    const color = STATUS_CONFIG[task.status].color;

                    return (
                      <div key={task.id} className="flex items-center group/task hover:bg-[#F8FAFC] rounded -mx-1 px-1 py-0.5 transition-colors">
                        {/* 任务名 */}
                        <div className="w-[160px] shrink-0 pr-2">
                          <span
                            className="text-xs text-[#64748B] truncate block"
                            title={task.name}
                          >
                            {task.name}
                          </span>
                        </div>

                        {/* 时间轴区 */}
                        <div className="flex-1 relative h-6">
                          {/* 今日线（只在第一组的第一行画一次是不对的，应该在所有行都画，但我们用 absolute 在整个区域画） */}
                          {/* 任务条 */}
                          <motion.div
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            transition={{
                              duration: 0.4,
                              delay: Math.min(gi * 0.05 + ti * 0.02, 0.8),
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            className="absolute top-0.5 h-5 rounded-md flex items-center overflow-hidden cursor-pointer group hover:ring-2 hover:ring-offset-1 transition-all"
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                              minWidth: 4,
                              backgroundColor: `${color}30`,
                              borderLeft: `3px solid ${color}`,
                            }}
                            title={`${task.name}\n状态: ${STATUS_CONFIG[task.status].label}\n进度: ${task.progress}%\n周期: ${formatDateShort(task.createdDate)} - ${formatDateShort(task.deadline)}`}
                          >
                            {/* 进度填充 */}
                            <div
                              className="h-full rounded-l-md"
                              style={{
                                width: `${task.progress}%`,
                                backgroundColor: color,
                                opacity: 0.8,
                              }}
                            />
                          </motion.div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 今日线（覆盖在整个时间轴上） */}
          {todayLeftPct >= 0 && todayLeftPct <= 100 && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `calc(160px + (100% - 160px) * ${todayLeftPct / 100})`,
                top: 26,
                bottom: 0,
                width: 2,
                backgroundColor: "#E11D48",
                opacity: 0.5,
              }}
            >
              <div className="absolute -top-4 -left-3 text-[0.625rem] text-[#E11D48] font-medium whitespace-nowrap">
                今日
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
