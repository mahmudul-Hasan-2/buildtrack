import "server-only";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/permissions";

export type Stat = { label: string; value: string; hint?: string };

const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const overdueWhere = {
  deadline: { lt: new Date() },
  status: { not: "COMPLETED" as const },
};

export async function getDashboardStats(user: SessionUser): Promise<Stat[]> {
  switch (user.role) {
    case "ADMIN":
    case "PROJECT_MANAGER": {
      // A project manager only sees their own projects
      const projectWhere =
        user.role === "PROJECT_MANAGER" ? { managerId: user.id } : {};
      const [projects, active, tasks, overdue, budget, spent] =
        await Promise.all([
          prisma.project.count({ where: projectWhere }),
          prisma.project.count({
            where: { ...projectWhere, status: "ACTIVE" },
          }),
          prisma.task.count({ where: { project: projectWhere } }),
          prisma.task.count({
            where: { ...overdueWhere, project: projectWhere },
          }),
          prisma.project.aggregate({
            where: projectWhere,
            _sum: { totalBudget: true },
          }),
          prisma.expense.aggregate({
            where: { project: projectWhere },
            _sum: { amount: true },
          }),
        ]);
      const b = Number(budget._sum.totalBudget ?? 0);
      const s = Number(spent._sum.amount ?? 0);
      return [
        { label: "Total Projects", value: String(projects) },
        { label: "Active Projects", value: String(active) },
        { label: "Total Tasks", value: String(tasks) },
        {
          label: "Overdue Tasks",
          value: String(overdue),
          hint: "Deadline passed, not completed",
        },
        { label: "Total Budget", value: money(b) },
        {
          label: "Total Expenses",
          value: money(s),
          hint: b ? `${Math.round((s / b) * 100)}% of budget used` : undefined,
        },
      ];
    }

    case "FINANCE_MANAGER": {
      const [budget, spent, expenseCount, overrun] = await Promise.all([
        prisma.project.aggregate({ _sum: { totalBudget: true } }),
        prisma.expense.aggregate({ _sum: { amount: true } }),
        prisma.expense.count(),
        prisma.expense.groupBy({ by: ["projectId"], _sum: { amount: true } }),
      ]);
      const b = Number(budget._sum.totalBudget ?? 0);
      const s = Number(spent._sum.amount ?? 0);

      const projects = await prisma.project.findMany({
        select: { id: true, totalBudget: true },
      });
      const spentMap = new Map(
        overrun.map((r) => [r.projectId, Number(r._sum.amount ?? 0)]),
      );
      const overBudget = projects.filter(
        (p) => (spentMap.get(p.id) ?? 0) > Number(p.totalBudget),
      ).length;

      return [
        { label: "Total Budget", value: money(b) },
        { label: "Total Expenses", value: money(s) },
        { label: "Remaining Budget", value: money(b - s) },
        {
          label: "Budget Utilization",
          value: b ? `${Math.round((s / b) * 100)}%` : "0%",
        },
        { label: "Expense Records", value: String(expenseCount) },
        { label: "Projects Over Budget", value: String(overBudget) },
      ];
    }

    case "SITE_ENGINEER": {
      const [total, inProgress, overdue, reports] = await Promise.all([
        prisma.task.count({ where: { assigneeId: user.id } }),
        prisma.task.count({
          where: { assigneeId: user.id, status: "IN_PROGRESS" },
        }),
        prisma.task.count({ where: { ...overdueWhere, assigneeId: user.id } }),
        prisma.progressReport.count({ where: { reportedById: user.id } }),
      ]);
      return [
        { label: "My Tasks", value: String(total) },
        { label: "In Progress", value: String(inProgress) },
        { label: "Overdue", value: String(overdue) },
        { label: "Reports Submitted", value: String(reports) },
      ];
    }

    case "CONTRACTOR": {
      const contractor = await prisma.contractor.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!contractor) return [{ label: "Assigned Projects", value: "0" }];

      const [projects, tasks, overdue, pending] = await Promise.all([
        prisma.projectContractor.count({
          where: { contractorId: contractor.id },
        }),
        prisma.task.count({ where: { contractorId: contractor.id } }),
        prisma.task.count({
          where: { ...overdueWhere, contractorId: contractor.id },
        }),
        prisma.materialRequest.count({
          where: { contractorId: contractor.id, status: "PENDING" },
        }),
      ]);
      return [
        { label: "Assigned Projects", value: String(projects) },
        { label: "Assigned Tasks", value: String(tasks) },
        { label: "Overdue Tasks", value: String(overdue) },
        { label: "Pending Material Requests", value: String(pending) },
      ];
    }
  }
}
