import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Inbox } from "lucide-react";
import type { EmployeeStat } from "@/hooks/useAnalytics";

interface EmployeeTaskBarChartProps {
  data: EmployeeStat[];
}

const STATUS_COLORS = {
  active: "#3B82F6",
  completed: "#10B981",
  overdue: "#E11D48",
  terminated: "#94A3B8",
};

export default function EmployeeTaskBarChart({ data }: EmployeeTaskBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[#1E293B] mb-3">员工任务数量对比</h3>
        <EmptyState />
      </div>
    );
  }

  const chartData = data.map((s) => ({
    name: s.name.length > 6 ? s.name.substring(0, 6) + "…" : s.name,
    进行中: s.active,
    已完成: s.completed,
    已逾期: s.overdue,
    已终止: s.terminated,
  }));

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-[#1E293B] mb-3">员工任务数量对比</h3>
      <div style={{ height: Math.max(240, data.length * 44 + 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={{ stroke: "#E2E8F0" }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={{ stroke: "#E2E8F0" }}
              width={70}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }}
              cursor={{ fill: "#F8FAFC" }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Bar dataKey="进行中" stackId="a" fill={STATUS_COLORS.active} radius={[0, 0, 0, 0]} />
            <Bar dataKey="已完成" stackId="a" fill={STATUS_COLORS.completed} radius={[0, 0, 0, 0]} />
            <Bar dataKey="已逾期" stackId="a" fill={STATUS_COLORS.overdue} radius={[0, 0, 0, 0]} />
            <Bar dataKey="已终止" stackId="a" fill={STATUS_COLORS.terminated} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center" style={{ height: 240 }}>
      <Inbox className="w-10 h-10 text-[#CBD5E1] mb-2" />
      <p className="text-sm text-[#94A3B8]">暂无数据</p>
    </div>
  );
}
