import { useMemo, useState } from "react";
import { List, GanttChartSquare } from "lucide-react";
import { useAppState } from "@/contexts/AppStateContext";
import { useTaskList } from "@/hooks/useTasks";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { TaskFilters, type TaskFilterState } from "@/components/tasks/TaskFilters";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskTimeline } from "@/components/tasks/TaskTimeline";
import { TaskDetailDrawer } from "@/components/tasks/TaskDetailDrawer";
import type { TaskOut } from "@/api/types";

export default function TasksPage() {
  const { selectedOperatorId } = useAppState();
  const [view, setView] = useState<"list" | "timeline">("list");
  const [filters, setFilters] = useState<TaskFilterState>({ status: "ALL", priority: "ALL", zone: "ALL" });
  const [selectedTask, setSelectedTask] = useState<TaskOut | null>(null);

  const tasksQuery = useTaskList({ operator_id: selectedOperatorId ?? undefined, page_size: 100 });

  const zones = useMemo(() => {
    const items = tasksQuery.data?.items ?? [];
    return Array.from(new Set(items.map((t) => t.site_zone)));
  }, [tasksQuery.data]);

  const filteredTasks = useMemo(() => {
    const items = tasksQuery.data?.items ?? [];
    return items
      .filter((t) => filters.status === "ALL" || t.status === filters.status)
      .filter((t) => filters.priority === "ALL" || t.priority === filters.priority)
      .filter((t) => filters.zone === "ALL" || t.site_zone === filters.zone)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [tasksQuery.data, filters]);

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-ink">Tasks &amp; Queue Schedule</h1>
          <p className="text-sm text-ink-muted">Daily task board with autonomous truck queue context.</p>
        </div>
        <Tabs
          tabs={[
            { id: "list", label: "List", icon: <List className="h-3.5 w-3.5" /> },
            { id: "timeline", label: "Timeline", icon: <GanttChartSquare className="h-3.5 w-3.5" /> },
          ]}
          active={view}
          onChange={setView}
        />
      </Card>

      <TaskFilters value={filters} onChange={setFilters} zones={zones} />

      {tasksQuery.isLoading ? (
        <CardSkeleton lines={5} />
      ) : tasksQuery.isError ? (
        <ErrorState error={tasksQuery.error} onRetry={() => tasksQuery.refetch()} />
      ) : filteredTasks.length === 0 ? (
        <EmptyState title="No tasks match these filters" description="Try clearing a filter or check back later." />
      ) : view === "list" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={() => setSelectedTask(task)} />
          ))}
        </div>
      ) : (
        <TaskTimeline tasks={filteredTasks} onOpenTask={setSelectedTask} />
      )}

      <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
}
