import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ContractorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER");
  const { id } = await params;

  const c = await prisma.contractor.findUnique({
    where: { id },
    include: {
      projects: {
        include: {
          project: {
            select: { id: true, name: true, status: true, managerId: true },
          },
        },
      },
    },
  });
  if (!c) notFound();

  const [grouped, overdue, recent] = await Promise.all([
    prisma.task.groupBy({
      by: ["status"],
      where: { contractorId: id },
      _count: { _all: true },
    }),
    prisma.task.count({
      where: {
        contractorId: id,
        deadline: { lt: new Date() },
        status: { not: "COMPLETED" },
      },
    }),
    prisma.task.findMany({
      where: { contractorId: id },
      orderBy: { deadline: "desc" },
      take: 10,
      include: { project: { select: { name: true } } },
    }),
  ]);

  const total = grouped.reduce((s, g) => s + g._count._all, 0);
  const done = grouped.find((g) => g.status === "COMPLETED")?._count._all ?? 0;
  const rate = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B192C]">{c.companyName}</h1>
          <p className="text-sm text-slate-500">
            {c.contactName} · {c.email} · {c.phone}
          </p>
          {c.address && <p className="text-sm text-slate-500">{c.address}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={c.status === "ACTIVE" ? "secondary" : "destructive"}>
            {c.status}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link href={`/contractors/${id}/edit`}>Edit</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{c.rating.toFixed(1)} / 5</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">
              Completion rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={rate} />
            <p className="mt-1 text-2xl font-bold">{rate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">
              Tasks (done / total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {done} / {total}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">
              Overdue tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${overdue ? "text-red-600" : ""}`}
            >
              {overdue}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assigned projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {c.projects.length === 0 && (
              <p className="text-slate-500">No projects assigned.</p>
            )}
            {c.projects.map(({ project }) => {
              const canOpen =
                user.role === "ADMIN" || project.managerId === user.id;
              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between"
                >
                  {canOpen ? (
                    <Link
                      href={`/projects/${project.id}`}
                      className="hover:underline"
                    >
                      {project.name}
                    </Link>
                  ) : (
                    <span>{project.name}</span>
                  )}
                  <Badge variant="secondary">
                    {project.status.replace("_", " ")}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Work history (latest 10 tasks)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {recent.length === 0 && (
              <p className="text-slate-500">No tasks yet.</p>
            )}
            {recent.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-2"
              >
                <span className="min-w-0 truncate">
                  {t.title}
                  <span className="text-slate-400"> · {t.project.name}</span>
                </span>
                <Badge variant="outline">{t.status.replace("_", " ")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
