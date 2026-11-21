import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { taskScope, getBlockedTaskIds, isOverdue } from "@/lib/task-access";
import { KanbanBoard, type KanbanTask } from "@/components/tasks/kanban-board";
import { Button } from "@/components/ui/button";

export default async function BoardPage() {
  const user = await requireRole(
    "ADMIN",
    "PROJECT_MANAGER",
    "SITE_ENGINEER",
    "CONTRACTOR",
  );

  const tasks = await prisma.task.findMany({
    where: await taskScope(user),
    orderBy: { deadline: "asc" },
    take: 200,
    include: {
      project: { select: { name: true } },
      assignee: { select: { name: true } },
    },
  });
  const blocked = await getBlockedTaskIds(tasks.map((t) => t.id));

  const data: KanbanTask[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    project: t.project.name,
    priority: t.priority,
    deadline: t.deadline.toISOString(),
    assignee: t.assignee?.name ?? "Unassigned",
    status: t.status,
    overdue: isOverdue(t),
    blocked: blocked.has(t.id),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B192C]">Kanban Board</h1>
          <p className="text-sm text-slate-500">
            Drag a card to change its status
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/tasks">List view</Link>
        </Button>
      </div>
      <KanbanBoard initial={data} />
    </div>
  );
}
