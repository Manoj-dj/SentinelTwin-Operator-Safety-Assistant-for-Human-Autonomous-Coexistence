import { request } from "./client";
import type { DemoScenarioName, ScenarioResult } from "./types";

export async function runDemoScenario(scenarioName: DemoScenarioName, signal?: AbortSignal) {
  return request<ScenarioResult>({
    url: `/api/v1/simulation/run-scenario/${scenarioName}`,
    method: "POST",
    signal,
  });
}
