import { RadialGaugeCard, rangeForRiskLevel } from "@/components/analytics/RadialGaugeCard";
import type { RiskLevel } from "@/api/types";

export function FailureRiskGauge({ score, level }: { score: number; level: RiskLevel | string }) {
  const normalized: RiskLevel = ["LOW", "MODERATE", "HIGH", "CRITICAL"].includes(level) ? (level as RiskLevel) : "MODERATE";
  return (
    <RadialGaugeCard
      value={score}
      max={100}
      label={`Failure risk (${normalized})`}
      valueLabel={score.toFixed(0)}
      range={rangeForRiskLevel(normalized)}
    />
  );
}
