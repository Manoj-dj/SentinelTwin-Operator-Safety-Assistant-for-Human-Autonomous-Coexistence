import { Wrench } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/RiskBadge";
import type { MachineHealthResult, TelemetryOut } from "@/api/types";

export function MachineHealthCard({
  health,
  telemetry,
}: {
  health: MachineHealthResult;
  telemetry: TelemetryOut | null;
}) {
  return (
    <Card>
      <CardHeader icon={<Wrench className="h-4 w-4" />} title="Predicted maintenance risk" subtitle={`Model: ${health.model_source}`} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <RiskBadge level={health.risk_level} size="lg" />
        <span className="text-xs font-semibold text-ink-muted">Subsystem: {health.likely_subsystem}</span>
        <span className="text-xs font-semibold text-ink-muted">Priority: {health.maintenance_priority}</span>
      </div>

      {telemetry && (
        <div className="mb-3 grid grid-cols-3 gap-2 text-center sm:grid-cols-5">
          <SignalTile label="Engine" value={`${telemetry.engine_temperature_c.toFixed(0)} C`} />
          <SignalTile label="Coolant" value={`${telemetry.coolant_temperature_c.toFixed(0)} C`} />
          <SignalTile label="Oil pressure" value={`${telemetry.oil_pressure_kpa.toFixed(0)} kPa`} />
          <SignalTile label="Hydraulic" value={`${telemetry.hydraulic_temperature_c.toFixed(0)} C`} />
          <SignalTile label="Vibration" value={telemetry.vibration_rms.toFixed(1)} />
        </div>
      )}

      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Contributing factors</p>
        <ul className="list-inside list-disc space-y-0.5 text-xs text-ink-muted">
          {health.contributing_factors.length > 0 ? (
            health.contributing_factors.map((f, idx) => <li key={idx}>{f}</li>)
          ) : (
            <li>No elevated readings detected.</li>
          )}
        </ul>
      </div>

      <div className="mt-3 rounded-lg border border-brand-yellow-dark/30 bg-brand-yellow/10 p-2.5 text-xs font-medium text-ink">
        <strong className="font-bold">Recommended action: </strong>
        {health.recommended_action}
      </div>
      <p className="mt-2 text-[11px] text-ink-faint">
        This is a predicted maintenance risk signal, not a certainty. Inspection is recommended, not a guarantee of
        failure.
      </p>
    </Card>
  );
}

function SignalTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-sunken/60 p-2">
      <p className="font-bold text-ink">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  );
}
