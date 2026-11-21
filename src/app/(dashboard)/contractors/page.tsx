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
type SP = { q?: string; status?: string; page?: string };

export default async function ContractorsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  await requireRole("ADMIN", "PROJECT_MANAGER");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.ContractorWhereInput = {
    AND: [
      sp.q
        ? {
            OR: [
              { companyName: { contains: sp.q, mode: "insensitive" } },
              { contactName: { contains: sp.q, mode: "insensitive" } },
              { email: { contains: sp.q, mode: "insensitive" } },
            ],
          }
        : {},
      sp.status
        ? { status: sp.status as Prisma.ContractorWhereInput["status"] }
        : {},
    ],
  };

  const [rows, total] = await Promise.all([
    prisma.contractor.findMany({
      where,
      orderBy: { companyName: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { projects: true, tasks: true } } },
    }),
    prisma.contractor.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B192C]">Contractors</h1>
          <p className="text-sm text-slate-500">{total} contractor(s)</p>
        </div>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link href="/contractors/new">
            <Plus className="mr-2 h-4 w-4" />
            New Contractor
          </Link>
        </Button>
      </div>

      <Suspense>
        <ListFilters
          placeholder="Search company, contact or email..."
          selects={[
            {
              key: "status",
              label: "All statuses",
              options: ["ACTIVE", "INACTIVE", "SUSPENDED"].map((s) => ({
                value: s,
                label: s,
              })),
            },
          ]}
        />
      </Suspense>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Rating</TableHead>
              <TableHead className="text-right">Projects</TableHead>
              <TableHead className="text-right">Tasks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-slate-500"
                >
                  No contractors found.
                </TableCell>
              </TableRow>
            )}
            {rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link
                    href={`/contractors/${c.id}`}
                    className="font-medium text-[#0B192C] hover:underline"
                  >
                    {c.companyName}
                  </Link>
                </TableCell>
                <TableCell>{c.contactName}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      c.status === "ACTIVE" ? "secondary" : "destructive"
                    }
                  >
                    {c.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {c.rating.toFixed(1)}
                </TableCell>
                <TableCell className="text-right">
                  {c._count.projects}
                </TableCell>
                <TableCell className="text-right">{c._count.tasks}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/contractors"
        params={{ q: sp.q, status: sp.status }}
      />
    </div>
  );
}
