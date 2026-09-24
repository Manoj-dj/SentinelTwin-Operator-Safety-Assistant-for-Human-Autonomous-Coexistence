import { useState } from "react";
import { Activity, Coffee, Gauge, Wrench } from "lucide-react";
import { useAppState } from "@/contexts/AppStateContext";
import { useMachineEfficiency, useOperatorBehavior, useOperatorEfficiency } from "@/hooks/useAnalytics";
import { useBreaksToday, useCreateBreak, useOperatorFatigue } from "@/hooks/useFatigue";
import { useMachineHealthRisk, useMaintenanceRecommendations } from "@/hooks/useMachineHealth";
import { useOperatorDashboard } from "@/hooks/useDashboard";
import { useLatestTelemetry } from "@/hooks/useTelemetry";
import { useIncidentList } from "@/hooks/useIncidents";
import { Card, CardHeader } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EfficiencyGauge } from "@/components/analytics/EfficiencyGauge";
import { FatigueGauge } from "@/components/analytics/FatigueGauge";
import { BaselineComparisonChart } from "@/components/analytics/BaselineComparisonChart";
import { BreakAlertCard } from "@/components/analytics/BreakAlertCard";
import { ShiftBreakdownChart } from "@/components/analytics/ShiftBreakdownChart";
import { RiskFactorBreakdownChart } from "@/components/analytics/RiskFactorBreakdownChart";
import { IncidentRiskTrendChart } from "@/components/analytics/IncidentRiskTrendChart";
import { formatMinutes, formatPercent } from "@/lib/utils";

type TabId = "efficiency" | "behavior" | "fatigue" | "health";

export default function AnalyticsPage() {
  const [tab, setTab] = useState<TabId>("efficiency");
  const { selectedOperatorId, selectedMachineId } = useAppState();

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="cat-heading-accent text-lg font-extrabold tracking-tight text-cat-black">Analytics</h1>
        <Tabs
          tabs={[
            { id: "efficiency", label: "Efficiency", icon: <Gauge className="h-3.5 w-3.5" /> },
            { id: "behavior", label: "Behavior insights", icon: <Activity className="h-3.5 w-3.5" /> },
            { id: "fatigue", label: "Fatigue & breaks", icon: <Coffee className="h-3.5 w-3.5" /> },
            { id: "health", label: "Machine health", icon: <Wrench className="h-3.5 w-3.5" /> },
          ]}
          active={tab}
          onChange={setTab}
        />
      </Card>

      {tab === "efficiency" && <EfficiencyTab operatorId={selectedOperatorId} machineId={selectedMachineId} />}
      {tab === "behavior" && <BehaviorTab operatorId={selectedOperatorId} machineId={selectedMachineId} />}
      {tab === "fatigue" && <FatigueTab operatorId={selectedOperatorId} />}
      {tab === "health" && <HealthTab machineId={selectedMachineId} />}
    </div>
  );
}

function EfficiencyTab({ operatorId, machineId }: { operatorId: string | null; machineId: string | null }) {
  const operatorEff = useOperatorEfficiency(operatorId);
  const machineEff = useMachineEfficiency(machineId);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {[
        { label: "Operator efficiency", query: operatorEff },
        { label: "Machine efficiency", query: machineEff },
      ].map(({ label, query }) => (
        <Card key={label}>
          <CardHeader icon={<Gauge className="h-4 w-4" />} title={label} />
          {query.isLoading ? (
            <CardSkeleton lines={4} />
          ) : query.isError ? (
            <EmptyState title="No telemetry yet" description="Submit telemetry via POST /api/v1/telemetry or run a demo scenario to populate this view." />
          ) : query.data ? (
            <div className="space-y-3">
              <div className="flex items-center justify-around">
                <EfficiencyGauge percentage={query.data.machine_efficiency_percentage} grade={query.data.grade} />
                <BaselineComparisonChart
                  currentPct={query.data.machine_efficiency_percentage}
                  baselineDeltaPct={query.data.baseline_comparison_pct}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <Stat label="Idle" value={formatPercent(query.data.idle_percentage)} />
                <Stat label="Fuel eff." value={query.data.fuel_efficiency.toFixed(2)} />
                <Stat label="Cycle eff." value={formatPercent(query.data.cycle_efficiency)} />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-cat-gray-mid">
                  Current shift: productive vs. idle
                </p>
                <ShiftBreakdownChart
                  productiveMinutes={query.data.productive_time_min}
                  idlePercentage={query.data.idle_percentage}
                />
              </div>
              <p className="rounded-lg bg-cat-gray-light p-2.5 text-xs text-ink">{query.data.insight}</p>
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

function BehaviorTab({ operatorId, machineId }: { operatorId: string | null; machineId: string | null }) {
  const behavior = useOperatorBehavior(operatorId);
  const telemetry = useLatestTelemetry(machineId);
  const incidents = useIncidentList({ operator_id: operatorId ?? undefined, page_size: 100 });
  const incidentItems = incidents.data?.items ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader icon={<Activity className="h-4 w-4" />} title="Unusual pattern detection" subtitle="Latest telemetry snapshot for your machine" />
        {telemetry.isLoading ? (
          <CardSkeleton lines={3} />
        ) : telemetry.isError || !telemetry.data ? (
          <EmptyState title="No telemetry yet" description="This machine has no telemetry submitted yet." />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge
                label={telemetry.data.anomaly_label}
                tone={telemetry.data.anomaly_label === "ANOMALY" ? "warning" : "safe"}
              />
              <span className="text-xs text-ink-muted">score {telemetry.data.anomaly_score.toFixed(2)}</span>
            </div>
            <p className="text-xs text-ink-muted">
              {telemetry.data.anomaly_label === "ANOMALY"
                ? "Unusual pattern detected; review recommended. This is a statistical signal, not a confirmed unsafe condition."
                : "No unusual pattern detected in the most recent telemetry sample."}
            </p>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader icon={<Activity className="h-4 w-4" />} title="Behavior insights (last 100 samples)" />
        {behavior.isLoading ? (
          <CardSkeleton lines={3} />
        ) : behavior.isError || !behavior.data ? (
          <EmptyState title="No behavior data yet" />
        ) : (
          <div className="space-y-2">
            <p className="text-2xl font-bold text-ink">{behavior.data.anomaly_events_last_7d}</p>
            <p className="text-xs text-ink-muted">unusual-pattern events detected</p>
            <ul className="list-inside list-disc space-y-0.5 text-xs text-ink">
              {behavior.data.patterns_detected.map((p, idx) => (
                <li key={idx}>{p}</li>
              ))}
            </ul>
            {behavior.data.recommended_training.length > 0 && (
              <p className="text-xs font-semibold text-status-info">
                Recommended: {behavior.data.recommended_training.join(", ")}
              </p>
            )}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader icon={<Activity className="h-4 w-4" />} title="Risk factor breakdown" subtitle="Which contributing factors show up most often in your incident history" />
        <RiskFactorBreakdownChart incidents={incidentItems} />
      </Card>

      <Card>
        <CardHeader icon={<Activity className="h-4 w-4" />} title="Incident risk trend" subtitle="Incident count and average risk score by day" />
        <IncidentRiskTrendChart incidents={incidentItems} />
      </Card>
    </div>
  );
}

function FatigueTab({ operatorId }: { operatorId: string | null }) {
  const fatigue = useOperatorFatigue(operatorId);
  const breaksToday = useBreaksToday(operatorId);
  const dashboard = useOperatorDashboard(operatorId);
  const createBreak = useCreateBreak();

  const activeShiftId = dashboard.data?.active_shift?.id ?? null;

  if (fatigue.isLoading) return <CardSkeleton lines={4} />;
  if (fatigue.isError || !fatigue.data) {
    return <EmptyState title="No fatigue data yet" description="Fatigue is computed from telemetry -- submit telemetry to populate this view." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="flex flex-col items-center justify-center">
        <FatigueGauge score={fatigue.data.fatigue_score} level={fatigue.data.fatigue_level} />
      </Card>
      <BreakAlertCard
        fatigue={fatigue.data}
        breakLoggable={Boolean(activeShiftId && operatorId)}
        isLoggingBreak={createBreak.isPending}
        onLogBreak={() => {
          if (!activeShiftId || !operatorId) return;
          createBreak.mutate({
            shift_id: activeShiftId,
            operator_id: operatorId,
            break_type: "SHORT_BREAK",
            duration_min: fatigue.data.recommended_break_minutes || 10,
          });
        }}
      />
      <Card>
        <CardHeader icon={<Coffee className="h-4 w-4" />} title="Breaks today" />
        {breaksToday.data && breaksToday.data.breaks.length > 0 ? (
          <ul className="space-y-1.5 text-xs">
            {breaksToday.data.breaks.map((b) => (
              <li key={b.id} className="flex justify-between rounded bg-surface-sunken/50 px-2 py-1.5">
                <span>{b.break_type.replace("_", " ")}</span>
                <span className="font-semibold">{formatMinutes(b.duration_min)}</span>
              </li>
            ))}
            <li className="pt-1 text-right text-[11px] font-bold text-ink-muted">
              Total: {formatMinutes(breaksToday.data.total_break_minutes_today)}
            </li>
          </ul>
        ) : (
          <EmptyState title="No breaks logged today" />
        )}
      </Card>
      <div className="lg:col-span-3">
        <Card>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Contributing factors</p>
          <ul className="list-inside list-disc text-xs text-ink-muted">
            {fatigue.data.contributing_factors.map((f, idx) => (
              <li key={idx}>{f}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function HealthTab({ machineId }: { machineId: string | null }) {
  const health = useMachineHealthRisk(machineId);
  const recommendations = useMaintenanceRecommendations(machineId ?? undefined);

  if (health.isLoading) return <CardSkeleton lines={5} />;
  if (health.isError || !health.data) {
    return <EmptyState title="No machine health data yet" description="Submit telemetry or run the machine_health_risk demo scenario." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader icon={<Wrench className="h-4 w-4" />} title="Predicted maintenance risk" />
        <div className="mb-2 flex items-center gap-2">
          <RiskBadge level={health.data.risk_level} size="lg" />
          <span className="text-xs text-ink-muted">Subsystem: {health.data.likely_subsystem}</span>
        </div>
        <ul className="list-inside list-disc text-xs text-ink-muted">
          {health.data.contributing_factors.map((f, idx) => (
            <li key={idx}>{f}</li>
          ))}
        </ul>
        <p className="mt-2 rounded-lg border border-brand-yellow-dark/30 bg-brand-yellow/10 p-2.5 text-xs font-medium text-ink">
          {health.data.recommended_action}
        </p>
      </Card>
      <Card>
        <CardHeader icon={<Wrench className="h-4 w-4" />} title="Maintenance recommendations" />
        {recommendations.data?.items.length ? (
          <ul className="space-y-1.5 text-xs">
            {recommendations.data.items.map((rec) => (
              <li key={rec.id} className="rounded bg-surface-sunken/50 p-2">
                <p className="font-semibold text-ink">{rec.subsystem}</p>
                <p className="text-ink-muted">{rec.recommendation}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No open maintenance recommendations" />
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-sunken/60 p-2">
      <p className="font-bold text-ink">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  );
}
