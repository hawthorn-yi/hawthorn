import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Inbox } from "lucide-react";

interface CategoryPieChartProps {
  data: { name: string; value: number; color: string }[];
}

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[#1E293B] mb-3">任务分类分布</h3>
        <div className="flex flex-col items-center justify-center" style={{ height: 240 }}>
          <Inbox className="w-10 h-10 text-[#CBD5E1] mb-2" />
          <p className="text-sm text-[#94A3B8]">暂无数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-[#1E293B] mb-3">任务分类分布</h3>
      <div className="relative" style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(value: number, name: string) => [`${value} 个任务`, name]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #E2E8F0",
                fontSize: 12,
              }}
            />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) =>
                percent && percent > 0.08 ? `${name} ${Math.round(percent * 100)}%` : ""
              }
              labelLine={false}
              style={{ fontSize: 11 }}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* 图例 */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-[#64748B]">
              {entry.name}
              <span className="font-medium text-[#334155] ml-1">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
