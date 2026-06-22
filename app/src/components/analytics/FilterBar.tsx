import { motion } from "framer-motion";
import { Filter, RotateCcw } from "lucide-react";
import type { AnalyticsFilters } from "@/hooks/useAnalytics";
import type { AppUser } from "@/lib/auth";
import type { CustomCategory } from "@/types";
import { STATUS_CONFIG } from "@/lib/analytics-utils";

interface FilterBarProps {
  filters: AnalyticsFilters;
  updateFilter: <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => void;
  resetFilters: () => void;
  categories: CustomCategory[];
  users: AppUser[];
}

export default function FilterBar({
  filters,
  updateFilter,
  resetFilters,
  categories,
  users,
}: FilterBarProps) {
  const hasActiveFilters =
    filters.categoryIds.length > 0 ||
    filters.userId !== null ||
    filters.statuses.length > 0 ||
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    filters.keyword !== "";

  const toggleCategory = (catId: string) => {
    const next = filters.categoryIds.includes(catId)
      ? filters.categoryIds.filter((id) => id !== catId)
      : [...filters.categoryIds, catId];
    updateFilter("categoryIds", next);
  };

  const toggleStatus = (status: string) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    updateFilter("statuses", next);
  };

  const inputClass =
    "px-2.5 py-1.5 rounded-lg text-xs text-[#334155] bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] cursor-pointer outline-none focus:ring-2 focus:ring-[#3B82F6]/20 transition-all";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-[#E2E8F0] rounded-xl p-3 sm:p-4 mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-[#64748B]" />
        <span className="text-sm font-medium text-[#334155]">数据筛选</span>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="ml-auto flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#64748B] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            重置
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* 分类筛选 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-[#94A3B8] mr-1">分类</span>
          {categories.map((cat) => {
            const active = filters.categoryIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                  active
                    ? "text-white border-transparent"
                    : "text-[#64748B] bg-white border-[#E2E8F0] hover:border-[#CBD5E1]"
                }`}
                style={active ? { backgroundColor: cat.color } : {}}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        <div className="w-px h-5 bg-[#E2E8F0] mx-1 hidden sm:block" />

        {/* 状态筛选 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-[#94A3B8] mr-1">状态</span>
          {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((key) => {
            const config = STATUS_CONFIG[key];
            const active = filters.statuses.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleStatus(key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                  active
                    ? "text-white border-transparent"
                    : "text-[#64748B] bg-white border-[#E2E8F0] hover:border-[#CBD5E1]"
                }`}
                style={active ? { backgroundColor: config.color } : {}}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        <div className="w-px h-5 bg-[#E2E8F0] mx-1 hidden sm:block" />

        {/* 员工筛选 */}
        <select
          value={filters.userId || ""}
          onChange={(e) => updateFilter("userId", e.target.value || null)}
          className={inputClass}
        >
          <option value="">全部员工</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.username}
            </option>
          ))}
        </select>

        {/* 时间范围 */}
        <input
          type="date"
          value={filters.dateFrom || ""}
          onChange={(e) => updateFilter("dateFrom", e.target.value || null)}
          className={inputClass}
          title="开始日期"
        />
        <span className="text-xs text-[#94A3B8]">至</span>
        <input
          type="date"
          value={filters.dateTo || ""}
          onChange={(e) => updateFilter("dateTo", e.target.value || null)}
          className={inputClass}
          title="结束日期"
        />

        {/* 关键词搜索 */}
        <input
          type="text"
          placeholder="搜索任务名..."
          value={filters.keyword}
          onChange={(e) => updateFilter("keyword", e.target.value)}
          className={`${inputClass} w-32`}
        />
      </div>
    </motion.div>
  );
}
