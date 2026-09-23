import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { evaluateTransitionRisk, getNearbyTrucks, getTruckDigitalTwin } from "@/api/safetyApi";
import { listTrucks } from "@/api/truckApi";
import { queryKeys } from "@/lib/queryKeys";
import type { TransitionRiskRequest } from "@/api/types";

export function useTruckDigitalTwin(truckId: string | null) {
  return useQuery({
    queryKey: queryKeys.digitalTwinTruck(truckId ?? "none"),
    queryFn: ({ signal }) => getTruckDigitalTwin(truckId as string, signal),
    enabled: Boolean(truckId),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useNearbyTrucks(operatorId: string | null) {
  return useQuery({
    queryKey: queryKeys.nearbyTrucks(operatorId ?? "none"),
    queryFn: ({ signal }) => getNearbyTrucks(operatorId as string, signal),
    enabled: Boolean(operatorId),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useEvaluateTransitionRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransitionRiskRequest) => evaluateTransitionRisk(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useAllTrucks() {
  return useQuery({
    queryKey: queryKeys.trucks(1),
    queryFn: ({ signal }) => listTrucks({ page: 1, page_size: 50 }, signal),
    staleTime: 10_000,
    refetchInterval: 20_000,
  });
}
