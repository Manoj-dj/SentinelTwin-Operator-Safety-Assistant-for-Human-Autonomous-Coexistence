import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export type GaugeRange = "safe" | "warning" | "critical" | "info";

const RANGE_COLOR_VAR: Record<GaugeRange, string> = {
  safe: "var(--color-safe)",
  warning: "var(--color-warning)",
  critical: "var(--color-critical)",
  info: "var(--color-info)",
};

/**
 * Unified circular gauge used for every percentage/score in the app
 * (efficiency, fatigue, failure risk). Fixes the previous bug where the ring
 * always rendered as a full/closed circle regardless of value: Recharts'
 * RadialBar has no way to map a value to an arc sweep without an explicit
 * <PolarAngleAxis domain={[0, max]}> supplying the scale -- without it, the
 * bar has no defined range to divide `value` by, so it always drew full.
 */
export function RadialGaugeCard({
  value,
  max = 100,
  label,
  valueLabel,
  range,
  size = 144,
}: {
  value: number;
  max?: number;
  label: string;
  valueLabel: string;
  range: GaugeRange;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(value, max));
  const color = RANGE_COLOR_VAR[range];
  const data = [{ name: label, value: clamped, fill: color }];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ height: size, width: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="72%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
            barSize={12}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            {/* The fix: an explicit numeric domain [0, max] gives RadialBar a
                scale to compute the sweep angle from `value` -- without this,
                Recharts renders the ring fully closed no matter the value. */}
            <PolarAngleAxis type="number" domain={[0, max]} angleAxisId={0} tick={false} />
            <RadialBar
              dataKey="value"
              cornerRadius={8}
              background={{ fill: "var(--color-surface-sunken)" }}
              isAnimationActive
            />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Centered label: absolutely positioned within the same sized,
            relatively-positioned wrapper as the chart, so it stays centered
            regardless of container size. */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            className={cn("text-xl font-extrabold tabular-nums")}
            style={{ color }}
          >
            {valueLabel}
          </span>
        </div>
      </div>
      <p className="mt-1 text-center text-xs font-semibold uppercase tracking-wide text-cat-gray-mid">{label}</p>
    </div>
  );
}

export function rangeForPercentage(value: number): GaugeRange {
  if (value >= 70) return "safe";
  if (value >= 40) return "warning";
  return "critical";
}

export function rangeForRiskLevel(level: string): GaugeRange {
  if (level === "LOW") return "safe";
  if (level === "MODERATE") return "warning";
  return "critical";
}
