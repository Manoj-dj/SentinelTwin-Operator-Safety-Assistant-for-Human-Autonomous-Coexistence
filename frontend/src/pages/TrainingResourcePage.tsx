import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Presentation } from "lucide-react";
import { useAppState } from "@/contexts/AppStateContext";
import { useToast } from "@/contexts/ToastContext";
import { useTrainingProgress, useTrainingResources, useUpdateTrainingProgress } from "@/hooks/useTraining";
import { ContentPageShell } from "@/components/training/templates/ContentPageShell";
import { ManualTemplate } from "@/components/training/templates/ManualTemplate";
import { SOPTemplate } from "@/components/training/templates/SOPTemplate";
import { SimulationGuideTemplate } from "@/components/training/templates/SimulationGuideTemplate";
import { ChecklistTemplate } from "@/components/training/templates/ChecklistTemplate";
import { QuizTemplate } from "@/components/training/templates/QuizTemplate";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { pointsForResourceType } from "@/lib/trainingContent";

type Stage = "content" | "quiz";

export default function TrainingResourcePage() {
  const { resourceId } = useParams<{ resourceId: string }>();
  const { selectedOperatorId } = useAppState();
  const { pushToast } = useToast();
  const [stage, setStage] = useState<Stage>("content");

  const resourcesQuery = useTrainingResources();
  const progressQuery = useTrainingProgress(selectedOperatorId);
  const updateProgress = useUpdateTrainingProgress();

  const resource = useMemo(
    () => resourcesQuery.data?.items.find((r) => r.id === resourceId) ?? null,
    [resourcesQuery.data, resourceId],
  );
  const progress = useMemo(
    () => progressQuery.data?.progress.find((p) => p.resource_id === resourceId) ?? null,
    [progressQuery.data, resourceId],
  );
  const completed = progress?.status === "COMPLETED";

  if (resourcesQuery.isLoading) {
    return <CardSkeleton lines={8} />;
  }

  if (!resource) {
    return (
      <EmptyState
        title="Training resource not found"
        description="This resource may have been removed, or the ID in the URL is invalid."
        action={
          <Link to={ROUTES.training}>
            <Button variant="primary" size="sm">
              Back to Training Hub
            </Button>
          </Link>
        }
      />
    );
  }

  const isQuizResource = resource.resource_type === "QUIZ";

  /** Marks the base content (manual/SOP/checklist/simulation guide) as complete,
   * awards frontend gamification points via a toast, then advances straight
   * into a quiz for the same module -- reusing the same training-progress
   * update endpoint that already existed, just called again once the quiz
   * score comes in. */
  const handleContentComplete = () => {
    if (!selectedOperatorId) return;
    updateProgress.mutate({
      resourceId: resource.id,
      payload: { operator_id: selectedOperatorId, status: "COMPLETED", quiz_score: null },
    });
    const points = pointsForResourceType(resource.resource_type);
    pushToast({
      title: `+${points} points earned!`,
      description: `"${resource.title}" marked complete. A short quiz is ready to reinforce it.`,
      variant: "success",
    });
    setStage("quiz");
  };

  const handleQuizSubmit = (percentage: number) => {
    if (!selectedOperatorId) return;
    updateProgress.mutate({
      resourceId: resource.id,
      payload: { operator_id: selectedOperatorId, status: "COMPLETED", quiz_score: percentage },
    });
  };

  return (
    <ContentPageShell resource={resource}>
      {!selectedOperatorId && (
        <div className="rounded-card border border-status-warning/30 bg-status-warning-bg p-3 text-xs text-status-warning">
          Select an operator from the top bar to save your progress on this resource.
        </div>
      )}

      {stage === "content" && resource.resource_type === "PDF_MANUAL" && (
        <ManualTemplate resource={resource} completed={completed} onComplete={handleContentComplete} isSubmitting={updateProgress.isPending} />
      )}
      {stage === "content" && resource.resource_type === "SOP" && (
        <SOPTemplate resource={resource} completed={completed} onComplete={handleContentComplete} isSubmitting={updateProgress.isPending} />
      )}
      {stage === "content" && resource.resource_type === "SIMULATION_GUIDE" && (
        <SimulationGuideTemplate resource={resource} completed={completed} onComplete={handleContentComplete} isSubmitting={updateProgress.isPending} />
      )}
      {stage === "content" && resource.resource_type === "CHECKLIST" && (
        <ChecklistTemplate resource={resource} completed={completed} onComplete={handleContentComplete} isSubmitting={updateProgress.isPending} />
      )}

      {stage === "content" && completed && !isQuizResource && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Presentation className="h-4 w-4 text-cat-yellow-dark" />
            <p className="text-sm font-semibold text-ink">Ready to test what you remember?</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setStage("quiz")}>
            Take the quiz for this module
          </Button>
        </Card>
      )}

      {(stage === "quiz" || isQuizResource) && (
        <QuizTemplate resource={resource} onSubmitScore={handleQuizSubmit} isSubmitting={updateProgress.isPending} />
      )}

      {resource.resource_type === "VIDEO" && (
        <EmptyState
          title="This is a video resource"
          description="Use the Watch Video button from the Training Hub card to open it -- video resources play externally rather than through a content page."
          action={
            <Link to={ROUTES.training}>
              <Button variant="primary" size="sm">
                Back to Training Hub
              </Button>
            </Link>
          }
        />
      )}
    </ContentPageShell>
  );
}
