import { Wrench } from "lucide-react";
import { useAppState } from "@/contexts/AppStateContext";
import { useMachineDirectory } from "@/hooks/useDirectory";
import { useMachineHealthRisk, useMaintenanceRecommendations } from "@/hooks/useMachineHealth";
import { useLatestTelemetry } from "@/hooks/useTelemetry";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { MachineHealthCard } from "@/components/health/MachineHealthCard";
import { MaintenanceRecommendationList } from "@/components/health/MaintenanceRecommendationList";

export default function MachineHealthPage() {
  const { selectedMachineId, setSelectedMachineId } = useAppState();
  const machines = useMachineDirectory();
  const healthQuery = useMachineHealthRisk(selectedMachineId);
  const telemetryQuery = useLatestTelemetry(selectedMachineId);
  const recommendationsQuery = useMaintenanceRecommendations(selectedMachineId ?? undefined);

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-brand-yellow-dark" />
          <div>
            <h1 className="cat-heading-accent text-lg font-extrabold tracking-tight text-cat-black">Machine Health</h1>
            <p className="text-sm text-ink-muted">Predicted maintenance risk and inspection guidance.</p>
          </div>
        </div>
        <label className="flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1.5 text-xs font-medium text-ink">
          Machine
          <select
            value={selectedMachineId ?? ""}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            className="bg-transparent text-xs font-semibold focus:outline-none"
          >
            {(machines.data?.items ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.machine_code} — {m.name}
              </option>
            ))}
          </select>
        </label>
      </Card>

      {!selectedMachineId ? (
        <EmptyState title="Select a machine" />
      ) : healthQuery.isLoading ? (
        <CardSkeleton lines={6} />
      ) : healthQuery.isError || !healthQuery.data ? (
        <EmptyState
          title="No telemetry available for this machine"
          description="Submit telemetry via POST /api/v1/telemetry or run the machine_health_risk demo scenario to populate this view."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MachineHealthCard health={healthQuery.data} telemetry={telemetryQuery.data ?? null} />
          <MaintenanceRecommendationList items={recommendationsQuery.data?.items ?? []} />
        </div>
      )}
    </div>
  );
}
