import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { IncidentOut } from "@/api/types";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Real trend across actual incident timestamps: incident count and average
 * risk score per day. Unlike efficiency/fatigue (single current snapshots
 * only), incidents genuinely carry historical timestamps, so this is a
 * legitimate multi-point trend built from real data already returned by the
 * existing incidents endpoint -- not a fabricated time series.
 */
export function IncidentRiskTrendChart({ incidents }: { incidents: IncidentOut[] }) {
  const data = useMemo(() => {
    const byDay = new Map<string, { count: number; totalRisk: number }>();
    for (const incident of incidents) {
      const day = format(parseISO(incident.timestamp), "MMM d");
      const bucket = byDay.get(day) ?? { count: 0, totalRisk: 0 };
      bucket.count += 1;
      bucket.totalRisk += incident.risk_score;
      byDay.set(day, bucket);
    }
    return Array.from(byDay.entries())
      .map(([day, { count, totalRisk }]) => ({
        day,
        incidents: count,
        avgRisk: Math.round(totalRisk / count),
      }))
      .slice(-14);
  }, [incidents]);

  if (data.length < 2) {
    return (
      <EmptyState
        title="Not enough incident history yet for a trend"
        description="This chart plots real incident count and average risk score per day -- it fills in as more incidents are recorded over time."
      />
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--cat-gray-border)" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="left" dataKey="incidents" name="Incidents" fill="var(--cat-gray-border)" radius={[4, 4, 0, 0]} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="avgRisk"
            name="Avg. risk score"
            stroke="var(--color-critical)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
