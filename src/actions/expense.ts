"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { expenseSchema } from "@/lib/validations/expense";

export type ExpenseState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createExpense(
  _prev: ExpenseState,
  formData: FormData,
): Promise<ExpenseState> {
  const user = await requireRole("ADMIN", "FINANCE_MANAGER");
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { projectId, categoryId, description, ...rest } = parsed.data;

  // An expense must belong to a valid project and category
  const [project, category] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, totalBudget: true, managerId: true },
    }),
    prisma.expenseCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    }),
  ]);
  if (!project) return { error: "Project not found" };
  if (!category) return { error: "Category not found" };

  const expense = await prisma.expense.create({
    data: {
      ...rest,
      projectId,
      categoryId,
      description: description || null,
      recordedById: user.id,
    },
  });
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "CREATE",
      entity: "Expense",
      entityId: expense.id,
    },
  });

  // Budget overrun alert (calculated on the server)
  const spent = await prisma.expense.aggregate({
    where: { projectId },
    _sum: { amount: true },
  });
  if (Number(spent._sum.amount ?? 0) > Number(project.totalBudget)) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    });
    const targets = new Set([project.managerId, ...admins.map((a) => a.id)]);
    await prisma.notification.createMany({
      data: [...targets].map((userId) => ({
        userId,
        title: "Budget overrun",
        message: `${project.name} has exceeded its budget.`,
        link: "/budget",
      })),
    });
  }

  revalidatePath("/expenses");
  revalidatePath("/budget");
  revalidatePath("/dashboard");
  redirect("/expenses");
}

export async function createExpenseCategory(
  name: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireRole("ADMIN", "FINANCE_MANAGER");
  const clean = name.trim();
  if (clean.length < 2) return { ok: false, error: "Name is too short" };

  const exists = await prisma.expenseCategory.findUnique({
    where: { name: clean },
  });
  if (exists) return { ok: false, error: "Category already exists" };

  await prisma.expenseCategory.create({ data: { name: clean } });
  revalidatePath("/expenses");
  return { ok: true };
}
