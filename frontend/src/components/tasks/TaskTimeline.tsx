import type { TaskOut } from "@/api/types";
import { TaskCard } from "./TaskCard";
import { formatTime } from "@/lib/utils";

export function TaskTimeline({ tasks, onOpenTask }: { tasks: TaskOut[]; onOpenTask: (task: TaskOut) => void }) {
  return (
    <ol className="space-y-4 border-l-2 border-black/10 pl-4">
      {tasks.map((task) => (
        <li key={task.id} className="relative">
          <span className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 border-surface-raised bg-brand-yellow" />
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            {formatTime(task.start_time)}
          </p>
          <TaskCard task={task} onOpen={() => onOpenTask(task)} />
        </li>
      ))}
    </ol>
  );
}
