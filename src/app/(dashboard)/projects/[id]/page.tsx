import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { projectScope } from "@/lib/project-access";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { ContractorManager } from "@/components/projects/contractor-manager";
import { MilestoneManager } from "@/components/projects/milestone-manager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProjectDetailPage({
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

  // A user can only open projects inside their scope
  const p = await prisma.project.findFirst({
    where: { AND: [{ id }, await projectScope(user)] },
    include: {
      manager: { select: { name: true } },
      contractors: {
        include: { contractor: { select: { companyName: true } } },
      },
      milestones: { orderBy: { dueDate: "asc" } },
      _count: { select: { tasks: true } },
    },
  });
  if (!p) notFound();

  const spent = await prisma.expense.aggregate({
    where: { projectId: id },
    _sum: { amount: true },
  });
  const budget = Number(p.totalBudget);
  const used = Number(spent._sum.amount ?? 0);
  const canEdit =
    user.role === "ADMIN" ||
    (user.role === "PROJECT_MANAGER" && p.managerId === user.id);

  const assignedIds = p.contractors.map((c) => c.contractorId);
  const available = canEdit
    ? await prisma.contractor.findMany({
        where: { status: "ACTIVE", id: { notIn: assignedIds } },
        select: { id: true, companyName: true },
        orderBy: { companyName: "asc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B192C]">{p.name}</h1>
          <p className="text-sm text-slate-500">{p.location}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{p.status.replace("_", " ")}</Badge>
          {canEdit && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/projects/${id}/edit`}>Edit</Link>
            </Button>
          )}
          {user.role === "ADMIN" && <DeleteProjectButton id={id} />}
        </div>
      </div>

      <p className="text-slate-700">{p.description}</p>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={p.progress} />
            <p className="mt-2 text-xl font-bold">{p.progress}%</p>
          </CardContent>
        </Card>

        {user.role !== "CONTRACTOR" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">
                Budget used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">
                ${used.toLocaleString()} / ${budget.toLocaleString()}
              </p>
              <p
                className={
                  used > budget
                    ? "text-sm text-red-600"
                    : "text-sm text-slate-500"
                }
              >
                {budget ? Math.round((used / budget) * 100) : 0}% utilized
                {used > budget && " (over budget)"}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{p._count.tasks}</p>
            <p className="text-sm text-slate-500">Manager: {p.manager.name}</p>
            {canEdit && (
              <Button asChild size="sm" variant="outline" className="mt-2">
                <Link href={`/tasks/new?projectId=${id}`}>Add task</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <MilestoneManager
              projectId={id}
              canEdit={canEdit}
              milestones={p.milestones.map((m) => ({
                id: m.id,
                title: m.title,
                dueDate: m.dueDate.toISOString(),
                completed: m.completed,
              }))}
            />
          </CardContent>
        </Card>

        {user.role !== "CONTRACTOR" && (
          <Card>
            <CardHeader>
              <CardTitle>Contractors</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {canEdit ? (
                <ContractorManager
                  projectId={id}
                  assigned={p.contractors.map((c) => ({
                    id: c.contractorId,
                    name: c.contractor.companyName,
                  }))}
                  available={available.map((c) => ({
                    id: c.id,
                    name: c.companyName,
                  }))}
                />
              ) : (
                <div className="space-y-1">
                  {p.contractors.map((c) => (
                    <p key={c.contractorId}>{c.contractor.companyName}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
