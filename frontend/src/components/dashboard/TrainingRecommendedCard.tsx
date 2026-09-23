import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { DashboardTrainingRecommendation } from "@/api/types";
import { ROUTES } from "@/lib/constants";

export function TrainingRecommendedCard({ items }: { items: DashboardTrainingRecommendation[] }) {
  return (
    <Card>
      <CardHeader icon={<GraduationCap className="h-4 w-4" />} title="Training recommended for you" />
      {items.length === 0 ? (
        <EmptyState title="No specific training recommended" description="You're up to date based on recent activity." />
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 3).map((item) => (
            <li key={item.resource_id} className="flex items-start justify-between gap-2 rounded-lg bg-surface-sunken/50 p-2.5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink">{item.title}</p>
                <p className="text-[11px] text-ink-muted">{item.reason}</p>
              </div>
              <StatusBadge
                label={item.priority}
                tone={item.priority === "HIGH" ? "critical" : item.priority === "MEDIUM" ? "warning" : "neutral"}
              />
            </li>
          ))}
        </ul>
      )}
      <Link
        to={ROUTES.training}
        className="mt-3 inline-block text-xs font-semibold text-status-info hover:underline"
      >
        View training hub &rarr;
      </Link>
    </Card>
  );
}
