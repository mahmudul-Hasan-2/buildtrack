import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { ListFilters } from "@/components/shared/list-filters";
import { Pagination } from "@/components/shared/pagination";
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

const PAGE_SIZE = 15;
const ENTITIES = ["Project", "Task", "Expense", "Contractor", "User"];

type SP = { q?: string; entity?: string; page?: string };

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  // Only Admin can see the activity log (enforced on the server)
  await requireRole("ADMIN");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.ActivityLogWhereInput = {
    AND: [
      sp.q ? { action: { contains: sp.q, mode: "insensitive" } } : {},
      sp.entity ? { entity: sp.entity } : {},
    ],
  };

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true } } },
    }),
    prisma.activityLog.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#0B192C]">Activity Log</h1>
        <p className="text-sm text-slate-500">{total} record(s)</p>
      </div>

      <Suspense>
        <ListFilters
          placeholder="Search action..."
          selects={[
            {
              key: "entity",
              label: "All entities",
              options: ENTITIES.map((e) => ({ value: e, label: e })),
            },
          ]}
        />
      </Suspense>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-slate-500"
                >
                  No activity yet.
                </TableCell>
              </TableRow>
            )}
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{l.createdAt.toLocaleString()}</TableCell>
                <TableCell>{l.user?.name ?? "System"}</TableCell>
                <TableCell>{l.action}</TableCell>
                <TableCell>
                  <Badge variant="outline">{l.entity}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/activity"
        params={{ q: sp.q, entity: sp.entity }}
      />
    </div>
  );
}
