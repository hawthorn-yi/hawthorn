import { motion } from "framer-motion";
import { RefreshCw, Download } from "lucide-react";

interface AnalyticsHeaderProps {
  onRefresh: () => void;
  onExport: () => void;
  loading?: boolean;
}

export default function AnalyticsHeader({ onRefresh, onExport, loading }: AnalyticsHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6"
    >
      <div>
        <h1 className="font-bold text-[#1E293B] tracking-tight text-[1.5rem] sm:text-[1.75rem] md:text-[2rem]" style={{ lineHeight: 1.15 }}>
          任务数据看板
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">项目概况 · 员工负载 · 任务趋势 · 多维度数据分析</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#64748B] hover:text-[#334155] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer border border-[#E2E8F0]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">刷新</span>
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-[#10B981] hover:bg-[#059669] rounded-lg transition-colors cursor-pointer shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>导出 Excel</span>
        </button>
      </div>
    </motion.div>
  );
}
