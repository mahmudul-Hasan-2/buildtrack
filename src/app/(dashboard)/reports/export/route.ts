import { NextResponse } from "next/server";
import { getSession, type SessionUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const ALLOWED = ["ADMIN", "PROJECT_MANAGER", "FINANCE_MANAGER"];

// Quote values and neutralize spreadsheet formulas
const esc = (v: string | number) => {
  let s = String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET() {
  const session = await getSession();
  const user = session?.user as unknown as SessionUser | undefined;
  if (!user || user.isActive === false || !ALLOWED.includes(user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const rows = await prisma.expense.findMany({
    where: {
      project: user.role === "PROJECT_MANAGER" ? { managerId: user.id } : {},
    },
    orderBy: { date: "desc" },
    include: {
      project: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  const csv = [
    "Date,Project,Category,Title,Amount",
    ...rows.map((r) =>
      [
        r.date.toISOString().slice(0, 10),
        r.project.name,
        r.category.name,
        r.title,
        Number(r.amount),
      ]
        .map(esc)
        .join(","),
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="expenses.csv"',
    },
  });
}
