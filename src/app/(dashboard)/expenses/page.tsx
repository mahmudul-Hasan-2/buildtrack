import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { ListFilters } from "@/components/shared/list-filters";
import { CategoryForm } from "@/components/expenses/category-form";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
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

const PAGE_SIZE = 10;
type SP = {
  q?: string;
  project?: string;
  category?: string;
  from?: string;
  to?: string;
  page?: string;
};

const toDate = (s?: string) => {
  const d = s ? new Date(s) : null;
  return d && !isNaN(d.getTime()) ? d : null;
};

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  await requireRole("ADMIN", "FINANCE_MANAGER");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const from = toDate(sp.from);
  const to = toDate(sp.to);

  const where: Prisma.ExpenseWhereInput = {
    AND: [
      sp.q ? { title: { contains: sp.q, mode: "insensitive" } } : {},
      sp.project ? { projectId: sp.project } : {},
      sp.category ? { categoryId: sp.category } : {},
      from || to
        ? {
            date: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {},
    ],
  };

  const [expenses, total, sum, projects, categories] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        project: { select: { name: true } },
        category: { select: { name: true } },
        recordedBy: { select: { name: true } },
      },
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
    prisma.project.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.expenseCategory.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B192C]">Expenses</h1>
          <p className="text-sm text-slate-500">
            {total} record(s) · Total $
            {Number(sum._sum.amount ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CategoryForm />
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Link href="/expenses/new">
              <Plus className="mr-2 h-4 w-4" />
              New Expense
            </Link>
          </Button>
        </div>
      </div>

      <Suspense>
        <ListFilters
          placeholder="Search expenses..."
          dates
          selects={[
            {
              key: "project",
              label: "All projects",
              options: projects.map((p) => ({ value: p.id, label: p.name })),
            },
            {
              key: "category",
              label: "All categories",
              options: categories.map((c) => ({ value: c.id, label: c.name })),
            },
          ]}
        />
      </Suspense>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Recorded by</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-slate-500"
                >
                  No expenses found.
                </TableCell>
              </TableRow>
            )}
            {expenses.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium text-[#0B192C]">
                  {e.title}
                </TableCell>
                <TableCell>{e.project.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{e.category.name}</Badge>
                </TableCell>
                <TableCell>{e.date.toLocaleDateString()}</TableCell>
                <TableCell>{e.recordedBy.name}</TableCell>
                <TableCell className="text-right">
                  ${Number(e.amount).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/expenses"
        params={{
          q: sp.q,
          project: sp.project,
          category: sp.category,
          from: sp.from,
          to: sp.to,
        }}
      />
    </div>
  );
}
