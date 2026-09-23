import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acknowledgeIncident, getIncident, listIncidents, type IncidentFilters } from "@/api/incidentApi";
import { queryKeys } from "@/lib/queryKeys";
import type { IncidentAcknowledgeRequest } from "@/api/types";

export function useIncidentList(filters: IncidentFilters) {
  return useQuery({
    queryKey: queryKeys.incidents(filters as Record<string, unknown>),
    queryFn: ({ signal }) => listIncidents(filters, signal),
    staleTime: 15_000,
  });
}

export function useIncidentDetail(incidentId: string | null) {
  return useQuery({
    queryKey: queryKeys.incident(incidentId ?? "none"),
    queryFn: ({ signal }) => getIncident(incidentId as string, signal),
    enabled: Boolean(incidentId),
  });
}

export function useAcknowledgeIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, payload }: { incidentId: string; payload: IncidentAcknowledgeRequest }) =>
      acknowledgeIncident(incidentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
