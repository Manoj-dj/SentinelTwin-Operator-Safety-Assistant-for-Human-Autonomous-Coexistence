import type React from "react";
import { AlertOctagon, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { RiskLevel } from "@/api/types";
import { RISK_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<RiskLevel, React.ElementType> = {
  LOW: CheckCircle2,
  MODERATE: AlertTriangle,
  HIGH: ShieldAlert,
  CRITICAL: AlertOctagon,
};

export function RiskBadge({
  level,
  size = "md",
  className,
}: {
  level: RiskLevel | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const normalized: RiskLevel = isRiskLevel(level) ? level : "MODERATE";
  const style = RISK_STYLES[normalized];
  const Icon = ICONS[normalized];
  const sizeClasses =
    size === "sm" ? "text-xs px-2 py-0.5 gap-1" : size === "lg" ? "text-sm px-3 py-1.5 gap-2" : "text-xs px-2.5 py-1 gap-1.5";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        style.bg,
        style.text,
        sizeClasses,
        className,
      )}
    >
      <Icon className={size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"} aria-hidden="true" />
      {style.label}
      {!isRiskLevel(level) && <span className="sr-only"> (raw value: {String(level)})</span>}
    </span>
  );
}

function isRiskLevel(value: unknown): value is RiskLevel {
  return value === "LOW" || value === "MODERATE" || value === "HIGH" || value === "CRITICAL";
}
