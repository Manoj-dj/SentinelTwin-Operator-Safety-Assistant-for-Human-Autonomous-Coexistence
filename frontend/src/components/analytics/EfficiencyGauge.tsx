import { RadialGaugeCard, rangeForPercentage } from "./RadialGaugeCard";

export function EfficiencyGauge({ percentage, grade }: { percentage: number; grade: string }) {
  return (
    <RadialGaugeCard
      value={percentage}
      max={100}
      label={`Efficiency (Grade ${grade})`}
      valueLabel={`${percentage.toFixed(0)}%`}
      range={rangeForPercentage(percentage)}
    />
  );
}
