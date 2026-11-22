import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import { getDashboardStats } from "@/lib/dashboard-stats";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const label = (s: string) => s.replace("_", " ");

export default async function DashboardPage() {
  const user = await requireUser();
  const stats = await getDashboardStats(user);

  const showCharts = user.role === "ADMIN" || user.role === "PROJECT_MANAGER";
  let taskData: { name: string; value: number }[] = [];
  let projectData: { name: string; value: number }[] = [];

  if (showCharts) {
    // A PM only sees data of their own projects
    const projectWhere =
      user.role === "PROJECT_MANAGER" ? { managerId: user.id } : {};
    const [tg, pg] = await Promise.all([
      prisma.task.groupBy({
        by: ["status"],
        where: { project: projectWhere },
        _count: { _all: true },
      }),
      prisma.project.groupBy({
        by: ["status"],
        where: projectWhere,
        _count: { _all: true },
      }),
    ]);
    taskData = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"].map((s) => ({
      name: label(s),
      value: tg.find((g) => g.status === s)?._count._all ?? 0,
    }));
    projectData = [
      "PLANNING",
      "ACTIVE",
      "ON_HOLD",
      "COMPLETED",
      "CANCELLED",
    ].map((s) => ({
      name: label(s),
      value: pg.find((g) => g.status === s)?._count._all ?? 0,
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B192C]">
          Welcome back, {user.name}
        </h1>
        <p className="text-sm text-slate-500">
          {ROLE_LABELS[user.role]} overview
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#0B192C]">{s.value}</p>
              {s.hint && (
                <p className="mt-1 text-xs text-slate-500">{s.hint}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {showCharts && (
        <DashboardCharts tasks={taskData} projects={projectData} />
      )}
    </div>
  );
}
