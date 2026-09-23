import { useQuery } from "@tanstack/react-query";
import { getLatestTelemetry } from "@/api/telemetryApi";

export function useLatestTelemetry(machineId: string | null) {
  return useQuery({
    queryKey: ["telemetry", "latest", machineId ?? "none"],
    queryFn: ({ signal }) => getLatestTelemetry(machineId as string, signal),
    enabled: Boolean(machineId),
    staleTime: 15_000,
    refetchInterval: 20_000,
    retry: false,
  });
}
