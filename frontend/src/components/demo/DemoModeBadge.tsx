import { FlaskConical } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/constants";

/** Small persistent badge so judges/reviewers know demo scenarios simulate backend data, not live sensors. */
export function DemoModeBadge() {
  return (
    <Link
      to={ROUTES.settings}
      className="fixed bottom-6 left-6 z-30 hidden items-center gap-1.5 rounded-full border border-black/10 bg-surface-raised px-3 py-1.5 text-[11px] font-semibold text-ink-muted shadow-industrial hover:text-ink md:flex"
      title="Demo scenarios call the real backend simulation endpoint; results are simulated, not live sensor data."
    >
      <FlaskConical className="h-3.5 w-3.5 text-brand-yellow-dark" aria-hidden="true" />
      Demo Mode
    </Link>
  );
}
