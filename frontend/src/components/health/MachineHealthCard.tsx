import { AlertTriangle, Wrench } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { MachineHealthResult, TelemetryOut } from "@/api/types";
import { FailureRiskGauge } from "./FailureRiskGauge";

export function MachineHealthCard({
  health,
  telemetry,
}: {
  health: MachineHealthResult;
  telemetry: TelemetryOut | null;
}) {
  return (
    <Card accent={health.risk_level === "HIGH" || health.risk_level === "CRITICAL" ? "critical" : "none"}>
      <CardHeader icon={<Wrench className="h-4 w-4" />} title="Predicted maintenance risk" subtitle={`Model: ${health.model_source}`} />

      <div className="flex flex-col items-center gap-4 border-b border-cat-gray-border pb-4 sm:flex-row sm:items-start">
        <FailureRiskGauge score={health.failure_risk_score} level={health.risk_level} />
        <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <InfoRow label="Likely subsystem" value={health.likely_subsystem} />
          <InfoRow label="Maintenance priority" value={health.maintenance_priority} />
        </dl>
      </div>

      {telemetry && (
        <div className="my-3 grid grid-cols-3 gap-2 text-center sm:grid-cols-5">
          <SignalTile label="Engine" value={`${telemetry.engine_temperature_c.toFixed(0)} C`} />
          <SignalTile label="Coolant" value={`${telemetry.coolant_temperature_c.toFixed(0)} C`} />
          <SignalTile label="Oil pressure" value={`${telemetry.oil_pressure_kpa.toFixed(0)} kPa`} />
          <SignalTile label="Hydraulic" value={`${telemetry.hydraulic_temperature_c.toFixed(0)} C`} />
          <SignalTile label="Vibration" value={telemetry.vibration_rms.toFixed(1)} />
        </div>
      )}

      <div className="mt-3">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-cat-gray-mid">Contributing factors</p>
        <ul className="list-inside list-disc space-y-0.5 text-xs text-cat-gray-mid">
          {health.contributing_factors.length > 0 ? (
            health.contributing_factors.map((f, idx) => <li key={idx}>{f}</li>)
          ) : (
            <li>No elevated readings detected.</li>
          )}
        </ul>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg border border-cat-yellow-dark/40 bg-cat-yellow/10 p-3 text-xs font-medium text-ink">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-cat-yellow-dark" aria-hidden="true" />
        <span>
          <strong className="font-bold">Recommended action: </strong>
          {health.recommended_action}
        </span>
      </div>
      <p className="mt-2 text-[11px] text-cat-gray-mid">
        This is a predicted maintenance risk signal, not a certainty. Inspection is recommended, not a guarantee of
        failure.
      </p>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="contents">
      <dt className="text-cat-gray-mid">{label}</dt>
      <dd>
        <StatusBadge label={value} tone="neutral" />
      </dd>
    </div>
  );
}

function SignalTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-cat-gray-light p-2">
      <p className="font-bold text-ink">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-cat-gray-mid">{label}</p>
    </div>
  );
}
