import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Inbox } from "lucide-react";

interface StatusPieChartProps {
  data: { name: string; value: number; color: string }[];
  total: number;
}

export default function StatusPieChart({ data, total }: StatusPieChartProps) {
  if (total === 0) {
    return <EmptyState />;
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-[#1E293B] mb-3">任务状态分布</h3>
      <div className="relative" style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* 中心文字 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-[#1E293B]">{total}</span>
          <span className="text-xs text-[#94A3B8]">总任务</span>
        </div>
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

function EmptyState() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-[#1E293B] mb-3">任务状态分布</h3>
      <div className="flex flex-col items-center justify-center" style={{ height: 240 }}>
        <Inbox className="w-10 h-10 text-[#CBD5E1] mb-2" />
        <p className="text-sm text-[#94A3B8]">暂无数据</p>
      </div>
    </div>
  );
}
