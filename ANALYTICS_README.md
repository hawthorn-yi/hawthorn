# 任务数据看板（/analytics）— 改动说明

## 概述
为项目进度管理系统新增管理员专属的**任务数据看板**页面，提供项目概况、员工负载、任务趋势等多维度数据可视化分析。

## 改动文件清单

### 修改的文件（2 个）

| 文件 | 改动内容 |
|------|----------|
| `app/src/App.tsx` | 新增 `/analytics` 路由（`AdminRoute` 保护，`lazy` 加载） |
| `app/src/components/Sidebar.tsx` | `adminNavItems` 新增"数据看板"菜单项（`BarChart3` 图标） |

### 新建的文件（14 个）

| 文件 | 说明 |
|------|------|
| `app/src/pages/Analytics.tsx` | 主页面，组装 Layout + 所有子组件 |
| `app/src/hooks/useAnalytics.ts` | 数据 hook，复用 useTaskManager + getAllUsers + 筛选 + 派生计算 |
| `app/src/lib/analytics-utils.ts` | 纯函数：KPI 计算、分组聚合、趋势聚合、Excel 导出 |
| `app/src/components/analytics/AnalyticsHeader.tsx` | 页头：标题 + 刷新 + 导出 Excel 按钮 |
| `app/src/components/analytics/FilterBar.tsx` | 筛选器：分类/状态/员工/时间范围/关键词 |
| `app/src/components/analytics/KpiCards.tsx` | 8 个 KPI 指标卡片 |
| `app/src/components/analytics/StatusPieChart.tsx` | 任务状态分布（环形图） |
| `app/src/components/analytics/CategoryPieChart.tsx` | 任务分类分布（饼图） |
| `app/src/components/analytics/EmployeeTaskBarChart.tsx` | 员工任务对比（堆叠横向柱状图） |
| `app/src/components/analytics/ProgressDistributionChart.tsx` | 进度区间分布（柱状图） |
| `app/src/components/analytics/TaskTrendChart.tsx` | 创建/完成趋势（折线图） |
| `app/src/components/analytics/GanttChart.tsx` | 甘特图（自定义组件，支持员工/分类切换） |
| `app/src/components/analytics/EmployeeWorkloadTable.tsx` | 员工负载分析表（含汇总行） |
| `app/src/components/analytics/DeadlineAnalysisChart.tsx` | 截止/逾期分析（堆叠柱状图） |

## 功能特性

### 8 个 KPI 指标
任务总数、进行中、已完成、已逾期、已终止、平均进度、即将到期（7天内）、参与员工数

### 8 个图表模块
1. **任务状态分布** — 环形图，中心显示总数
2. **任务分类分布** — 饼图，用分类自带颜色
3. **员工任务对比** — 堆叠横向柱状图，按状态分色
4. **进度分布** — 柱状图，5 个区间（0-25%/25-50%/50-75%/75-99%/100%）
5. **任务趋势** — 折线图，创建/完成双线，按月聚合
6. **甘特图** — 自定义时间轴组件，支持「按员工/按分类」切换，含今日线、进度填充、悬停提示
7. **员工负载表** — 表格，含总任务/进行中/已完成/已逾期/已终止/平均进度/完成率，底部汇总行
8. **截止/逾期分析** — 堆叠柱状图，按员工展示即将到期/已逾期/正常

### 筛选器
- 分类（多选，按钮切换）
- 状态（多选，按钮切换）
- 员工（下拉单选）
- 时间范围（日期区间）
- 关键词搜索
- 一键重置
- 所有图表联动

### Excel 导出
5 个 Sheet：看板概况 / 任务明细 / 员工负载 / 分类统计 / 趋势数据

## 技术要点
- **数据获取**：复用 `useTaskManager`（admin 自动获取全部任务 + Realtime 实时同步）+ `getAllUsers`
- **图表库**：recharts（已安装），饼图/柱状图/折线图
- **甘特图**：自定义 div+CSS（recharts 无原生甘特图），framer-motion 动画
- **权限**：`AdminRoute` 保护，仅管理员可访问
- **构建**：TypeScript 编译 + Vite 打包通过 ✓
