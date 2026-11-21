"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { changeTaskStatus } from "@/actions/task";
import { Badge } from "@/components/ui/badge";

export type KanbanTask = {
  id: string;
  title: string;
  project: string;
  priority: string;
  deadline: string;
  assignee: string;
  status: string;
  overdue: boolean;
  blocked: boolean;
};

const COLUMNS = [
  { id: "TODO", label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "REVIEW", label: "Review" },
  { id: "COMPLETED", label: "Completed" },
];

function Card({ task }: { task: KanbanTask }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-md border bg-white p-3 text-sm shadow-sm ${isDragging ? "z-50 opacity-80 shadow-lg" : ""}`}
    >
      <Link
        href={`/tasks/${task.id}`}
        className="font-medium text-[#0B192C] hover:underline"
      >
        {task.title}
      </Link>
      <p className="mt-1 text-xs text-slate-500">{task.project}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Badge variant="outline">{task.priority}</Badge>
        {task.overdue && <Badge variant="destructive">Overdue</Badge>}
        {task.blocked && <Badge className="bg-amber-500">Blocked</Badge>}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {task.assignee} · {new Date(task.deadline).toLocaleDateString()}
      </p>
    </div>
  );
}

function Column({
  id,
  label,
  tasks,
}: {
  id: string;
  label: string;
  tasks: KanbanTask[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[300px] flex-col gap-2 rounded-lg p-3 ${isOver ? "bg-orange-50" : "bg-slate-100"}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#0B192C]">{label}</h3>
        <span className="text-xs text-slate-500">{tasks.length}</span>
      </div>
      {tasks.map((t) => (
        <Card key={t.id} task={t} />
      ))}
    </div>
  );
}

export function KanbanBoard({ initial }: { initial: KanbanTask[] }) {
  const [tasks, setTasks] = useState(initial);
  const [error, setError] = useState("");
  const [, start] = useTransition();
  // distance > 6px means a drag; a plain click still opens the task link
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const target = e.over?.id as string | undefined;
    const id = e.active.id as string;
    const task = tasks.find((t) => t.id === id);
    if (!target || !task || task.status === target) return;

    const previous = tasks;
    setError("");
    setTasks((all) =>
      all.map((t) => (t.id === id ? { ...t, status: target } : t)),
    );

    start(async () => {
      const r = await changeTaskStatus(id, target);
      if (!r.ok) {
        setTasks(previous); // revert on a server-side rejection
        setError(r.error ?? "Could not change status");
      }
    });
  };

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>
      )}
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((c) => (
            <Column
              key={c.id}
              id={c.id}
              label={c.label}
              tasks={tasks.filter((t) => t.status === c.id)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
