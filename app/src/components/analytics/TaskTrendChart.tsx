import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Inbox } from "lucide-react";
import type { TrendPoint } from "@/hooks/useAnalytics";

interface TaskTrendChartProps {
  data: TrendPoint[];
}

export default function TaskTrendChart({ data }: TaskTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[#1E293B] mb-3">任务趋势（创建 / 完成）</h3>
        <div className="flex flex-col items-center justify-center" style={{ height: 280 }}>
          <Inbox className="w-10 h-10 text-[#CBD5E1] mb-2" />
          <p className="text-sm text-[#94A3B8]">暂无数据</p>
        </div>
      </div>
    );
  }

  // 格式化月份显示
  const chartData = data.map((d) => ({
    ...d,
    label: d.period.length === 7 ? d.period.replace("-", "年") + "月" : d.period,
  }));

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-[#1E293B] mb-3">任务趋势（创建 / 完成）</h3>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis
              dataKey="label"
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
              formatter={(value: number, name: string) => [`${value} 个`, name]}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Line
              type="monotone"
              dataKey="created"
              name="新增任务"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 3, fill: "#3B82F6" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="completed"
              name="完成任务"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 3, fill: "#10B981" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
