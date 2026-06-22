import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Inbox } from "lucide-react";

interface ProgressDistributionChartProps {
  data: { range: string; count: number; color: string }[];
}

export default function ProgressDistributionChart({ data }: ProgressDistributionChartProps) {
  const total = data.reduce((s, d) => s + d.count, 0);

  if (total === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[#1E293B] mb-3">任务进度分布</h3>
        <div className="flex flex-col items-center justify-center" style={{ height: 240 }}>
          <Inbox className="w-10 h-10 text-[#CBD5E1] mb-2" />
          <p className="text-sm text-[#94A3B8]">暂无数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-[#1E293B] mb-3">任务进度分布</h3>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="range"
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              axisLine={{ stroke: "#E2E8F0" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              axisLine={{ stroke: "#E2E8F0" }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }}
              cursor={{ fill: "#F8FAFC" }}
              formatter={(value: number) => [`${value} 个任务`, "数量"]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.range} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
