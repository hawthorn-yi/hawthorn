import { motion } from "framer-motion";
import {
  ListChecks,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Ban,
  TrendingUp,
  Clock,
  Users,
  Shield,
} from "lucide-react";
import type { KpiData } from "@/hooks/useAnalytics";

interface KpiCardsProps {
  kpi: KpiData;
}

const KPI_ITEMS = [
  { key: "total", label: "任务总数", icon: ListChecks, bg: "#EFF6FF", color: "#3B82F6" },
  { key: "active", label: "进行中", icon: PlayCircle, bg: "#EFF6FF", color: "#2563EB" },
  { key: "completed", label: "已完成", icon: CheckCircle2, bg: "#ECFDF5", color: "#10B981" },
  { key: "overdue", label: "已逾期", icon: AlertTriangle, bg: "#FFF1F2", color: "#E11D48" },
  { key: "terminated", label: "已终止", icon: Ban, bg: "#F1F5F9", color: "#64748B" },
  { key: "avgProgress", label: "平均进度", icon: TrendingUp, bg: "#F5F3FF", color: "#8B5CF6", suffix: "%" },
  { key: "dueSoon", label: "即将到期", icon: Clock, bg: "#FFFBEB", color: "#F59E0B" },
  { key: "employeeCount", label: "参与员工", icon: Users, bg: "#EFF6FF", color: "#3B82F6" },
  { key: "kevinOnlyCount", label: "管理员项目", icon: Shield, bg: "#FFF7ED", color: "#EA580C" },
] as const;

export default function KpiCards({ kpi }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2 sm:gap-3 mb-6">
      {KPI_ITEMS.map((item, i) => {
        const Icon = item.icon;
        const value = kpi[item.key as keyof KpiData];
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white border border-[#E2E8F0] rounded-xl p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3"
          >
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: item.bg }}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: item.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-[1.375rem] font-bold text-[#1E293B] leading-tight tabular-nums">
                {value}
                {"suffix" in item && item.suffix ? item.suffix : ""}
              </p>
              <p className="text-[0.6875rem] sm:text-xs text-[#94A3B8] truncate">{item.label}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
