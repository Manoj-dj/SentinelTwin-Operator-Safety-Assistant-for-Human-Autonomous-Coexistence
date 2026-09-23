import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="text-4xl font-extrabold text-ink">404</p>
      <p className="text-sm text-ink-muted">This screen does not exist in SentinelTwin.</p>
      <Link to={ROUTES.dashboard}>
        <Button variant="primary">Back to Dashboard</Button>
      </Link>
    </div>
  );
}
