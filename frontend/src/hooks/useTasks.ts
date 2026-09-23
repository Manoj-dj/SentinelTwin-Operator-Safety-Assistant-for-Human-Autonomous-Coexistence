import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTasksToday, listTasks, predictTaskDuration } from "@/api/taskApi";
import { queryKeys } from "@/lib/queryKeys";

export function useTasksToday(operatorId: string | null) {
  return useQuery({
    queryKey: queryKeys.tasksToday(operatorId ?? "none"),
    queryFn: ({ signal }) => getTasksToday(operatorId as string, signal),
    enabled: Boolean(operatorId),
    staleTime: 20_000,
  });
}

export function useTaskList(filters: {
  operator_id?: string;
  machine_id?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery({
    queryKey: queryKeys.tasks(filters),
    queryFn: ({ signal }) => listTasks(filters, signal),
    staleTime: 30_000,
  });
}

export function usePredictTaskDuration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => predictTaskDuration(taskId),
    onSuccess: (_data, taskId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taskPrediction(taskId) });
    },
  });
}
