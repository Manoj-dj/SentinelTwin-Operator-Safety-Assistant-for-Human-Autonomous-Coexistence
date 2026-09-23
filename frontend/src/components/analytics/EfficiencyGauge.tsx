import { RadialGauge } from "./RadialGauge";

export function EfficiencyGauge({ percentage, grade }: { percentage: number; grade: string }) {
  const color =
    percentage >= 85
      ? "var(--color-safe)"
      : percentage >= 70
        ? "var(--color-info)"
        : percentage >= 50
          ? "var(--color-warning)"
          : "var(--color-critical)";

  return (
    <RadialGauge
      value={percentage}
      label={`Efficiency (Grade ${grade})`}
      valueLabel={`${percentage.toFixed(0)}%`}
      colorVar={color}
    />
  );
}
