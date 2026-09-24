import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/**
 * Productive-vs-idle time for the current shift, derived from the existing
 * EfficiencyResult fields (productive_time_min + idle_percentage) with plain
 * arithmetic -- no fabricated history. The backend has no per-day historical
 * telemetry endpoint, so this is honestly labeled as a current-shift
 * breakdown rather than a multi-day trend.
 */
export function ShiftBreakdownChart({
  productiveMinutes,
  idlePercentage,
}: {
  productiveMinutes: number;
  idlePercentage: number;
}) {
  const idleFraction = Math.min(Math.max(idlePercentage, 0), 99) / 100;
  const activeMinutes = productiveMinutes / Math.max(1 - idleFraction, 0.01);
  const idleMinutes = Math.max(activeMinutes - productiveMinutes, 0);

  const data = [{ name: "Current shift", Productive: Math.round(productiveMinutes), Idle: Math.round(idleMinutes) }];

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--cat-gray-border)" />
          <XAxis type="number" tick={{ fontSize: 11 }} unit=" min" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
          <Tooltip formatter={(value: number) => [`${value} min`, ""]} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Productive" stackId="shift" fill="var(--color-safe)" radius={[4, 0, 0, 4]} />
          <Bar dataKey="Idle" stackId="shift" fill="var(--color-warning)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
