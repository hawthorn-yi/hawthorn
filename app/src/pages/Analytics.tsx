import Layout from "@/components/Layout";
import { useAnalytics } from "@/hooks/useAnalytics";
import { toast } from "sonner";
import AnalyticsHeader from "@/components/analytics/AnalyticsHeader";
import FilterBar from "@/components/analytics/FilterBar";
import KpiCards from "@/components/analytics/KpiCards";
import StatusPieChart from "@/components/analytics/StatusPieChart";
import CategoryPieChart from "@/components/analytics/CategoryPieChart";
import EmployeeTaskBarChart from "@/components/analytics/EmployeeTaskBarChart";
import ProgressDistributionChart from "@/components/analytics/ProgressDistributionChart";
import TaskTrendChart from "@/components/analytics/TaskTrendChart";
import GanttChart from "@/components/analytics/GanttChart";
import EmployeeWorkloadTable from "@/components/analytics/EmployeeWorkloadTable";
import DeadlineAnalysisChart from "@/components/analytics/DeadlineAnalysisChart";

export default function Analytics() {
  const {
    allCategories,
    users,
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
    followUpCount,
    handleExportExcel,
  } = useAnalytics();

  const handleRefresh = () => {
    refreshData();
    toast.success("数据已刷新");
  };

  const handleExport = () => {
    try {
      handleExportExcel();
      toast.success("Excel 已导出");
    } catch {
      toast.error("导出失败，请重试");
    }
  };

  if (loading) {
    return (
      <Layout followUpCount={followUpCount}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#94A3B8]">加载看板数据...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout followUpCount={followUpCount}>
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <AnalyticsHeader onRefresh={handleRefresh} onExport={handleExport} loading={loading} />

        <FilterBar
          filters={filters}
          updateFilter={updateFilter}
          resetFilters={resetFilters}
          categories={allCategories}
          users={users}
        />

        <KpiCards kpi={kpi} />

        {/* 图表网格 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatusPieChart data={statusDistribution} total={kpi.total} />
          <CategoryPieChart data={categoryDistribution} />
          <EmployeeTaskBarChart data={employeeStatsForChart} />
          <ProgressDistributionChart data={progressDistribution} />

          <div className="lg:col-span-2">
            <TaskTrendChart data={trendData} />
          </div>

          <div className="lg:col-span-2">
            <GanttChart
              ganttByEmployee={ganttByEmployee}
              ganttByCategory={ganttByCategory}
            />
          </div>

          <div className="lg:col-span-2">
            <EmployeeWorkloadTable data={employeeStats} />
          </div>

          <div className="lg:col-span-2">
            <DeadlineAnalysisChart data={deadlineAnalysis} />
          </div>
        </div>

        {/* 底部说明 */}
        <p className="text-center text-xs text-[#CBD5E1] mt-6 mb-2">
          数据实时同步 · 共 {kpi.total} 个任务 · {users.length} 位团队成员
        </p>
      </div>
    </Layout>
  );
}
