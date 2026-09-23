import { useQuery } from "@tanstack/react-query";
import { listOperators } from "@/api/operatorApi";
import { listMachines } from "@/api/machineApi";
import { queryKeys } from "@/lib/queryKeys";

/** Lightweight operator/machine directories for selector dropdowns across the app. */
export function useOperatorDirectory() {
  return useQuery({
    queryKey: queryKeys.operators(1),
    queryFn: ({ signal }) => listOperators({ page: 1, page_size: 50 }, signal),
    staleTime: 5 * 60_000,
  });
}

export function useMachineDirectory() {
  return useQuery({
    queryKey: queryKeys.machines(1),
    queryFn: ({ signal }) => listMachines({ page: 1, page_size: 50 }, signal),
    staleTime: 5 * 60_000,
  });
}
