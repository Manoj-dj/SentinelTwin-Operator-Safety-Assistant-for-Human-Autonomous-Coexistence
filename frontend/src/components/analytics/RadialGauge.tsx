import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export function RadialGauge({
  value,
  max = 100,
  label,
  valueLabel,
  colorVar,
}: {
  value: number;
  max?: number;
  label: string;
  valueLabel: string;
  colorVar: string;
}) {
  const clamped = Math.max(0, Math.min(value, max));
  const data = [{ name: label, value: clamped, fill: colorVar }];

  return (
    <div className="relative flex flex-col items-center">
      <div className="h-36 w-36">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="72%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
            barSize={12}
          >
            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "var(--color-surface-sunken)" }} max={max} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-xl font-extrabold tabular-nums text-ink")}>{valueLabel}</span>
        </div>
      </div>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
    </div>
  );
}
