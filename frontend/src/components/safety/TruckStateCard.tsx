import type React from "react";
import { useEffect, useState } from "react";
import { AlertTriangle, Gauge, Radio, Users } from "lucide-react";
import type { AutonomousTruckOut } from "@/api/types";
import { TRUCK_STATE_STYLES } from "@/lib/constants";
import { Card, CardHeader } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/RiskBadge";
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

  // Purely presentational: briefly flash the card border when the risk level
  // changes, so a live re-evaluation is visually noticeable during a demo.
  // Does not affect, delay, or alter the underlying risk value in any way.
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (riskLevel === undefined) return;
    setFlash(true);
    const timer = window.setTimeout(() => setFlash(false), 900);
    return () => window.clearTimeout(timer);
  }, [riskLevel]);

  return (
    <Card className={cn("relative overflow-hidden", flash && "animate-risk-flash")}>
      <div className={cn("absolute inset-x-0 top-0 h-1.5", style.bg)} />
      <CardHeader
        title={truck.truck_code}
        subtitle={style.description}
        action={
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", style.bg, style.text)}>
            {style.label}
          </span>
        }
      />

      {typeof riskScore === "number" && riskLevel && (
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-cat-gray-light p-3">
          <span className="text-3xl font-extrabold tabular-nums text-cat-black">{riskScore.toFixed(0)}</span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-cat-gray-mid">Risk score / 100</p>
            <RiskBadge level={riskLevel} />
          </div>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
        <InfoRow label="Mission" value={truck.active_mission ? truck.mission_type ?? "Active" : "None"} />
        <InfoRow label="Movement" value={`${truck.speed_kmh.toFixed(0)} km/h`} icon={<Gauge className="h-3 w-3" />} />
        <InfoRow
          label="Communication"
          value={truck.communication_status}
          icon={<Radio className="h-3 w-3" />}
          alert={truck.communication_status !== "OK"}
        />
        <InfoRow
          label="Recovery personnel"
          value={truck.recovery_personnel_active ? "Active" : "None"}
          icon={<Users className="h-3 w-3" />}
          alert={truck.recovery_personnel_active}
        />
        <InfoRow label="Distance" value={formatDistance(distanceM)} />
        <InfoRow
          label="Nearby condition change"
          value={truck.nearby_condition_change ? "Yes" : "No"}
          alert={truck.nearby_condition_change}
        />
        <InfoRow label="Last state change" value={formatRelative(truck.last_state_change_at)} />
      </dl>

      <div className="mt-3">
        <ApproachStatusBadge confirmed={truck.safe_to_approach_confirmed} />
      </div>

      {!compact && contributingFactors && contributingFactors.length > 0 && (
        <div className="mt-3 space-y-1 rounded-lg bg-cat-gray-light p-2.5">
          <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-cat-gray-mid">
            <AlertTriangle className="h-3 w-3" /> Contributing factors
          </p>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-cat-gray-mid">
            {contributingFactors.map((factor, idx) => (
              <li key={idx}>{factor}</li>
            ))}
          </ul>
        </div>
      )}

      {!compact && recommendedAction && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-cat-yellow-dark/40 bg-cat-yellow/10 p-3 text-xs font-medium text-ink">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-cat-yellow-dark" aria-hidden="true" />
          <span>
            <strong className="font-bold">Recommended action: </strong>
            {recommendedAction}
          </span>
        </div>
      )}
    </Card>
  );
}

function InfoRow({
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
    <div className="min-w-0 border-b border-cat-gray-border/60 pb-1.5">
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-cat-gray-mid">
        {icon}
        {label}
      </span>
      <span
        title={value}
        className={cn("block truncate font-bold", alert ? "text-status-warning" : "text-ink")}
      >
        {value}
      </span>
    </div>
  );
}
