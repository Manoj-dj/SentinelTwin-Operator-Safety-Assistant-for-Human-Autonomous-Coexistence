import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTrainingProgress,
  getTrainingRecommendations,
  listTrainingResources,
  updateTrainingProgress,
} from "@/api/trainingApi";
import { queryKeys } from "@/lib/queryKeys";
import type { TrainingProgressUpdateRequest } from "@/api/types";

export function useTrainingResources(category?: string) {
  return useQuery({
    queryKey: queryKeys.trainingResources(category),
    queryFn: ({ signal }) => listTrainingResources(category, signal),
    staleTime: 5 * 60_000,
  });
}

export function useTrainingRecommendations(operatorId: string | null) {
  return useQuery({
    queryKey: queryKeys.trainingRecommendations(operatorId ?? "none"),
    queryFn: ({ signal }) => getTrainingRecommendations(operatorId as string, signal),
    enabled: Boolean(operatorId),
    staleTime: 60_000,
  });
}

export function useTrainingProgress(operatorId: string | null) {
  return useQuery({
    queryKey: queryKeys.trainingProgress(operatorId ?? "none"),
    queryFn: ({ signal }) => getTrainingProgress(operatorId as string, signal),
    enabled: Boolean(operatorId),
    staleTime: 30_000,
  });
}

export function useUpdateTrainingProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      resourceId,
      payload,
    }: {
      resourceId: string;
      payload: TrainingProgressUpdateRequest;
    }) => updateTrainingProgress(resourceId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.trainingProgress(variables.payload.operator_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trainingRecommendations(variables.payload.operator_id),
      });
    },
  });
}
