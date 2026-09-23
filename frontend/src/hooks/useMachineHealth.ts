import { useQuery } from "@tanstack/react-query";
import { getMachineHealthRisk, listMaintenanceRecommendations } from "@/api/healthApi";
import { queryKeys } from "@/lib/queryKeys";

export function useMachineHealthRisk(machineId: string | null) {
  return useQuery({
    queryKey: queryKeys.machineHealthRisk(machineId ?? "none"),
    queryFn: ({ signal }) => getMachineHealthRisk(machineId as string, signal),
    enabled: Boolean(machineId),
    staleTime: 30_000,
    retry: false,
  });
}

export function useMaintenanceRecommendations(machineId?: string) {
  return useQuery({
    queryKey: queryKeys.maintenanceRecommendations(machineId),
    queryFn: ({ signal }) => listMaintenanceRecommendations(machineId, signal),
    staleTime: 60_000,
  });
}
