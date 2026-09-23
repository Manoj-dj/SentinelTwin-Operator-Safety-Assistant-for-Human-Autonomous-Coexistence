import type React from "react";
import { AlertTriangle, Gauge, Radio, Users } from "lucide-react";
import type { AutonomousTruckOut } from "@/api/types";
import { TRUCK_STATE_STYLES } from "@/lib/constants";
import { Card, CardHeader } from "@/components/ui/Card";
import { ApproachStatusBadge } from "./ApproachStatusBadge";
import { formatDistance, formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function TruckStateCard({
  truck,
  distanceM,
  riskScore,
  riskLevel,
  contributingFactors,
  recommendedAction,
  compact = false,
}: {
  truck: AutonomousTruckOut;
  distanceM?: number | null;
  riskScore?: number;
  riskLevel?: string;
  contributingFactors?: string[];
  recommendedAction?: string;
  compact?: boolean;
}) {
  const style = TRUCK_STATE_STYLES[truck.state];

  return (
    <Card className="relative overflow-hidden">
      <div className={cn("absolute inset-x-0 top-0 h-1", style.bg)} />
      <CardHeader
        title={truck.truck_code}
        subtitle={style.description}
        action={
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", style.bg, style.text)}>
            {style.label}
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <Field label="Mission" value={truck.active_mission ? truck.mission_type ?? "Active" : "None"} />
        <Field label="Movement" value={`${truck.speed_kmh.toFixed(0)} km/h`} icon={<Gauge className="h-3 w-3" />} />
        <Field
          label="Communication"
          value={truck.communication_status}
          icon={<Radio className="h-3 w-3" />}
          alert={truck.communication_status !== "OK"}
        />
        <Field
          label="Recovery personnel"
          value={truck.recovery_personnel_active ? "Active" : "None"}
          icon={<Users className="h-3 w-3" />}
          alert={truck.recovery_personnel_active}
        />
        <Field label="Distance" value={formatDistance(distanceM)} />
        <Field
          label="Nearby condition change"
          value={truck.nearby_condition_change ? "Yes" : "No"}
          alert={truck.nearby_condition_change}
        />
        <Field label="Last state change" value={formatRelative(truck.last_state_change_at)} />
        {typeof riskScore === "number" && (
          <Field label="Risk score" value={`${riskScore.toFixed(0)} / 100 (${riskLevel})`} alert={riskScore >= 50} />
        )}
      </div>

      <div className="mt-3">
        <ApproachStatusBadge confirmed={truck.safe_to_approach_confirmed} />
      </div>

      {!compact && contributingFactors && contributingFactors.length > 0 && (
        <div className="mt-3 space-y-1 rounded-lg bg-surface-sunken/70 p-2.5">
          <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
            <AlertTriangle className="h-3 w-3" /> Contributing factors
          </p>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-ink-muted">
            {contributingFactors.map((factor, idx) => (
              <li key={idx}>{factor}</li>
            ))}
          </ul>
        </div>
      )}

      {!compact && recommendedAction && (
        <div className="mt-3 rounded-lg border border-brand-yellow-dark/30 bg-brand-yellow/10 p-2.5 text-xs font-medium text-ink">
          <strong className="font-bold">Recommended action: </strong>
          {recommendedAction}
        </div>
      )}
    </Card>
  );
}

function Field({
  label,
  value,
  icon,
  alert,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  alert?: boolean;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
        {icon}
        {label}
      </p>
      <p className={cn("font-semibold", alert ? "text-status-warning" : "text-ink")}>{value}</p>
    </div>
  );
}
