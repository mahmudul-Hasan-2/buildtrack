import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { ReportsCharts } from "@/components/reports/reports-charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const short = (s: string) => (s.length > 14 ? s.slice(0, 13) + "…" : s);

async function ReportsContent() {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER", "FINANCE_MANAGER");
  const projectWhere =
    user.role === "PROJECT_MANAGER" ? { managerId: user.id } : {};
  const showTasks = user.role !== "FINANCE_MANAGER";

  const [projects, expenses] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      select: { id: true, name: true, totalBudget: true },
    }),
    prisma.expense.findMany({
      where: { project: projectWhere },
      select: { date: true, amount: true, projectId: true },
    }),
  ]);

  // Budget vs actual
  const spentBy = new Map<string, number>();
  expenses.forEach((e) =>
    spentBy.set(
      e.projectId,
      (spentBy.get(e.projectId) ?? 0) + Number(e.amount),
    ),
  );
  const budgetRows = projects
    .map((p) => ({
      name: short(p.name),
      budget: Number(p.totalBudget),
      spent: spentBy.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 8);
  const totalBudget = projects.reduce((s, p) => s + Number(p.totalBudget), 0);
  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);

  // Monthly trend (last 12 months)
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (11 - i));
    return d;
  });
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
  const monthTotals = new Map(months.map((d) => [key(d), 0]));
  expenses.forEach((e) => {
    const k = key(e.date);
    if (monthTotals.has(k))
      monthTotals.set(k, monthTotals.get(k)! + Number(e.amount));
  });
  const monthly = months.map((d) => ({
    month: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
    total: monthTotals.get(key(d)) ?? 0,
  }));

  // Task + contractor data (not for Finance)
  let taskStatus: { name: string; value: number }[] = [];
  let contractors: { name: string; rate: number; total: number }[] = [];
  let completion = 0;

  if (showTasks) {
    const [grouped, tasks] = await Promise.all([
      prisma.task.groupBy({
        by: ["status"],
        where: { project: projectWhere },
        _count: { _all: true },
      }),
      prisma.task.findMany({
        where: { project: projectWhere, contractorId: { not: null } },
        select: { contractorId: true, status: true },
      }),
    ]);
    const order = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"];
    taskStatus = order.map((s) => ({
      name: s.replace("_", " "),
      value: grouped.find((g) => g.status === s)?._count._all ?? 0,
    }));
    const all = taskStatus.reduce((s, t) => s + t.value, 0);
    completion = all ? Math.round((taskStatus[3].value / all) * 100) : 0;

    const stats = new Map<string, { total: number; done: number }>();
    tasks.forEach((t) => {
      const s = stats.get(t.contractorId!) ?? { total: 0, done: 0 };
      s.total++;
      if (t.status === "COMPLETED") s.done++;
      stats.set(t.contractorId!, s);
    });
    const top = [...stats.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 8);
    const names = await prisma.contractor.findMany({
      where: { id: { in: top.map(([id]) => id) } },
      select: { id: true, companyName: true },
    });
    contractors = top.map(([id, s]) => ({
      name: short(names.find((n) => n.id === id)?.companyName ?? "Unknown"),
      rate: Math.round((s.done / s.total) * 100),
      total: s.total,
    }));
  }

  const cards = [
    { label: "Total Budget", value: money(totalBudget) },
    { label: "Total Expenses", value: money(totalSpent) },
    { label: "Remaining", value: money(totalBudget - totalSpent) },
    ...(showTasks
      ? [{ label: "Task completion", value: `${completion}%` }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B192C]">
            Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500">
            All figures are calculated on the server
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/reports/export">Export expenses (CSV)</a>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[#0B192C]">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ReportsCharts
        monthly={monthly}
        budget={budgetRows}
        taskStatus={taskStatus}
        contractors={contractors}
        showTasks={showTasks}
      />
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-96 w-full rounded-lg border bg-muted/25 animate-pulse" />
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
