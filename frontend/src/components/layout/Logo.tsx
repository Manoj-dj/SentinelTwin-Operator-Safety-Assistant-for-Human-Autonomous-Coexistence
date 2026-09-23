/**
 * Original SentinelTwin mark: an abstract shield silhouette with two
 * overlapping hexagonal "signal" nodes representing the human-operator /
 * autonomous-truck twin-state relationship. Not derived from, and does not
 * reference, any Caterpillar trademark or logo asset.
 */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M24 3 L42 10 V22 C42 33 34.5 41.5 24 45 C13.5 41.5 6 33 6 22 V10 Z"
        fill="var(--color-charcoal)"
      />
      <path
        d="M24 3 L42 10 V22 C42 33 34.5 41.5 24 45 C13.5 41.5 6 33 6 22 V10 Z"
        stroke="var(--color-brand-yellow)"
        strokeWidth="1.5"
      />
      <g transform="translate(24 23)">
        <polygon
          points="-9,-6 0,-11 9,-6 9,5 0,10 -9,5"
          fill="none"
          stroke="var(--color-brand-yellow)"
          strokeWidth="2"
          transform="translate(-6 0)"
        />
        <polygon
          points="-9,-6 0,-11 9,-6 9,5 0,10 -9,5"
          fill="var(--color-brand-yellow)"
          fillOpacity="0.9"
          transform="translate(6 0)"
        />
      </g>
    </svg>
  );
}

export function LogoLockup({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className="h-8 w-8 shrink-0" />
      {!collapsed && (
        <div className="leading-tight">
          <p className="text-sm font-extrabold tracking-tight text-ink">SentinelTwin</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">
            Operator Safety Intelligence
          </p>
        </div>
      )}
    </div>
  );
}
