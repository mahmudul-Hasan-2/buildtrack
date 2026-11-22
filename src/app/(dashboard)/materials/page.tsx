import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { ListFilters } from "@/components/shared/list-filters";
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
type SP = { q?: string; category?: string; flag?: string; page?: string };

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const user = await requireRole(
    "ADMIN",
    "PROJECT_MANAGER",
    "SITE_ENGINEER",
    "CONTRACTOR",
  );
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  // Prisma cannot compare two columns, so low-stock ids come from a raw query
  let lowIds: string[] | null = null;
  if (sp.flag === "low") {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Material" WHERE "availableQuantity" <= "lowStockThreshold"`;
    lowIds = rows.map((r) => r.id);
  }

  const where: Prisma.MaterialWhereInput = {
    AND: [
      sp.q
        ? {
            OR: [
              { name: { contains: sp.q, mode: "insensitive" } },
              { sku: { contains: sp.q, mode: "insensitive" } },
            ],
          }
        : {},
      sp.category ? { categoryId: sp.category } : {},
      lowIds ? { id: { in: lowIds } } : {},
    ],
  };

  const [materials, total, categories] = await Promise.all([
    prisma.material.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { category: { select: { name: true } } },
    }),
    prisma.material.count({ where }),
    prisma.materialCategory.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isManager = user.role === "ADMIN" || user.role === "PROJECT_MANAGER";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B192C]">Materials</h1>
          <p className="text-sm text-slate-500">{total} material(s)</p>
        </div>
        <div className="flex gap-2">
          {user.role !== "SITE_ENGINEER" && (
            <Button variant="outline">
              <Link href="/materials/requests">Requests</Link>
            </Button>
          )}
          {isManager && (
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Link href="/materials/new">
                <Plus className="mr-2 h-4 w-4" />
                New Material
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Suspense>
        <ListFilters
          placeholder="Search name or SKU..."
          selects={[
            {
              key: "category",
              label: "All categories",
              options: categories.map((c) => ({ value: c.id, label: c.name })),
            },
            {
              key: "flag",
              label: "All stock levels",
              options: [{ value: "low", label: "Low stock only" }],
            },
          ]}
        />
      </Suspense>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="text-right">Unit price</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-slate-500"
                >
                  No materials found.
                </TableCell>
              </TableRow>
            )}
            {materials.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <Link
                    href={`/materials/${m.id}`}
                    className="font-medium text-[#0B192C] hover:underline"
                  >
                    {m.name}
                  </Link>
                </TableCell>
                <TableCell>{m.sku}</TableCell>
                <TableCell>{m.category.name}</TableCell>
                <TableCell className="text-right">
                  {m.availableQuantity} {m.unit}
                </TableCell>
                <TableCell className="text-right">
                  ${Number(m.unitPrice).toLocaleString()}
                </TableCell>
                <TableCell>
                  {m.availableQuantity <= m.lowStockThreshold ? (
                    <Badge variant="destructive">Low stock</Badge>
                  ) : (
                    <Badge variant="secondary">In stock</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/materials"
        params={{ q: sp.q, category: sp.category, flag: sp.flag }}
      />
    </div>
  );
}
