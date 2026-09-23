import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { runDemoScenario } from "@/api/simulationApi";
import { getDemoScenarios } from "@/api/systemApi";
import { queryKeys } from "@/lib/queryKeys";
import type { DemoScenarioName } from "@/api/types";

export function useDemoScenarios() {
  return useQuery({
    queryKey: queryKeys.demoScenarios(),
    queryFn: ({ signal }) => getDemoScenarios(signal),
    staleTime: 10 * 60_000,
  });
}

export function useRunDemoScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scenario: DemoScenarioName) => runDemoScenario(scenario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["system"] });
      queryClient.invalidateQueries({ queryKey: ["fatigue"] });
      queryClient.invalidateQueries({ queryKey: ["health"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["digital-twin"] });
    },
  });
}
