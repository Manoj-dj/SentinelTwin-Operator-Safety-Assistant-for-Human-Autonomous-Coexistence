import { useMemo } from "react";
import { AlertTriangle, Gauge, MapPinned, ShieldCheck, Timer, Wrench } from "lucide-react";
import { useAppState } from "@/contexts/AppStateContext";
import { useOperatorDashboard } from "@/hooks/useDashboard";
import { useTasksToday } from "@/hooks/useTasks";
import { useTruckDigitalTwin } from "@/hooks/useDigitalTwin";
import { KPIStatCard } from "@/components/ui/KPIStatCard";
import { KPISkeletonRow, CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { SafetyDisclaimer } from "@/components/ui/SafetyDisclaimer";
import { NextActionCard } from "@/components/dashboard/NextActionCard";
import { OperatingPlanCard } from "@/components/dashboard/OperatingPlanCard";
import { EfficiencyTodayCard } from "@/components/dashboard/EfficiencyTodayCard";
import { SafetyTimelineCard } from "@/components/dashboard/SafetyTimelineCard";
import { TrainingRecommendedCard } from "@/components/dashboard/TrainingRecommendedCard";
import { CopilotQuickInput } from "@/components/dashboard/CopilotQuickInput";
import { TruckStateCard } from "@/components/safety/TruckStateCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatMinutes, greetingForHour } from "@/lib/utils";
import { differenceInMinutes, parseISO } from "date-fns";

export default function DashboardPage() {
  const { selectedOperatorId } = useAppState();
  const dashboardQuery = useOperatorDashboard(selectedOperatorId);
  const tasksTodayQuery = useTasksToday(selectedOperatorId);
  const nearestTruckId = dashboardQuery.data?.nearest_truck?.id ?? null;
  const truckTwinQuery = useTruckDigitalTwin(nearestTruckId);

  const dashboard = dashboardQuery.data;

  const shiftMinutes = useMemo(() => {
    if (!dashboard?.active_shift) return null;
    return differenceInMinutes(new Date(), parseISO(dashboard.active_shift.start_time));
  }, [dashboard?.active_shift]);

  if (!selectedOperatorId) {
    return (
      <EmptyState
        title="Select an operator to begin"
        description="Choose an operator from the top bar, or set a default in Settings."
      />
    );
  }

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton lines={2} />
        <KPISkeletonRow />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CardSkeleton lines={5} />
          <CardSkeleton lines={5} />
        </div>
      </div>
    );
  }

  if (dashboardQuery.isError || !dashboard) {
    return <ErrorState error={dashboardQuery.error} onRetry={() => dashboardQuery.refetch()} />;
  }

  const failureLevel = dashboard.failure_risk?.risk_level ?? "LOW";
  const fatigueLevel = dashboard.fatigue?.fatigue_level ?? "LOW";

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-lg font-bold text-ink">
            {greetingForHour()}, {dashboard.operator_name}
          </p>
          <p className="text-sm text-ink-muted">
            {dashboard.current_machine ? `Operating ${dashboard.current_machine.name}` : "No machine assigned yet"}
            {shiftMinutes !== null && ` · Shift duration: ${formatMinutes(shiftMinutes)}`}
          </p>
        </div>
        <SafetyDisclaimer compact className="max-w-xs" />
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KPIStatCard
          label="Safety status"
          value={dashboard.active_safety_alerts.length > 0 ? "ALERT" : "CLEAR"}
          tone={dashboard.active_safety_alerts.length > 0 ? "critical" : "safe"}
          icon={<ShieldCheck className="h-4 w-4" />}
          subtext={`${dashboard.active_safety_alerts.length} open alert(s)`}
        />
        <KPIStatCard
          label="Efficiency"
          value={dashboard.efficiency_summary ? `${dashboard.efficiency_summary.machine_efficiency_percentage.toFixed(0)}%` : "--"}
          icon={<Gauge className="h-4 w-4" />}
          tone="info"
        />
        <KPIStatCard
          label="Fatigue risk"
          value={fatigueLevel}
          tone={fatigueLevel === "LOW" ? "safe" : fatigueLevel === "MODERATE" ? "warning" : "critical"}
          icon={<Timer className="h-4 w-4" />}
        />
        <KPIStatCard
          label="Next task ETA"
          value={
            tasksTodayQuery.data?.tasks[0]
              ? formatMinutes(tasksTodayQuery.data.tasks[0].predicted_completion_min)
              : "--"
          }
          icon={<Timer className="h-4 w-4" />}
        />
        <KPIStatCard
          label="Failure risk"
          value={failureLevel}
          tone={failureLevel === "LOW" ? "safe" : failureLevel === "MODERATE" ? "warning" : "critical"}
          icon={<Wrench className="h-4 w-4" />}
        />
        <KPIStatCard
          label="Nearest truck"
          value={dashboard.nearest_truck ? dashboard.nearest_truck.state : "N/A"}
          subtext={dashboard.nearest_truck?.truck_code}
          icon={<MapPinned className="h-4 w-4" />}
          tone={
            dashboard.nearest_truck && ["RECOVERY", "TRANSITIONING"].includes(dashboard.nearest_truck.state)
              ? "critical"
              : "neutral"
          }
        />
      </div>

      <NextActionCard actions={dashboard.quick_actions} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {tasksTodayQuery.data ? (
          <OperatingPlanCard items={tasksTodayQuery.data.tasks} />
        ) : (
          <CardSkeleton lines={4} />
        )}

        <div>
          <Card className="mb-0">
            <CardHeader
              icon={<AlertTriangle className="h-4 w-4" />}
              title="Live safety state"
              subtitle="Nearest autonomous truck"
            />
          </Card>
          {!dashboard.nearest_truck ? (
            <div className="mt-3">
              <EmptyState
                title="No autonomous truck nearby"
                description="Telemetry has not reported a nearby truck for your machine yet."
              />
            </div>
          ) : truckTwinQuery.data ? (
            <div className="mt-3">
              <TruckStateCard truck={truckTwinQuery.data.truck} compact />
            </div>
          ) : truckTwinQuery.isError ? (
            <div className="mt-3">
              <ErrorState error={truckTwinQuery.error} compact />
            </div>
          ) : (
            <div className="mt-3">
              <CardSkeleton lines={4} />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <EfficiencyTodayCard summary={dashboard.efficiency_summary} />
        <SafetyTimelineCard incidents={dashboard.active_safety_alerts} />
        <TrainingRecommendedCard items={dashboard.recommended_training} />
      </div>

      <CopilotQuickInput />
    </div>
  );
}
