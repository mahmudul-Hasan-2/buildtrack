import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { taskScope, getBlockedTaskIds, isOverdue } from "@/lib/task-access";
import { StatusChanger, CommentForm } from "@/components/tasks/task-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(
    "ADMIN",
    "PROJECT_MANAGER",
    "SITE_ENGINEER",
    "CONTRACTOR",
  );
  const { id } = await params;

  const t = await prisma.task.findFirst({
    where: { AND: [{ id }, await taskScope(user)] },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { name: true } },
      contractor: { select: { companyName: true } },
      dependsOn: {
        include: {
          dependsOnTask: { select: { id: true, title: true, status: true } },
        },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
      history: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!t) notFound();

  const blocked = (await getBlockedTaskIds([id])).has(id);
  const isManager = user.role === "ADMIN" || user.role === "PROJECT_MANAGER";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B192C]">{t.title}</h1>
          <p className="text-sm text-slate-500">
            <Link
              href={`/projects/${t.project.id}`}
              className="hover:underline"
            >
              {t.project.name}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOverdue(t) && <Badge variant="destructive">Overdue</Badge>}
          {blocked && <Badge className="bg-amber-500">Blocked</Badge>}
          {isManager && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/tasks/${id}/edit`}>Edit</Link>
            </Button>
          )}
        </div>
      </div>

      {t.description && <p className="text-slate-700">{t.description}</p>}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusChanger
              taskId={id}
              current={t.status}
              canComplete={isManager}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{t.priority}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Deadline</CardTitle>
          </CardHeader>
          <CardContent>{t.deadline.toLocaleDateString()}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={t.progress} />
            <p className="mt-1 text-sm">{t.progress}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Engineer: {t.assignee?.name ?? "Unassigned"}</p>
            <p>Contractor: {t.contractor?.companyName ?? "None"}</p>
            <p className="pt-2 font-medium">Depends on:</p>
            {t.dependsOn.length === 0 && (
              <p className="text-slate-500">No dependencies</p>
            )}
            {t.dependsOn.map((d) => (
              <p key={d.dependsOnTaskId}>
                <Link
                  href={`/tasks/${d.dependsOnTask.id}`}
                  className="hover:underline"
                >
                  {d.dependsOnTask.title}
                </Link>{" "}
                <Badge variant="secondary">
                  {d.dependsOnTask.status.replace("_", " ")}
                </Badge>
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <CommentForm taskId={id} />
            {t.comments.map((c) => (
              <div key={c.id} className="border-t pt-2">
                <p className="font-medium">
                  {c.user.name}{" "}
                  <span className="font-normal text-slate-400">
                    {c.createdAt.toLocaleString()}
                  </span>
                </p>
                <p>{c.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {t.history.map((h) => (
            <p key={h.id}>
              <span className="text-slate-400">
                {h.createdAt.toLocaleString()}
              </span>{" "}
              · {h.user.name}: {h.action}
              {h.fromStatus &&
                h.toStatus &&
                ` (${h.fromStatus} → ${h.toStatus})`}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
