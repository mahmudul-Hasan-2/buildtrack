import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const money = (n: number) => `$${n.toLocaleString()}`;

export default async function BudgetPage() {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER", "FINANCE_MANAGER");

  // A PM only sees their own projects
  const projects = await prisma.project.findMany({
    where: user.role === "PROJECT_MANAGER" ? { managerId: user.id } : {},
    select: { id: true, name: true, status: true, totalBudget: true },
  });
  const grouped = await prisma.expense.groupBy({
    by: ["projectId"],
    where: { projectId: { in: projects.map((p) => p.id) } },
    _sum: { amount: true },
  });
  const spentMap = new Map(
    grouped.map((g) => [g.projectId, Number(g._sum.amount ?? 0)]),
  );

  const rows = projects
    .map((p) => {
      const budget = Number(p.totalBudget);
      const spent = spentMap.get(p.id) ?? 0;
      return {
        ...p,
        budget,
        spent,
        remaining: budget - spent,
        pct: budget ? Math.round((spent / budget) * 100) : 0,
      };
    })
    .sort((a, b) => b.pct - a.pct);

  const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const overruns = rows.filter((r) => r.spent > r.budget).length;

  const stats = [
    { label: "Total Budget", value: money(totalBudget) },
    { label: "Total Spent", value: money(totalSpent) },
    { label: "Remaining", value: money(totalBudget - totalSpent) },
    { label: "Over Budget Projects", value: String(overruns) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0B192C]">Budget</h1>
        {(user.role === "ADMIN" || user.role === "FINANCE_MANAGER") && (
          <Link
            href="/expenses"
            className="text-sm text-orange-600 hover:underline"
          >
            View expenses
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[#0B192C]">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead className="text-right">Budget</TableHead>
              <TableHead className="text-right">Spent</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead className="w-48">Utilization</TableHead>
              <TableHead>Alert</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium text-[#0B192C]">
                  {r.name}
                </TableCell>
                <TableCell className="text-right">{money(r.budget)}</TableCell>
                <TableCell className="text-right">{money(r.spent)}</TableCell>
                <TableCell
                  className={`text-right ${r.remaining < 0 ? "text-red-600" : ""}`}
                >
                  {money(r.remaining)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={Math.min(100, r.pct)} className="h-2" />
                    <span className="text-xs">{r.pct}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {r.spent > r.budget ? (
                    <Badge variant="destructive">Over budget</Badge>
                  ) : r.pct >= 80 ? (
                    <Badge className="bg-amber-500">Near limit</Badge>
                  ) : (
                    <Badge variant="secondary">OK</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
