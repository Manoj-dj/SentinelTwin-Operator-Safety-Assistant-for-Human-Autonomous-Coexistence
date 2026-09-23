import { useMemo } from "react";
import type { AutonomousTruckOut } from "@/api/types";
import { TRUCK_STATE_STYLES } from "@/lib/constants";
import { bearingDeg, distanceToRadius, euclideanDistance, polarToCartesian } from "@/lib/geometry";
import { cn } from "@/lib/utils";

const VIEW_SIZE = 320;
const CENTER = VIEW_SIZE / 2;
const MAX_RADIUS = 130;

export interface RadarTruck {
  truck: AutonomousTruckOut;
  distanceM: number | null;
}

export function DigitalTwinRadar({
  operatorMachinePosition,
  trucks,
  selectedTruckId,
  onSelectTruck,
}: {
  operatorMachinePosition: { x: number; y: number } | null;
  trucks: RadarTruck[];
  selectedTruckId: string | null;
  onSelectTruck: (truckId: string) => void;
}) {
  const positions = useMemo(() => {
    return trucks.map((item, index) => {
      if (operatorMachinePosition) {
        const distance = euclideanDistance(
          operatorMachinePosition.x,
          operatorMachinePosition.y,
          item.truck.gps_x,
          item.truck.gps_y,
        );
        const angle = bearingDeg(
          operatorMachinePosition.x,
          operatorMachinePosition.y,
          item.truck.gps_x,
          item.truck.gps_y,
        );
        const radius = distanceToRadius(distance, MAX_RADIUS);
        return { ...polarToCartesian(CENTER, CENTER, radius, angle), realPosition: true };
      }
      // No known operator position -- arrange evenly with unknown-distance styling
      // rather than fabricating a false position.
      const angle = (360 / Math.max(trucks.length, 1)) * index;
      return { ...polarToCartesian(CENTER, CENTER, MAX_RADIUS * 0.7, angle), realPosition: false };
    });
  }, [trucks, operatorMachinePosition]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        className="w-full max-w-sm"
        role="img"
        aria-label="Site proximity visualization showing your machine and nearby autonomous trucks"
      >
        {/* Range rings */}
        {[0.33, 0.66, 1].map((f) => (
          <circle
            key={f}
            cx={CENTER}
            cy={CENTER}
            r={MAX_RADIUS * f}
            fill="none"
            stroke="currentColor"
            strokeDasharray="3 4"
            className="text-ink-faint/30"
          />
        ))}

        {/* Operator machine marker */}
        <g>
          <circle cx={CENTER} cy={CENTER} r="14" className="fill-brand-charcoal" />
          <text x={CENTER} y={CENTER + 4} textAnchor="middle" className="fill-white text-[10px] font-bold">
            YOU
          </text>
        </g>

        {/* Truck markers */}
        {trucks.map((item, index) => {
          const pos = positions[index];
          const style = TRUCK_STATE_STYLES[item.truck.state];
          const isSelected = item.truck.id === selectedTruckId;
          const isHighRisk = item.truck.state === "RECOVERY" || item.truck.state === "TRANSITIONING";

          return (
            <g
              key={item.truck.id}
              transform={`translate(${pos.x} ${pos.y})`}
              onClick={() => onSelectTruck(item.truck.id)}
              role="button"
              tabIndex={0}
              aria-label={`${item.truck.truck_code}, state ${item.truck.state}${item.distanceM ? `, ${Math.round(item.distanceM)} meters away` : ""}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelectTruck(item.truck.id);
              }}
              className="cursor-pointer outline-none"
            >
              {isHighRisk && (
                <circle r="12" className={cn("pulse-ring", style.ring)} fill="currentColor" opacity={0.3} />
              )}
              <circle
                r={isSelected ? 12 : 10}
                className={style.ring}
                fill="currentColor"
                stroke={isSelected ? "var(--color-brand-yellow)" : "white"}
                strokeWidth={isSelected ? 3 : 2}
              />
              <text y="-16" textAnchor="middle" className="fill-ink text-[10px] font-bold">
                {item.truck.truck_code}
              </text>
              <text y="24" textAnchor="middle" className="fill-ink-muted text-[9px]">
                {item.distanceM !== null ? `${Math.round(item.distanceM)} m` : "distance unknown"}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-center text-[11px] text-ink-faint">
        {operatorMachinePosition
          ? "Positions derived from reported GPS coordinates. Not a substitute for direct visual confirmation."
          : "Your machine's position is unavailable -- truck layout below is illustrative, not positional."}
      </p>
    </div>
  );
}
