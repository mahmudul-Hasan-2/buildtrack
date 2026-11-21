import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { projectScope } from "@/lib/project-access";
import {
  StockInForm,
  UsageForm,
  RequestForm,
} from "@/components/materials/stock-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(
    "ADMIN",
    "PROJECT_MANAGER",
    "SITE_ENGINEER",
    "CONTRACTOR",
  );
  const { id } = await params;

  const m = await prisma.material.findUnique({
    where: { id },
    include: {
      category: { select: { name: true } },
      history: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!m) notFound();

  // Only the projects this user may access appear in the dropdowns
  const projects = await prisma.project.findMany({
    where: await projectScope(user),
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const isManager = user.role === "ADMIN" || user.role === "PROJECT_MANAGER";
  const low = m.availableQuantity <= m.lowStockThreshold;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B192C]">{m.name}</h1>
          <p className="text-sm text-slate-500">
            {m.sku} · {m.category.name}
          </p>
        </div>
        {low ? (
          <Badge variant="destructive">Low stock</Badge>
        ) : (
          <Badge variant="secondary">In stock</Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {m.availableQuantity} {m.unit}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">
              Low-stock threshold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{m.lowStockThreshold}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Unit price</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${Number(m.unitPrice).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isManager && (
          <Card>
            <CardHeader>
              <CardTitle>Add stock</CardTitle>
            </CardHeader>
            <CardContent>
              <StockInForm materialId={id} />
            </CardContent>
          </Card>
        )}
        {user.role !== "CONTRACTOR" && (
          <Card>
            <CardHeader>
              <CardTitle>Record usage</CardTitle>
            </CardHeader>
            <CardContent>
              <UsageForm materialId={id} projects={projects} />
            </CardContent>
          </Card>
        )}
        {user.role === "CONTRACTOR" && (
          <Card>
            <CardHeader>
              <CardTitle>Request this material</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestForm materialId={id} projects={projects} />
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {m.history.map((h) => (
            <p key={h.id}>
              <span className="text-slate-400">
                {h.createdAt.toLocaleString()}
              </span>{" "}
              · {h.user.name}: <b>{h.type}</b> {h.quantity} → balance{" "}
              {h.balanceAfter}
              {h.note && <span className="text-slate-500"> ({h.note})</span>}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
