import type React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { SafetyDisclaimer } from "@/components/ui/SafetyDisclaimer";
import type { TrainingResourceOut } from "@/api/types";
import { formatMinutes } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { pointsForResourceType } from "@/lib/trainingContent";

export function ContentPageShell({
  resource,
  showSafetyFooter = true,
  children,
}: {
  resource: TrainingResourceOut;
  showSafetyFooter?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-16">
      <nav className="flex items-center gap-1 text-xs text-cat-gray-mid" aria-label="Breadcrumb">
        <Link to={ROUTES.training} className="cat-focus-ring flex items-center gap-1 font-semibold hover:text-cat-black">
          <ChevronLeft className="h-3.5 w-3.5" /> Training Hub
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span>{resource.category}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-cat-black">{resource.title}</span>
      </nav>

      <header className="rounded-card border border-cat-gray-border bg-white p-5 shadow-cat-card">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge label={resource.category} tone="info" />
          {resource.is_required && <StatusBadge label="Required" tone="warning" />}
          <span className="text-xs text-cat-gray-mid">{formatMinutes(resource.estimated_duration_min)}</span>
          {resource.resource_type !== "QUIZ" && (
            <span className="flex items-center gap-1 rounded-full bg-cat-yellow/15 px-2 py-0.5 text-xs font-bold text-cat-yellow-dark">
              <Sparkles className="h-3 w-3" /> {pointsForResourceType(resource.resource_type)} pts + quiz
            </span>
          )}
        </div>
        <h1 className="cat-heading-accent text-xl font-extrabold tracking-tight text-cat-black">{resource.title}</h1>
        <p className="mt-2 text-sm text-cat-gray-mid">{resource.description}</p>
      </header>

      {children}

      {showSafetyFooter && (
        <footer className="rounded-card border border-cat-gray-border bg-cat-gray-light p-4">
          <SafetyDisclaimer />
        </footer>
      )}
    </div>
  );
}
