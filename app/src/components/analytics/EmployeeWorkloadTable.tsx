import { motion } from "framer-motion";
import type { EmployeeStat } from "@/hooks/useAnalytics";

interface EmployeeWorkloadTableProps {
  data: EmployeeStat[];
}

export default function EmployeeWorkloadTable({ data }: EmployeeWorkloadTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[#1E293B] mb-3">员工负载分析</h3>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-[#94A3B8]">暂无数据</p>
        </div>
      </div>
    );
  }

  // 汇总行
  const summary = data.reduce(
    (acc, s) => ({
      total: acc.total + s.total,
      active: acc.active + s.active,
      completed: acc.completed + s.completed,
      overdue: acc.overdue + s.overdue,
      terminated: acc.terminated + s.terminated,
    }),
    { total: 0, active: 0, completed: 0, overdue: 0, terminated: 0 }
  );
  const avgProgress =
    data.length > 0
      ? Math.round(data.reduce((s, d) => s + d.avgProgress, 0) / data.length)
      : 0;
  const avgCompletion =
    data.length > 0
      ? Math.round(data.reduce((s, d) => s + d.completionRate, 0) / data.length)
      : 0;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      <div className="p-4 sm:p-5 pb-3">
        <h3 className="text-sm font-semibold text-[#1E293B]">员工负载分析</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-y border-[#E2E8F0] bg-[#F8FAFC]">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#64748B]">员工</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-[#64748B]">总任务</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-[#64748B]">进行中</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-[#64748B]">已完成</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-[#64748B]">已逾期</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-[#64748B] hidden sm:table-cell">已终止</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-[#64748B]">平均进度</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-[#64748B]">完成率</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s, i) => (
              <motion.tr
                key={s.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[0.625rem] font-bold text-[#64748B]">
                      {s.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-[#334155]">{s.name}</span>
                  </div>
                </td>
                <td className="text-center px-3 py-2.5 text-sm font-semibold text-[#1E293B] tabular-nums">{s.total}</td>
                <td className="text-center px-3 py-2.5 text-sm text-[#3B82F6] tabular-nums">{s.active}</td>
                <td className="text-center px-3 py-2.5 text-sm text-[#10B981] tabular-nums">{s.completed}</td>
                <td className="text-center px-3 py-2.5 text-sm text-[#E11D48] tabular-nums">{s.overdue}</td>
                <td className="text-center px-3 py-2.5 text-sm text-[#94A3B8] tabular-nums hidden sm:table-cell">{s.terminated}</td>
                <td className="text-center px-3 py-2.5">
                  <div className="flex items-center gap-1.5 justify-center">
                    <div className="w-12 h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                      <div className="h-full rounded-full bg-[#8B5CF6]" style={{ width: `${s.avgProgress}%` }} />
                    </div>
                    <span className="text-xs text-[#64748B] tabular-nums">{s.avgProgress}%</span>
                  </div>
                </td>
                <td className="text-center px-3 py-2.5 text-sm font-medium text-[#10B981] tabular-nums">{s.completionRate}%</td>
              </motion.tr>
            ))}
            {/* 汇总行 */}
            <tr className="border-t-2 border-[#E2E8F0] bg-[#F8FAFC] font-semibold">
              <td className="px-4 py-2.5 text-sm text-[#1E293B]">合计</td>
              <td className="text-center px-3 py-2.5 text-sm text-[#1E293B] tabular-nums">{summary.total}</td>
              <td className="text-center px-3 py-2.5 text-sm text-[#3B82F6] tabular-nums">{summary.active}</td>
              <td className="text-center px-3 py-2.5 text-sm text-[#10B981] tabular-nums">{summary.completed}</td>
              <td className="text-center px-3 py-2.5 text-sm text-[#E11D48] tabular-nums">{summary.overdue}</td>
              <td className="text-center px-3 py-2.5 text-sm text-[#94A3B8] tabular-nums hidden sm:table-cell">{summary.terminated}</td>
              <td className="text-center px-3 py-2.5 text-sm text-[#8B5CF6] tabular-nums">{avgProgress}%</td>
              <td className="text-center px-3 py-2.5 text-sm text-[#10B981] tabular-nums">{avgCompletion}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
