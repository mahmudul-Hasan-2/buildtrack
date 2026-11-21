import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { ReviewButtons } from "@/components/materials/review-buttons";
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

export default async function MaterialRequestsPage() {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER", "CONTRACTOR");

  let where: Prisma.MaterialRequestWhereInput = {};
  if (user.role === "PROJECT_MANAGER")
    where = { project: { managerId: user.id } };
  if (user.role === "CONTRACTOR") {
    const c = await prisma.contractor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    where = { contractorId: c?.id ?? "none" };
  }

  const requests = await prisma.materialRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      material: { select: { name: true, unit: true } },
      project: { select: { name: true } },
      contractor: { select: { companyName: true } },
    },
  });
  const canReview = user.role === "ADMIN" || user.role === "PROJECT_MANAGER";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#0B192C]">Material Requests</h1>
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Contractor</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Status</TableHead>
              {canReview && <TableHead>Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-slate-500"
                >
                  No requests.
                </TableCell>
              </TableRow>
            )}
            {requests.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.material.name}</TableCell>
                <TableCell>{r.project.name}</TableCell>
                <TableCell>{r.contractor?.companyName ?? "-"}</TableCell>
                <TableCell className="text-right">
                  {r.quantity} {r.material.unit}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{r.status}</Badge>
                </TableCell>
                {canReview && (
                  <TableCell>
                    {r.status === "PENDING" ? (
                      <ReviewButtons id={r.id} />
                    ) : null}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
