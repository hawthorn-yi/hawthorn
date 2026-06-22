import * as XLSX from "xlsx";
import type { Task, CustomCategory } from "@/types";

// ─── 状态配置 ───
export const STATUS_CONFIG = {
  active: { label: "进行中", color: "#3B82F6", bg: "#EFF6FF" },
  completed: { label: "已完成", color: "#10B981", bg: "#ECFDF5" },
  overdue: { label: "已逾期", color: "#E11D48", bg: "#FFF1F2" },
  terminated: { label: "已终止", color: "#94A3B8", bg: "#F1F5F9" },
} as const;

export type StatusKey = keyof typeof STATUS_CONFIG;

// ─── 进度区间配置 ───
export const PROGRESS_RANGES = [
  { range: "0-25%", min: 0, max: 25, color: "#EF4444" },
  { range: "25-50%", min: 25, max: 50, color: "#F59E0B" },
  { range: "50-75%", min: 50, max: 75, color: "#3B82F6" },
  { range: "75-99%", min: 75, max: 100, color: "#8B5CF6" },
  { range: "100%", min: 100, max: 101, color: "#10B981" },
];

// ─── 日期工具 ───
function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function daysUntil(dateStr: string): number {
  const today = new Date(getToday() + "T00:00:00");
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

/** 判断任务是否即将到期（0~7 天内） */
export function isDueSoon(task: Task): boolean {
  if (task.status === "completed" || task.status === "terminated") return false;
  const days = daysUntil(task.deadline);
  return days >= 0 && days <= 7;
}

// ─── 用户名解析 ───
export function resolveAssignee(task: Task, userMapById: Map<string, string>): string {
  return (
    task.assignee_username ||
    userMapById.get(task.assignee_id || "") ||
    userMapById.get(task.owner_id || "") ||
    "未指派"
  );
}

// ─── KPI 计算 ───
export interface KpiData {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  terminated: number;
  avgProgress: number;
  dueSoon: number;
  employeeCount: number;
}

export function calcKpi(tasks: Task[], userMapById: Map<string, string>): KpiData {
  const total = tasks.length;
  const active = tasks.filter((t) => t.status === "active").length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const overdue = tasks.filter((t) => t.status === "overdue").length;
  const terminated = tasks.filter((t) => t.status === "terminated").length;
  const avgProgress = total > 0 ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / total) : 0;
  const dueSoon = tasks.filter(isDueSoon).length;

  const employeeNames = new Set<string>();
  tasks.forEach((t) => {
    const name = resolveAssignee(t, userMapById);
    if (name !== "未指派") employeeNames.add(name);
  });

  return {
    total,
    active,
    completed,
    overdue,
    terminated,
    avgProgress,
    dueSoon,
    employeeCount: employeeNames.size,
  };
}

// ─── 状态分布 ───
export function calcStatusDistribution(tasks: Task[]) {
  return (Object.keys(STATUS_CONFIG) as StatusKey[])
    .map((key) => ({
      name: STATUS_CONFIG[key].label,
      value: tasks.filter((t) => t.status === key).length,
      color: STATUS_CONFIG[key].color,
    }))
    .filter((d) => d.value > 0);
}

// ─── 分类分布 ───
export function calcCategoryDistribution(tasks: Task[], categories: CustomCategory[]) {
  return categories
    .map((cat) => ({
      name: cat.name,
      value: tasks.filter((t) => t.category === cat.id).length,
      color: cat.color,
    }))
    .filter((d) => d.value > 0);
}

// ─── 员工任务统计 ───
export interface EmployeeStat {
  name: string;
  total: number;
  active: number;
  completed: number;
  overdue: number;
  terminated: number;
  avgProgress: number;
  completionRate: number;
}

export function calcEmployeeStats(tasks: Task[], userMapById: Map<string, string>): EmployeeStat[] {
  const map = new Map<string, Task[]>();
  tasks.forEach((t) => {
    const name = resolveAssignee(t, userMapById);
    if (!map.has(name)) map.set(name, []);
    map.get(name)!.push(t);
  });

  const stats: EmployeeStat[] = [];
  map.forEach((taskList, name) => {
    const total = taskList.length;
    const active = taskList.filter((t) => t.status === "active").length;
    const completed = taskList.filter((t) => t.status === "completed").length;
    const overdue = taskList.filter((t) => t.status === "overdue").length;
    const terminated = taskList.filter((t) => t.status === "terminated").length;
    const avgProgress = total > 0 ? Math.round(taskList.reduce((s, t) => s + t.progress, 0) / total) : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    stats.push({ name, total, active, completed, overdue, terminated, avgProgress, completionRate });
  });

  return stats.sort((a, b) => b.total - a.total);
}

// ─── 进度分布 ───
export function calcProgressDistribution(tasks: Task[]) {
  return PROGRESS_RANGES.map((r) => ({
    range: r.range,
    count: tasks.filter((t) => {
      if (r.range === "100%") return t.progress === 100;
      return t.progress >= r.min && t.progress < r.max;
    }).length,
    color: r.color,
  }));
}

// ─── 趋势数据 ───
export interface TrendPoint {
  period: string;
  created: number;
  completed: number;
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const year = d.getFullYear();
  const onejan = new Date(year, 0, 1);
  const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function calcTrend(tasks: Task[], granularity: "month" | "week" = "month"): TrendPoint[] {
  const map = new Map<string, { created: number; completed: number }>();

  tasks.forEach((t) => {
    // 创建时间
    if (t.createdDate) {
      const createdKey =
        granularity === "month" ? t.createdDate.substring(0, 7) : getWeekKey(t.createdDate);
      if (!map.has(createdKey)) map.set(createdKey, { created: 0, completed: 0 });
      map.get(createdKey)!.created++;
    }

    // 完成时间（history 中进度首次达到 100 的记录）
    if (t.status === "completed" || t.progress === 100) {
      const completedEntry = [...t.history].find((h) => h.progress === 100);
      if (completedEntry) {
        const completedDate = completedEntry.timestamp.split("T")[0];
        const completedKey =
          granularity === "month" ? completedDate.substring(0, 7) : getWeekKey(completedDate);
        if (!map.has(completedKey)) map.set(completedKey, { created: 0, completed: 0 });
        map.get(completedKey)!.completed++;
      }
    }
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, data]) => ({ period, ...data }));
}

// ─── 截止分析 ───
export interface DeadlineStat {
  name: string;
  dueSoon: number;
  overdue: number;
  normal: number;
}

export function calcDeadlineAnalysis(tasks: Task[], userMapById: Map<string, string>): DeadlineStat[] {
  const map = new Map<string, DeadlineStat>();

  tasks.forEach((t) => {
    const name = resolveAssignee(t, userMapById);
    if (!map.has(name)) map.set(name, { name, dueSoon: 0, overdue: 0, normal: 0 });
    const entry = map.get(name)!;

    if (t.status === "overdue") entry.overdue++;
    else if (isDueSoon(t)) entry.dueSoon++;
    else if (t.status !== "terminated") entry.normal++;
  });

  return Array.from(map.values())
    .filter((d) => d.dueSoon > 0 || d.overdue > 0)
    .sort((a, b) => b.overdue + b.dueSoon - (a.overdue + a.dueSoon));
}

// ─── 甘特图分组 ───
export interface GanttGroup {
  name: string;
  color?: string;
  tasks: Task[];
}

export function groupTasksForGantt(
  tasks: Task[],
  userMapById: Map<string, string>,
  categories: CustomCategory[],
  mode: "employee" | "category"
): GanttGroup[] {
  if (mode === "employee") {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      const name = resolveAssignee(t, userMapById);
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(t);
    });
    return Array.from(map.entries())
      .map(([name, taskList]) => ({ name, tasks: taskList }))
      .sort((a, b) => b.tasks.length - a.tasks.length);
  }

  // 按分类分组
  const groups: GanttGroup[] = [];
  categories.forEach((cat) => {
    const catTasks = tasks.filter((t) => t.category === cat.id);
    if (catTasks.length > 0) {
      groups.push({ name: cat.name, color: cat.color, tasks: catTasks });
    }
  });
  const uncategorized = tasks.filter((t) => !categories.find((c) => c.id === t.category));
  if (uncategorized.length > 0) {
    groups.push({ name: "未分类", color: "#94A3B8", tasks: uncategorized });
  }
  return groups;
}

// ─── Excel 导出 ───
export function exportAnalyticsExcel(
  tasks: Task[],
  categories: CustomCategory[],
  userMapById: Map<string, string>,
  kpi: KpiData
) {
  const today = new Date().toISOString().split("T")[0];

  // Sheet 1: 看板概况
  const overviewRows = [
    { 指标: "任务总数", 数值: kpi.total },
    { 指标: "进行中", 数值: kpi.active },
    { 指标: "已完成", 数值: kpi.completed },
    { 指标: "已逾期", 数值: kpi.overdue },
    { 指标: "已终止", 数值: kpi.terminated },
    { 指标: "平均进度(%)", 数值: kpi.avgProgress },
    { 指标: "即将到期(7天内)", 数值: kpi.dueSoon },
    { 指标: "参与员工数", 数值: kpi.employeeCount },
  ];

  // Sheet 2: 任务明细
  const taskRows = tasks.map((t) => {
    const cat = categories.find((c) => c.id === t.category);
    return {
      任务名称: t.name,
      分类: cat?.name || t.category,
      状态: STATUS_CONFIG[t.status].label,
      "进度(%)": t.progress,
      负责人: resolveAssignee(t, userMapById),
      创建日期: t.createdDate,
      截止日期: t.deadline,
      更新记录数: t.history.length,
    };
  });

  // Sheet 3: 员工负载
  const employeeStats = calcEmployeeStats(tasks, userMapById);
  const employeeRows = employeeStats.map((s) => ({
    员工: s.name,
    总任务: s.total,
    进行中: s.active,
    已完成: s.completed,
    已逾期: s.overdue,
    已终止: s.terminated,
    "平均进度(%)": s.avgProgress,
    "完成率(%)": s.completionRate,
  }));

  // Sheet 4: 分类统计
  const categoryRows = categories.map((cat) => {
    const catTasks = tasks.filter((t) => t.category === cat.id);
    const completed = catTasks.filter((t) => t.status === "completed").length;
    const avgProgress =
      catTasks.length > 0
        ? Math.round(catTasks.reduce((s, t) => s + t.progress, 0) / catTasks.length)
        : 0;
    return {
      分类: cat.name,
      任务数: catTasks.length,
      已完成: completed,
      "平均进度(%)": avgProgress,
    };
  });

  // Sheet 5: 趋势数据
  const trendData = calcTrend(tasks, "month");
  const trendRows = trendData.map((t) => ({
    月份: t.period,
    新增数: t.created,
    完成数: t.completed,
  }));

  const wb = XLSX.utils.book_new();

  const s1 = XLSX.utils.json_to_sheet(overviewRows);
  s1["!cols"] = [{ wch: 20 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, s1, "看板概况");

  const s2 = XLSX.utils.json_to_sheet(taskRows);
  s2["!cols"] = [
    { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 10 },
    { wch: 15 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, s2, "任务明细");

  const s3 = XLSX.utils.json_to_sheet(employeeRows);
  s3["!cols"] = [
    { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, s3, "员工负载");

  const s4 = XLSX.utils.json_to_sheet(categoryRows);
  s4["!cols"] = [{ wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, s4, "分类统计");

  const s5 = XLSX.utils.json_to_sheet(trendRows);
  s5["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, s5, "趋势数据");

  XLSX.writeFile(wb, `任务数据看板_${today}.xlsx`);
}
