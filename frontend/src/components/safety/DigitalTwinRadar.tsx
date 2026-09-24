import { useMemo, useState, type WheelEvent } from "react";
import { Compass, Minus, Plus, RotateCcw, Truck as TruckIcon } from "lucide-react";
import type { AutonomousTruckOut } from "@/api/types";
import { TRUCK_STATE_STYLES } from "@/lib/constants";
import { bearingDeg, distanceToRadius, euclideanDistance, polarToCartesian } from "@/lib/geometry";
import { cn } from "@/lib/utils";

const VIEW_SIZE = 320;
const CENTER = VIEW_SIZE / 2;
const MAX_RADIUS = 130;
const MAX_DISTANCE_M = 300;
const SCALE_REF_M = 50;
const SCALE_BAR_PX = (SCALE_REF_M / MAX_DISTANCE_M) * MAX_RADIUS;
const MIN_ZOOM = 0.7;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.3;

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
        const radius = distanceToRadius(distance, MAX_RADIUS, MAX_DISTANCE_M);
        return { ...polarToCartesian(CENTER, CENTER, radius, angle), realPosition: true };
      }
      // No known operator position -- arrange evenly with unknown-distance styling
      // rather than fabricating a false position.
      const angle = (360 / Math.max(trucks.length, 1)) * index;
      return { ...polarToCartesian(CENTER, CENTER, MAX_RADIUS * 0.7, angle), realPosition: false };
    });
  }, [trucks, operatorMachinePosition]);

  const selectedIndex = trucks.findIndex((t) => t.truck.id === selectedTruckId);
  const selectedPos = selectedIndex >= 0 ? positions[selectedIndex] : null;
  const selectedDistance = selectedIndex >= 0 ? trucks[selectedIndex].distanceM : null;

  // Zoom is purely a view-window change: it shrinks/grows the visible portion
  // of the same viewBox, recentered on the operator's position. No positions,
  // distances, or other data are recalculated.
  const [zoom, setZoom] = useState(1);
  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
  const zoomIn = () => setZoom((z) => clampZoom(z + ZOOM_STEP));
  const zoomOut = () => setZoom((z) => clampZoom(z - ZOOM_STEP));
  const resetZoom = () => setZoom(1);
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setZoom((z) => clampZoom(z - e.deltaY * 0.001));
  };

  const vbSize = VIEW_SIZE / zoom;
  const vbOffset = (VIEW_SIZE - vbSize) / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-full max-w-sm" onWheel={handleWheel}>
        {/* Compass rose -- a generic site-orientation aid, not a claim of true north telemetry. */}
        <div
          className="absolute right-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-cat-gray-border bg-white/90 text-cat-gray-mid shadow-cat-card"
          title="Orientation reference"
        >
          <Compass className="h-4 w-4" aria-hidden="true" />
        </div>

        {/* Zoom controls */}
        <div className="absolute left-1 top-1 z-10 flex flex-col overflow-hidden rounded-lg border border-cat-gray-border bg-white/90 shadow-cat-card">
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
            className="cat-focus-ring flex h-7 w-7 items-center justify-center text-cat-gray-mid hover:bg-cat-gray-light hover:text-cat-black disabled:opacity-30"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
            className="cat-focus-ring flex h-7 w-7 items-center justify-center border-t border-cat-gray-border text-cat-gray-mid hover:bg-cat-gray-light hover:text-cat-black disabled:opacity-30"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            aria-label="Reset zoom"
            className="cat-focus-ring flex h-7 w-7 items-center justify-center border-t border-cat-gray-border text-cat-gray-mid hover:bg-cat-gray-light hover:text-cat-black"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>

        <svg
          viewBox={`${vbOffset} ${vbOffset} ${vbSize} ${vbSize}`}
          className="w-full touch-none"
          role="img"
          aria-label="Site proximity visualization showing your machine and nearby autonomous trucks"
        >
          <defs>
            <pattern id="terrain-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--cat-gray-border)" strokeWidth="0.6" />
            </pattern>
          </defs>

          {/* Terrain background */}
          <rect x="0" y="0" width={VIEW_SIZE} height={VIEW_SIZE} fill="var(--cat-gray-light)" opacity="0.5" />
          <rect x="0" y="0" width={VIEW_SIZE} height={VIEW_SIZE} fill="url(#terrain-grid)" />

          {/* Illustrative zone quadrant dividers -- generic site-layout orientation aid, not
              tied to a specific truck's real zone geometry (the backend has no zone polygon data). */}
          <line x1={CENTER} y1="0" x2={CENTER} y2={VIEW_SIZE} stroke="var(--cat-gray-border)" strokeWidth="1" strokeDasharray="2 6" />
          <line x1="0" y1={CENTER} x2={VIEW_SIZE} y2={CENTER} stroke="var(--cat-gray-border)" strokeWidth="1" strokeDasharray="2 6" />
          {[
            { label: "Zone A", x: 18, y: 18 },
            { label: "Zone B", x: VIEW_SIZE - 18, y: 18 },
            { label: "Zone C", x: 18, y: VIEW_SIZE - 10 },
            { label: "Zone D", x: VIEW_SIZE - 18, y: VIEW_SIZE - 10 },
          ].map((z) => (
            <text
              key={z.label}
              x={z.x}
              y={z.y}
              textAnchor={z.x > CENTER ? "end" : "start"}
              className="fill-cat-gray-mid text-[9px] font-semibold uppercase tracking-wide opacity-60"
            >
              {z.label}
            </text>
          ))}

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
              className="text-cat-gray-mid/30"
            />
          ))}

          {/* Distance line + label to the selected truck */}
          {selectedPos && (
            <g>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={selectedPos.x}
                y2={selectedPos.y}
                stroke="var(--cat-yellow-dark)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <rect
                x={(CENTER + selectedPos.x) / 2 - 20}
                y={(CENTER + selectedPos.y) / 2 - 9}
                width="40"
                height="16"
                rx="8"
                className="fill-cat-black"
              />
              <text
                x={(CENTER + selectedPos.x) / 2}
                y={(CENTER + selectedPos.y) / 2 + 3}
                textAnchor="middle"
                className="fill-white text-[9px] font-bold"
              >
                {selectedDistance !== null ? `${Math.round(selectedDistance)}m` : "n/a"}
              </text>
            </g>
          )}

          {/* Operator machine marker */}
          <g transform={`translate(${CENTER} ${CENTER})`}>
            <circle r="15" className="fill-cat-black" />
            <circle r="15" fill="none" stroke="var(--cat-yellow)" strokeWidth="2" />
            <text y="26" textAnchor="middle" className="fill-cat-black text-[9px] font-bold">
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
                className={cn("cursor-pointer outline-none", style.ring)}
              >
                {isHighRisk && <circle r="11" fill="currentColor" opacity={0.45} className="truck-risk-pulse" />}
                <circle
                  r={isSelected ? 13 : 11}
                  fill="currentColor"
                  stroke={isSelected ? "var(--cat-yellow)" : "white"}
                  strokeWidth={isSelected ? 3 : 2}
                />
                <TruckIcon
                  x={-6}
                  y={-6}
                  width="12"
                  height="12"
                  className="text-white"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
                <text y="-18" textAnchor="middle" className="fill-cat-black text-[10px] font-bold">
                  {item.truck.truck_code}
                </text>
                <text y="26" textAnchor="middle" className="fill-cat-gray-mid text-[9px]">
                  {item.distanceM !== null ? `${Math.round(item.distanceM)} m` : "distance unknown"}
                </text>
              </g>
            );
          })}

          {/* Scale reference bar */}
          <g transform={`translate(14 ${VIEW_SIZE - 16})`}>
            <line x1="0" y1="0" x2={SCALE_BAR_PX} y2="0" stroke="var(--cat-black)" strokeWidth="2" />
            <line x1="0" y1="-3" x2="0" y2="3" stroke="var(--cat-black)" strokeWidth="2" />
            <line x1={SCALE_BAR_PX} y1="-3" x2={SCALE_BAR_PX} y2="3" stroke="var(--cat-black)" strokeWidth="2" />
            <text x={SCALE_BAR_PX + 6} y="3" className="fill-cat-black text-[9px] font-semibold">
              {SCALE_REF_M}m
            </text>
          </g>
        </svg>
      </div>
      <p className="text-center text-[10px] text-cat-gray-mid">Scroll to zoom, or use the +/- controls.</p>
      <p className="text-center text-[11px] text-cat-gray-mid">
        {operatorMachinePosition
          ? "Positions derived from reported GPS coordinates. Not a substitute for direct visual confirmation."
          : "Your machine's position is unavailable -- truck layout below is illustrative, not positional."}
      </p>
    </div>
  );
}
