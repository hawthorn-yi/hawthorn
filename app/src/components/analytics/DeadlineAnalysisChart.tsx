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
import type { DeadlineStat } from "@/hooks/useAnalytics";

interface DeadlineAnalysisChartProps {
  data: DeadlineStat[];
}

export default function DeadlineAnalysisChart({ data }: DeadlineAnalysisChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[#1E293B] mb-3">截止日期 / 逾期分析</h3>
        <div className="flex flex-col items-center justify-center" style={{ height: 240 }}>
          <Inbox className="w-10 h-10 text-[#CBD5E1] mb-2" />
          <p className="text-sm text-[#94A3B8]">无即将到期或逾期任务</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.name.length > 6 ? d.name.substring(0, 6) + "…" : d.name,
    即将到期: d.dueSoon,
    已逾期: d.overdue,
    正常: d.normal,
  }));

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-[#1E293B] mb-3">截止日期 / 逾期分析</h3>
      <div style={{ height: Math.max(240, data.length * 44 + 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={{ stroke: "#E2E8F0" }} allowDecimals={false} />
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
            <Bar dataKey="即将到期" stackId="a" fill="#F59E0B" />
            <Bar dataKey="已逾期" stackId="a" fill="#E11D48" />
            <Bar dataKey="正常" stackId="a" fill="#10B981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
