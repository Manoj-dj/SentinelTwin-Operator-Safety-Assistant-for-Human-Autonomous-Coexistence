import { useQuery } from "@tanstack/react-query";
import { getMachineEfficiency, getOperatorBehavior, getOperatorEfficiency } from "@/api/analyticsApi";
import { queryKeys } from "@/lib/queryKeys";

export function useMachineEfficiency(machineId: string | null) {
  return useQuery({
    queryKey: queryKeys.machineEfficiency(machineId ?? "none"),
    queryFn: ({ signal }) => getMachineEfficiency(machineId as string, signal),
    enabled: Boolean(machineId),
    staleTime: 60_000,
    retry: false,
  });
}

export function useOperatorEfficiency(operatorId: string | null) {
  return useQuery({
    queryKey: queryKeys.operatorEfficiency(operatorId ?? "none"),
    queryFn: ({ signal }) => getOperatorEfficiency(operatorId as string, signal),
    enabled: Boolean(operatorId),
    staleTime: 60_000,
    retry: false,
  });
}

export function useOperatorBehavior(operatorId: string | null) {
  return useQuery({
    queryKey: queryKeys.operatorBehavior(operatorId ?? "none"),
    queryFn: ({ signal }) => getOperatorBehavior(operatorId as string, signal),
    enabled: Boolean(operatorId),
    staleTime: 60_000,
  });
}
