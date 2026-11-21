import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default async function NewExpensePage() {
  await requireRole("ADMIN", "FINANCE_MANAGER");
  const [projects, categories] = await Promise.all([
    prisma.project.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.expenseCategory.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#0B192C]">New Expense</h1>
      <ExpenseForm projects={projects} categories={categories} />
    </div>
  );
}
