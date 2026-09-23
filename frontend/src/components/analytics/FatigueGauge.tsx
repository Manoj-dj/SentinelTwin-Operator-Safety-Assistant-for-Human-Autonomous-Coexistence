import { RadialGauge } from "./RadialGauge";
import type { RiskLevel } from "@/api/types";

const COLOR: Record<RiskLevel, string> = {
  LOW: "var(--color-safe)",
  MODERATE: "var(--color-warning)",
  HIGH: "var(--color-critical)",
  CRITICAL: "var(--color-critical)",
};

export function FatigueGauge({ score, level }: { score: number; level: RiskLevel | string }) {
  const normalized: RiskLevel = ["LOW", "MODERATE", "HIGH", "CRITICAL"].includes(level) ? (level as RiskLevel) : "MODERATE";
  return (
    <RadialGauge
      value={score}
      label={`Fatigue risk (${normalized})`}
      valueLabel={score.toFixed(0)}
      colorVar={COLOR[normalized]}
    />
  );
}
