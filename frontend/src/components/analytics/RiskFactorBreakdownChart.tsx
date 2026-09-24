import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { IncidentOut } from "@/api/types";
import { EmptyState } from "@/components/ui/EmptyState";

const CATEGORY_KEYWORDS: [string, RegExp][] = [
  ["Proximity", /proximity|distance|exclusion|approach|close/i],
  ["Truck state", /recovery|transition|exception|suspended|offline|mission/i],
  ["Communication", /communication|degraded|lost/i],
  ["Seatbelt", /seatbelt/i],
  ["Fatigue", /fatigue|break|productivity/i],
  ["Visibility", /visibility|dust|rain|fog|night/i],
];

/**
 * Aggregates the real `contributing_factors` text already stored on each
 * incident (see app/services/*_risk_engine.py) into named categories by
 * keyword match, across the operator's actual incident history. Real data,
 * client-side aggregation -- no new backend endpoint.
 */
export function RiskFactorBreakdownChart({ incidents }: { incidents: IncidentOut[] }) {
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const incident of incidents) {
      const factors = Array.isArray(incident.context?.factors) ? (incident.context.factors as unknown[]) : [];
      for (const raw of factors) {
        const text = String(raw);
        const match = CATEGORY_KEYWORDS.find(([, pattern]) => pattern.test(text));
        const category = match ? match[0] : "Other";
        counts.set(category, (counts.get(category) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [incidents]);

  if (data.length === 0) {
    return (
      <EmptyState
        title="No contributing-factor data yet"
        description="This breaks down real factors from your incident history once incidents have been recorded."
      />
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--cat-gray-border)" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={90} />
          <Tooltip formatter={(value: number) => [`${value} occurrence(s)`, "Contributing factor"]} />
          <Bar dataKey="count" fill="var(--cat-yellow-dark)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
