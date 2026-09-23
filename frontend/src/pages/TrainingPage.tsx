import { useMemo, useState } from "react";
import { GraduationCap } from "lucide-react";
import { useAppState } from "@/contexts/AppStateContext";
import { useTrainingProgress, useTrainingRecommendations, useTrainingResources, useUpdateTrainingProgress } from "@/hooks/useTraining";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { TrainingFilters, type TrainingFilterState } from "@/components/training/TrainingFilters";
import { TrainingResourceCard } from "@/components/training/TrainingResourceCard";
import { LearningPathCard } from "@/components/training/LearningPathCard";

export default function TrainingPage() {
  const { selectedOperatorId } = useAppState();
  const [filters, setFilters] = useState<TrainingFilterState>({ search: "", resourceType: "ALL", requiredOnly: false });

  const resourcesQuery = useTrainingResources();
  const progressQuery = useTrainingProgress(selectedOperatorId);
  const recommendationsQuery = useTrainingRecommendations(selectedOperatorId);
  const updateProgress = useUpdateTrainingProgress();

  const progressByResource = useMemo(() => {
    const map = new Map<string, { status: string; quiz_score: number | null }>();
    for (const p of progressQuery.data?.progress ?? []) {
      map.set(p.resource_id, { status: p.status, quiz_score: p.quiz_score });
    }
    return map;
  }, [progressQuery.data]);

  const completedTitles = useMemo(() => {
    const completedIds = new Set(
      (progressQuery.data?.progress ?? []).filter((p) => p.status === "COMPLETED").map((p) => p.resource_id),
    );
    return (resourcesQuery.data?.items ?? []).filter((r) => completedIds.has(r.id)).map((r) => r.title);
  }, [progressQuery.data, resourcesQuery.data]);

  const filteredResources = useMemo(() => {
    const items = resourcesQuery.data?.items ?? [];
    const search = filters.search.trim().toLowerCase();
    return items.filter((r) => {
      if (filters.resourceType !== "ALL" && r.resource_type !== filters.resourceType) return false;
      if (filters.requiredOnly && !r.is_required) return false;
      if (search && !r.title.toLowerCase().includes(search) && !r.description.toLowerCase().includes(search)) return false;
      return true;
    });
  }, [resourcesQuery.data, filters]);

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-brand-yellow-dark" />
          <div>
            <h1 className="text-lg font-bold text-ink">Operator Training Hub</h1>
            <p className="text-sm text-ink-muted">Manuals, SOPs, checklists, videos, and quizzes.</p>
          </div>
        </div>
        <TrainingFilters value={filters} onChange={setFilters} />
      </Card>

      {selectedOperatorId && <LearningPathCard completedTitles={completedTitles} />}

      {recommendationsQuery.data?.recommendations.length ? (
        <Card>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">Recommended for you</p>
          <div className="flex flex-wrap gap-2">
            {recommendationsQuery.data.recommendations.map((rec) => (
              <span key={rec.resource.id} className="rounded-full bg-status-info-bg px-3 py-1 text-xs font-medium text-status-info">
                {rec.resource.title} ({rec.priority})
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      {resourcesQuery.isLoading ? (
        <CardSkeleton lines={6} />
      ) : resourcesQuery.isError ? (
        <ErrorState error={resourcesQuery.error} onRetry={() => resourcesQuery.refetch()} />
      ) : filteredResources.length === 0 ? (
        <EmptyState title="No training resources match these filters" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredResources.map((resource) => {
            const progress = progressByResource.get(resource.id);
            return (
              <TrainingResourceCard
                key={resource.id}
                resource={resource}
                status={progress?.status ?? "NOT_STARTED"}
                quizScore={progress?.quiz_score ?? null}
                isSubmitting={updateProgress.isPending}
                onMarkComplete={(quizScore) => {
                  if (!selectedOperatorId) return;
                  updateProgress.mutate({
                    resourceId: resource.id,
                    payload: { operator_id: selectedOperatorId, status: "COMPLETED", quiz_score: quizScore ?? null },
                  });
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
