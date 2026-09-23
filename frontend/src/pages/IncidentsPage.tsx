import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Activity } from "lucide-react";
import { useIncidentList } from "@/hooks/useIncidents";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { IncidentFilters, type IncidentFilterState } from "@/components/incidents/IncidentFilters";
import { IncidentTable } from "@/components/incidents/IncidentTable";
import { IncidentDetailDrawer } from "@/components/incidents/IncidentDetailDrawer";
import type { IncidentOut } from "@/api/types";

export default function IncidentsPage() {
  const [searchParams] = useSearchParams();
  const truckIdParam = searchParams.get("truck_id") ?? undefined;
  const [filters, setFilters] = useState<IncidentFilterState>({ severity: "ALL", ackStatus: "ALL" });
  const [selected, setSelected] = useState<IncidentOut | null>(null);

  const query = useIncidentList({
    truck_id: truckIdParam,
    severity: filters.severity === "ALL" ? undefined : filters.severity,
    ack_status: filters.ackStatus === "ALL" ? undefined : filters.ackStatus,
    page_size: 100,
  });

  const incidents = useMemo(() => query.data?.items ?? [], [query.data]);

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-brand-yellow-dark" />
          <div>
            <h1 className="text-lg font-bold text-ink">Incident Log</h1>
            <p className="text-sm text-ink-muted">
              {truckIdParam ? "Filtered by truck from Live Safety" : `${query.data?.total ?? 0} recorded incidents`}
            </p>
          </div>
        </div>
        <IncidentFilters value={filters} onChange={setFilters} />
      </Card>

      {query.isLoading ? (
        <CardSkeleton lines={6} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : incidents.length === 0 ? (
        <EmptyState title="No incidents found" description="Nothing matches the current filters, or none have been recorded yet." />
      ) : (
        <IncidentTable incidents={incidents} onOpen={setSelected} />
      )}

      <IncidentDetailDrawer incident={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
