import { useMemo, useState } from "react";
import { Bot, FileWarning, GraduationCap, Radar as RadarIcon } from "lucide-react";
import { useAppState } from "@/contexts/AppStateContext";
import { useAllTrucks, useTruckDigitalTwin, useEvaluateTransitionRisk } from "@/hooks/useDigitalTwin";
import { useLatestTelemetry } from "@/hooks/useTelemetry";
import { useIncidentList, useAcknowledgeIncident } from "@/hooks/useIncidents";
import { DigitalTwinRadar, type RadarTruck } from "@/components/safety/DigitalTwinRadar";
import { TruckStateCard } from "@/components/safety/TruckStateCard";
import { StateTransitionPanel } from "@/components/safety/StateTransitionPanel";
import { StateTransitionTimeline } from "@/components/safety/StateTransitionTimeline";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { SafetyDisclaimer } from "@/components/ui/SafetyDisclaimer";
import { euclideanDistance } from "@/lib/geometry";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import type { RiskEvaluationResult } from "@/api/types";

export default function LiveSafetyPage() {
  const { selectedMachineId, selectedOperatorId, selectedTruckId, setSelectedTruckId, askCopilot } = useAppState();
  const trucksQuery = useAllTrucks();
  const telemetryQuery = useLatestTelemetry(selectedMachineId);
  const truckTwinQuery = useTruckDigitalTwin(selectedTruckId);
  const evaluateMutation = useEvaluateTransitionRisk();
  const [evaluateResult, setEvaluateResult] = useState<RiskEvaluationResult | null>(null);

  const machineGpsX = telemetryQuery.data?.gps_x ?? null;
  const machineGpsY = telemetryQuery.data?.gps_y ?? null;
  const operatorPosition = useMemo(
    () => (machineGpsX !== null && machineGpsY !== null ? { x: machineGpsX, y: machineGpsY } : null),
    [machineGpsX, machineGpsY],
  );

  const radarTrucks: RadarTruck[] = useMemo(() => {
    const trucks = trucksQuery.data?.items ?? [];
    return trucks.map((truck) => ({
      truck,
      distanceM: operatorPosition
        ? euclideanDistance(operatorPosition.x, operatorPosition.y, truck.gps_x, truck.gps_y)
        : null,
    }));
  }, [trucksQuery.data, operatorPosition]);

  const selectedDistance = radarTrucks.find((t) => t.truck.id === selectedTruckId)?.distanceM ?? null;

  const openIncidentForTruck = useIncidentList({
    truck_id: selectedTruckId ?? undefined,
    ack_status: "OPEN",
    page_size: 1,
  });
  const acknowledgeMutation = useAcknowledgeIncident();

  const handleSelectTruck = (truckId: string) => {
    setSelectedTruckId(truckId);
    setEvaluateResult(null);
  };

  const handleEvaluate = async () => {
    if (!selectedTruckId) return;
    const result = await evaluateMutation.mutateAsync({
      truck_id: selectedTruckId,
      machine_id: selectedMachineId ?? undefined,
      operator_id: selectedOperatorId ?? undefined,
      distance_m: selectedDistance ?? 250,
    });
    setEvaluateResult(result);
  };

  if (trucksQuery.isLoading) {
    return <CardSkeleton lines={6} />;
  }

  if (trucksQuery.isError) {
    return <ErrorState error={trucksQuery.error} onRetry={() => trucksQuery.refetch()} />;
  }

  const trucks = trucksQuery.data?.items ?? [];

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="cat-heading-accent text-lg font-extrabold tracking-tight text-cat-black">
            Live Safety &amp; Digital Twin
          </h1>
          <p className="mt-2 text-sm text-cat-gray-mid">
            State-visibility for autonomous trucks near your position. SentinelTwin never controls or authorizes
            truck movement.
          </p>
        </div>
        <SafetyDisclaimer compact className="max-w-xs" />
      </Card>

      {trucks.length === 0 ? (
        <EmptyState title="No autonomous trucks found" description="Run scripts/generate_synthetic_data.py or seed_demo_data.py on the backend." />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <Card>
            <CardHeader icon={<RadarIcon className="h-4 w-4" />} title="Site proximity view" subtitle="Click a truck to inspect its digital twin" />
            <DigitalTwinRadar
              operatorMachinePosition={operatorPosition}
              trucks={radarTrucks}
              selectedTruckId={selectedTruckId}
              onSelectTruck={handleSelectTruck}
            />
            {selectedTruckId && truckTwinQuery.data && (
              <div className="mt-4">
                <StateTransitionTimeline events={truckTwinQuery.data.recent_events} />
              </div>
            )}
          </Card>

          <div className="space-y-4">
            {!selectedTruckId ? (
              <EmptyState title="Select a truck" description="Choose a marker on the site view to see its full digital twin." />
            ) : truckTwinQuery.isLoading ? (
              <CardSkeleton lines={6} />
            ) : truckTwinQuery.isError ? (
              <ErrorState error={truckTwinQuery.error} onRetry={() => truckTwinQuery.refetch()} />
            ) : truckTwinQuery.data ? (
              <>
                <TruckStateCard
                  truck={truckTwinQuery.data.truck}
                  distanceM={selectedDistance}
                  riskScore={evaluateResult?.risk_score}
                  riskLevel={evaluateResult?.risk_level}
                  contributingFactors={evaluateResult?.contributing_factors}
                  recommendedAction={evaluateResult?.recommended_action}
                />

                <StateTransitionPanel
                  currentState={truckTwinQuery.data.truck.state}
                  recentEvents={truckTwinQuery.data.recent_events}
                  distanceKnown={selectedDistance !== null}
                  isEvaluating={evaluateMutation.isPending}
                  evaluateResult={evaluateResult}
                  onEvaluate={() => void handleEvaluate()}
                />

                <Card className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!openIncidentForTruck.data?.items.length || acknowledgeMutation.isPending}
                    onClick={() => {
                      const incident = openIncidentForTruck.data?.items[0];
                      if (incident) acknowledgeMutation.mutate({ incidentId: incident.id, payload: { resolved: false } });
                    }}
                  >
                    <FileWarning className="h-3.5 w-3.5" /> Acknowledge alert
                  </Button>
                  <Link to={`${ROUTES.incidents}?truck_id=${truckTwinQuery.data.truck.id}`}>
                    <Button variant="secondary" size="sm">
                      Open incident log
                    </Button>
                  </Link>
                  <Link to={ROUTES.training}>
                    <Button variant="secondary" size="sm">
                      <GraduationCap className="h-3.5 w-3.5" /> View training
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => askCopilot(`Can I approach ${truckTwinQuery.data!.truck.truck_code}?`)}
                  >
                    <Bot className="h-3.5 w-3.5" /> Ask Copilot
                  </Button>
                </Card>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
