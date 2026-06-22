import { useState, useEffect, useMemo, useCallback } from "react";
import { useTaskManager } from "@/hooks/useTaskManager";
import { getAllUsers } from "@/lib/auth";
import type { AppUser } from "@/lib/auth";
import {
  calcKpi,
  calcStatusDistribution,
  calcCategoryDistribution,
  calcEmployeeStats,
  calcProgressDistribution,
  calcTrend,
  calcDeadlineAnalysis,
  groupTasksForGantt,
  exportAnalyticsExcel,
  type KpiData,
  type EmployeeStat,
  type TrendPoint,
  type DeadlineStat,
  type GanttGroup,
} from "@/lib/analytics-utils";

export interface AnalyticsFilters {
  categoryIds: string[];
  userId: string | null;
  statuses: string[];
  dateFrom: string | null;
  dateTo: string | null;
  keyword: string;
}

const DEFAULT_FILTERS: AnalyticsFilters = {
  categoryIds: [],
  userId: null,
  statuses: [],
  dateFrom: null,
  dateTo: null,
  keyword: "",
};

export function useAnalytics() {
  const { tasks, allCategories, loading, refreshData, followUpTasks } = useTaskManager();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [filters, setFilters] = useState<AnalyticsFilters>(DEFAULT_FILTERS);

  // 获取用户列表
  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .catch(() => {});
  }, []);

  // 构建 id → username 映射
  const userMapById = useMemo(() => {
    const m = new Map<string, string>();
    users.forEach((u) => m.set(u.id, u.username));
    return m;
  }, [users]);

  // 筛选后的任务
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(t.category)) {
        return false;
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(t.status)) {
        return false;
      }
      if (filters.userId) {
        const taskUserId = t.assignee_id || t.owner_id;
        if (taskUserId !== filters.userId) return false;
      }
      if (filters.dateFrom && t.createdDate < filters.dateFrom) return false;
      if (filters.dateTo && t.createdDate > filters.dateTo) return false;
      if (filters.keyword && !t.name.toLowerCase().includes(filters.keyword.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [tasks, filters]);

  // 派生计算
  const kpi = useMemo(() => calcKpi(filteredTasks, userMapById), [filteredTasks, userMapById]);
  const statusDistribution = useMemo(() => calcStatusDistribution(filteredTasks), [filteredTasks]);
  const categoryDistribution = useMemo(
    () => calcCategoryDistribution(filteredTasks, allCategories),
    [filteredTasks, allCategories]
  );
  const employeeStats = useMemo(
    () => calcEmployeeStats(filteredTasks, userMapById),
    [filteredTasks, userMapById]
  );
  // 员工堆叠柱状图：排除管理员（仅展示其他员工）
  const employeeStatsForChart = useMemo(
    () => employeeStats.filter((s) => s.name.toLowerCase() !== "kevin"),
    [employeeStats]
  );
  const progressDistribution = useMemo(() => calcProgressDistribution(filteredTasks), [filteredTasks]);
  const trendData = useMemo(() => calcTrend(filteredTasks, "month"), [filteredTasks]);
  const deadlineAnalysis = useMemo(
    () => calcDeadlineAnalysis(filteredTasks, userMapById),
    [filteredTasks, userMapById]
  );
  const ganttByEmployee = useMemo(
    () => groupTasksForGantt(filteredTasks, userMapById, allCategories, "employee"),
    [filteredTasks, userMapById, allCategories]
  );
  const ganttByCategory = useMemo(
    () => groupTasksForGantt(filteredTasks, userMapById, allCategories, "category"),
    [filteredTasks, userMapById, allCategories]
  );

  const updateFilter = useCallback(
    <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handleExportExcel = useCallback(() => {
    exportAnalyticsExcel(filteredTasks, allCategories, userMapById, kpi);
  }, [filteredTasks, allCategories, userMapById, kpi]);

  return {
    tasks: filteredTasks,
    allCategories,
    users,
    userMapById,
    loading,
    filters,
    updateFilter,
    resetFilters,
    kpi,
    statusDistribution,
    categoryDistribution,
    employeeStats,
    employeeStatsForChart,
    progressDistribution,
    trendData,
    deadlineAnalysis,
    ganttByEmployee,
    ganttByCategory,
    refreshData,
    followUpCount: followUpTasks().length,
    handleExportExcel,
  };
}

export type { KpiData, EmployeeStat, TrendPoint, DeadlineStat, GanttGroup };
