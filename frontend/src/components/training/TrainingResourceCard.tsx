import type React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock, ExternalLink, FileText, ListChecks, Play, Presentation, Video } from "lucide-react";
import type { TrainingResourceOut, TrainingResourceType } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatMinutes } from "@/lib/utils";

const TYPE_META: Record<TrainingResourceType, { icon: React.ElementType; actionLabel: string }> = {
  VIDEO: { icon: Video, actionLabel: "Watch video" },
  PDF_MANUAL: { icon: FileText, actionLabel: "Read manual" },
  SOP: { icon: FileText, actionLabel: "Read SOP" },
  CHECKLIST: { icon: ListChecks, actionLabel: "Start checklist" },
  QUIZ: { icon: Presentation, actionLabel: "Take quiz" },
  SIMULATION_GUIDE: { icon: Play, actionLabel: "Open simulation guide" },
};

export function TrainingResourceCard({
  resource,
  status,
  quizScore,
  onMarkComplete,
  isSubmitting,
}: {
  resource: TrainingResourceOut;
  status: string;
  quizScore: number | null;
  onMarkComplete: (quizScore?: number) => void;
  isSubmitting: boolean;
}) {
  const meta = TYPE_META[resource.resource_type];
  const Icon = meta.icon;
  const isVideo = resource.resource_type === "VIDEO";
  const [scoreInput, setScoreInput] = useState<string>(quizScore !== null ? String(quizScore) : "");

  return (
    <div className="flex h-full flex-col rounded-card border border-cat-gray-border bg-surface-raised p-4 shadow-cat-card transition-shadow hover:shadow-cat-card-hover">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-cat-yellow-dark">
          <Icon className="h-4.5 w-4.5" />
          <StatusBadge label={resource.category} tone="info" />
          {resource.is_required && <StatusBadge label="Required" tone="warning" />}
        </div>
        <StatusBadge
          label={status.replace("_", " ")}
          tone={status === "COMPLETED" ? "safe" : status === "IN_PROGRESS" ? "info" : "neutral"}
        />
      </div>
      <h3 className="text-sm font-bold text-ink">{resource.title}</h3>
      <p className="mt-1 flex-1 text-xs text-cat-gray-mid">{resource.description}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {resource.skill_tags.map((tag) => (
          <span key={tag} className="rounded-full bg-cat-gray-light px-2 py-0.5 text-[10px] text-cat-gray-mid">
            {tag}
          </span>
        ))}
      </div>
      <p className="mt-2 flex items-center gap-1 text-[11px] text-cat-gray-mid">
        <Clock className="h-3 w-3" /> {formatMinutes(resource.estimated_duration_min)} ·{" "}
        {resource.machine_type_relevance.join(", ") || "All machine types"}
      </p>

      {resource.resource_type === "QUIZ" && (
        <label className="mt-2 flex items-center gap-2 text-[11px] text-cat-gray-mid">
          Quick-log score (optional)
          <input
            type="number"
            min={0}
            max={100}
            value={scoreInput}
            onChange={(e) => setScoreInput(e.target.value)}
            className="w-16 rounded border border-cat-gray-border bg-surface px-1.5 py-0.5 text-xs focus:border-cat-yellow-dark focus:outline-none"
          />
        </label>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {isVideo ? (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-cat-gray-light px-3 py-1.5 text-xs font-semibold text-ink hover:bg-cat-gray-border"
          >
            <ExternalLink className="h-3.5 w-3.5" /> {meta.actionLabel}
          </a>
        ) : (
          <Link
            to={`/training/resource/${resource.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-cat-yellow px-3 py-1.5 text-xs font-bold text-cat-black shadow-cat-card hover:bg-cat-yellow-dark"
          >
            {meta.actionLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
        {status !== "COMPLETED" && (
          <Button
            variant="ghost"
            size="sm"
            disabled={isSubmitting}
            onClick={() => {
              const parsedScore = scoreInput ? Number(scoreInput) : undefined;
              onMarkComplete(Number.isFinite(parsedScore) ? parsedScore : undefined);
            }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Mark complete
          </Button>
        )}
      </div>
    </div>
  );
}
