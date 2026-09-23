import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBreak, getBreaksToday, getOperatorFatigue } from "@/api/fatigueApi";
import { queryKeys } from "@/lib/queryKeys";
import type { BreakCreateRequest } from "@/api/types";

export function useOperatorFatigue(operatorId: string | null) {
  return useQuery({
    queryKey: queryKeys.operatorFatigue(operatorId ?? "none"),
    queryFn: ({ signal }) => getOperatorFatigue(operatorId as string, signal),
    enabled: Boolean(operatorId),
    staleTime: 30_000,
    retry: false,
  });
}

export function useBreaksToday(operatorId: string | null) {
  return useQuery({
    queryKey: queryKeys.breaksToday(operatorId ?? "none"),
    queryFn: ({ signal }) => getBreaksToday(operatorId as string, signal),
    enabled: Boolean(operatorId),
    staleTime: 30_000,
  });
}

export function useCreateBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BreakCreateRequest) => createBreak(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.breaksToday(variables.operator_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.operatorFatigue(variables.operator_id) });
    },
  });
}
