/** Real-position distance math using backend-reported gps_x/gps_y (never fabricated). */
export function euclideanDistance(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
}

export function bearingDeg(ax: number, ay: number, bx: number, by: number): number {
  const angle = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
  return (angle + 360) % 360;
}

/** Maps a real distance to a radar radius (px), compressing far distances so the view stays legible. */
export function distanceToRadius(distanceM: number, maxRadiusPx: number, maxDistanceM = 300): number {
  const clamped = Math.min(distanceM, maxDistanceM);
  return (clamped / maxDistanceM) * maxRadiusPx;
}

export function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleDeg: number,
): { x: number; y: number } {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleRad),
    y: centerY + radius * Math.sin(angleRad),
  };
}
