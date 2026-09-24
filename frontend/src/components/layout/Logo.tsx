import catLogo from "@/assets/cat_logo.png";

/**
 * Primary brand mark: the official Caterpillar logo asset, paired with the
 * SentinelTwin wordmark. A white contrast chip sits behind the logo so it
 * renders correctly against the black header bar as well as light surfaces.
 */
export function CatLogoMark({ className = "h-8" }: { className?: string }) {
  return (
    <span className="inline-flex items-center justify-center rounded-md bg-white px-2 py-1 shadow-cat-badge">
      <img src={catLogo} alt="Caterpillar" className={`${className} w-auto object-contain`} />
    </span>
  );
}

export function LogoLockup({ collapsed = false, onDark = false }: { collapsed?: boolean; onDark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <CatLogoMark className="h-7" />
      {!collapsed && (
        <>
          <span className={onDark ? "h-8 w-px bg-white/20" : "h-8 w-px bg-cat-gray-border"} aria-hidden="true" />
          <div className="leading-tight">
            <p className={`text-sm font-extrabold tracking-tight ${onDark ? "text-white" : "text-ink"}`}>
              SentinelTwin
            </p>
            <p
              className={`text-[10px] font-medium uppercase tracking-wide ${
                onDark ? "text-white/60" : "text-ink-muted"
              }`}
            >
              Operator Safety Intelligence
            </p>
          </div>
        </>
      )}
    </div>
  );
}
