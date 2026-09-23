import { useQuery } from "@tanstack/react-query";
import { getOperatorDashboard } from "@/api/dashboardApi";
import { queryKeys } from "@/lib/queryKeys";

export function useOperatorDashboard(operatorId: string | null) {
  return useQuery({
    queryKey: queryKeys.dashboard(operatorId ?? "none"),
    queryFn: ({ signal }) => getOperatorDashboard(operatorId as string, signal),
    enabled: Boolean(operatorId),
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
}
