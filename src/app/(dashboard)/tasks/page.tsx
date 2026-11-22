import Link from "next/link";
import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { taskScope, getBlockedTaskIds, isOverdue } from "@/lib/task-access";
import { TaskFilters } from "@/components/tasks/task-filters";
import { Pagination } from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button"; // <-- Fixed import from local ui component
import { Plus } from "lucide-react";

const PAGE_SIZE = 10;

const ORDER: Record<string, Prisma.TaskOrderByWithRelationInput> = {
  deadline: { deadline: "asc" },
  priority: { priority: "desc" },
  newest: { createdAt: "desc" },
};

type SP = {
  q?: string;
  status?: string;
  priority?: string;
  flag?: string;
  sort?: string;
  page?: string;
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const user = await requireRole(
    "ADMIN",
    "PROJECT_MANAGER",
    "SITE_ENGINEER",
    "CONTRACTOR",
  );
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.TaskWhereInput = {
    AND: [
      await taskScope(user),
      sp.q ? { title: { contains: sp.q, mode: "insensitive" } } : {},
      sp.status ? { status: sp.status as Prisma.TaskWhereInput["status"] } : {},
      sp.priority
        ? { priority: sp.priority as Prisma.TaskWhereInput["priority"] }
        : {},
      sp.flag === "overdue"
        ? { deadline: { lt: new Date() }, status: { not: "COMPLETED" } }
        : {},
    ],
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: ORDER[sp.sort ?? "deadline"] ?? ORDER.deadline,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    }),
    prisma.task.count({ where }),
  ]);

  const blocked = await getBlockedTaskIds(tasks.map((t) => t.id));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B192C]">Tasks</h1>
          <p className="text-sm text-slate-500">{total} task(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/tasks/board">Board view</Link>
          </Button>
          {(user.role === "ADMIN" || user.role === "PROJECT_MANAGER") && (
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              asChild
            >
              <Link href="/tasks/new" className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Suspense>
        <TaskFilters />
      </Suspense>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Flags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-slate-500"
                >
                  No tasks found.
                </TableCell>
              </TableRow>
            )}
            {tasks.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium text-[#0B192C]">
                  <Link href={`/tasks/${t.id}`} className="hover:underline">
                    {t.title}
                  </Link>
                </TableCell>
                <TableCell>{t.project.name}</TableCell>
                <TableCell>{t.assignee?.name ?? "Unassigned"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{t.priority}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {t.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>{t.deadline.toLocaleDateString()}</TableCell>
                <TableCell className="space-x-1">
                  {isOverdue(t) && <Badge variant="destructive">Overdue</Badge>}
                  {blocked.has(t.id) && (
                    <Badge className="bg-amber-500">Blocked</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/tasks"
        params={{
          q: sp.q,
          status: sp.status,
          priority: sp.priority,
          flag: sp.flag,
          sort: sp.sort,
        }}
      />
    </div>
  );
}
