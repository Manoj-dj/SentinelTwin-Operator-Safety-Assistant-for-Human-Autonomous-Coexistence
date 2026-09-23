import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical, PlayCircle } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { useDemoScenarios, useRunDemoScenario } from "@/hooks/useSimulation";
import { useToast } from "@/contexts/ToastContext";
import { DEMO_SCENARIO_ROUTE } from "@/lib/constants";
import type { DemoScenarioName, ScenarioResult } from "@/api/types";
import { normalizeError } from "@/api/client";

export function DemoScenarioPanel() {
  const scenariosQuery = useDemoScenarios();
  const runScenario = useRunDemoScenario();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [lastResult, setLastResult] = useState<ScenarioResult | null>(null);
  const [runningName, setRunningName] = useState<string | null>(null);

  const handleRun = async (name: DemoScenarioName) => {
    setRunningName(name);
    try {
      const result = await runScenario.mutateAsync(name);
      setLastResult(result);
      pushToast({
        title: `Scenario complete: ${result.scenario_name.replace(/_/g, " ")}`,
        description: `${result.resulting_incidents.length} incident(s) recorded. See details below.`,
        variant: result.resulting_incidents.length > 0 ? "warning" : "success",
      });
      const route = DEMO_SCENARIO_ROUTE[name];
      if (route) navigate(route);
    } catch (error) {
      pushToast({ title: "Scenario failed", description: normalizeError(error).message, variant: "critical" });
    } finally {
      setRunningName(null);
    }
  };

  return (
    <Card>
      <CardHeader
        icon={<FlaskConical className="h-4 w-4" />}
        title="Demo scenarios"
        subtitle="Calls the real backend simulation endpoint -- results are simulated, not live sensor data."
      />
      {scenariosQuery.isLoading ? (
        <CardSkeleton lines={4} />
      ) : scenariosQuery.isError ? (
        <ErrorState error={scenariosQuery.error} onRetry={() => scenariosQuery.refetch()} compact />
      ) : (
        <div className="space-y-2">
          {scenariosQuery.data?.scenarios.map((scenario) => (
            <div key={scenario.name} className="flex items-start justify-between gap-3 rounded-lg bg-surface-sunken/50 p-2.5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink">{scenario.title}</p>
                <p className="text-[11px] text-ink-muted">{scenario.description}</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                  Expected: {scenario.expected_outcome}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                disabled={runningName === scenario.name}
                onClick={() => void handleRun(scenario.name as DemoScenarioName)}
              >
                <PlayCircle className="h-3.5 w-3.5" />
                {runningName === scenario.name ? "Running..." : "Run"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {lastResult && (
        <div className="mt-3 rounded-lg border border-brand-yellow-dark/30 bg-brand-yellow/10 p-3 text-xs">
          <p className="font-bold text-ink">Last result: {lastResult.scenario_name.replace(/_/g, " ")}</p>
          <p className="mt-1 text-ink-muted">{lastResult.description}</p>
          <p className="mt-1 font-semibold text-ink">
            {lastResult.resulting_incidents.length} incident(s) created from real backend logic.
          </p>
          <pre className="scrollbar-thin mt-2 max-h-32 overflow-auto rounded bg-black/5 p-2 text-[10px] text-ink-muted">
            {JSON.stringify(lastResult.final_risk_summary, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
}
