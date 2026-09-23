import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** Uses only real backend fields (current % and the backend-computed baseline_comparison_pct delta) -- no fabricated history. */
export function BaselineComparisonChart({
  currentPct,
  baselineDeltaPct,
}: {
  currentPct: number;
  baselineDeltaPct: number;
}) {
  const baselinePct = currentPct - baselineDeltaPct;
  const data = [
    { name: "Baseline", value: Math.max(0, Math.round(baselinePct)) },
    { name: "Current", value: Math.round(currentPct) },
  ];

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
          <Tooltip formatter={(value: number) => [`${value}%`, "Efficiency"]} />
          <Bar dataKey="value" fill="var(--color-brand-yellow)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
