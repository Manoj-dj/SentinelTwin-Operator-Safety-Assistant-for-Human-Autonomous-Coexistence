import { useQuery } from "@tanstack/react-query";
import { getSystemSummary } from "@/api/systemApi";
import { queryKeys } from "@/lib/queryKeys";

export function useSystemSummary() {
  return useQuery({
    queryKey: queryKeys.systemSummary(),
    queryFn: ({ signal }) => getSystemSummary(signal),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
