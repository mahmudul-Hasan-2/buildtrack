"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma, StockType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { projectScope } from "@/lib/project-access";
import { materialSchema, quantitySchema } from "@/lib/validations/material";

export type MaterialState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};
export type Result = { ok: boolean; error?: string };

class StockError extends Error {}

// Decrease stock safely: the WHERE guard makes overdrawing impossible,
// even when two requests arrive at the same time.
async function issueStock(
  tx: Prisma.TransactionClient,
  a: {
    materialId: string;
    projectId: string;
    quantity: number;
    type: StockType;
    userId: string;
    note?: string | null;
  },
) {
  const res = await tx.material.updateMany({
    where: { id: a.materialId, availableQuantity: { gte: a.quantity } },
    data: { availableQuantity: { decrement: a.quantity } },
  });
  if (res.count === 0) throw new StockError("Not enough stock available");

  const m = await tx.material.findUniqueOrThrow({
    where: { id: a.materialId },
  });
  await tx.stockHistory.create({
    data: {
      materialId: a.materialId,
      projectId: a.projectId,
      type: a.type,
      quantity: a.quantity,
      balanceAfter: m.availableQuantity,
      note: a.note ?? null,
      userId: a.userId,
    },
  });
  return m;
}

async function notifyIfLow(m: {
  name: string;
  availableQuantity: number;
  lowStockThreshold: number;
}) {
  if (m.availableQuantity > m.lowStockThreshold) return;
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN"] }, isActive: true },
    select: { id: true },
  });
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      title: "Low stock",
      message: `${m.name} is low (${m.availableQuantity} left).`,
      link: "/materials",
    })),
  });
}

export async function createMaterial(
  _prev: MaterialState,
  formData: FormData,
): Promise<MaterialState> {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER");
  const parsed = materialSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  if (await prisma.material.findUnique({ where: { sku: d.sku } })) {
    return { fieldErrors: { sku: ["SKU already exists"] } };
  }
  if (
    !(await prisma.materialCategory.findUnique({ where: { id: d.categoryId } }))
  ) {
    return { error: "Category not found" };
  }

  const m = await prisma.$transaction(async (tx) => {
    const created = await tx.material.create({ data: d });
    await tx.stockHistory.create({
      data: {
        materialId: created.id,
        type: "STOCK_IN",
        quantity: d.availableQuantity,
        balanceAfter: d.availableQuantity,
        note: "Initial stock",
        userId: user.id,
      },
    });
    return created;
  });

  revalidatePath("/materials");
  redirect(`/materials/${m.id}`);
}

export async function stockIn(
  materialId: string,
  formData: FormData,
): Promise<Result> {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER");
  const q = quantitySchema.safeParse(formData.get("quantity"));
  if (!q.success) return { ok: false, error: q.error.issues[0].message };

  try {
    await prisma.$transaction(async (tx) => {
      const m = await tx.material.update({
        where: { id: materialId },
        data: { availableQuantity: { increment: q.data } },
      });
      await tx.stockHistory.create({
        data: {
          materialId,
          type: "STOCK_IN",
          quantity: q.data,
          balanceAfter: m.availableQuantity,
          note: String(formData.get("note") ?? "") || "Stock added",
          userId: user.id,
        },
      });
    });
  } catch {
    return { ok: false, error: "Material not found" };
  }
  revalidatePath(`/materials/${materialId}`);
  revalidatePath("/materials");
  return { ok: true };
}

export async function recordUsage(
  materialId: string,
  formData: FormData,
): Promise<Result> {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER");
  const q = quantitySchema.safeParse(formData.get("quantity"));
  if (!q.success) return { ok: false, error: q.error.issues[0].message };
  const projectId = String(formData.get("projectId") ?? "");

  // The user may only record usage for projects they can access
  const project = await prisma.project.findFirst({
    where: { AND: [{ id: projectId }, await projectScope(user)] },
    select: { id: true },
  });
  if (!project) return { ok: false, error: "Project not found or not allowed" };

  try {
    const m = await prisma.$transaction((tx) =>
      issueStock(tx, {
        materialId,
        projectId,
        quantity: q.data,
        type: "CONSUMED",
        userId: user.id,
        note: String(formData.get("note") ?? "") || "Material used",
      }),
    );
    await notifyIfLow(m);
  } catch (e) {
    if (e instanceof StockError) return { ok: false, error: e.message };
    return { ok: false, error: "Could not record usage" };
  }
  revalidatePath(`/materials/${materialId}`);
  revalidatePath("/materials");
  return { ok: true };
}

export async function requestMaterial(
  materialId: string,
  formData: FormData,
): Promise<Result> {
  const user = await requireRole("CONTRACTOR");
  const q = quantitySchema.safeParse(formData.get("quantity"));
  if (!q.success) return { ok: false, error: q.error.issues[0].message };
  const projectId = String(formData.get("projectId") ?? "");

  const contractor = await prisma.contractor.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!contractor) return { ok: false, error: "No contractor profile" };

  const assigned = await prisma.projectContractor.findUnique({
    where: {
      projectId_contractorId: { projectId, contractorId: contractor.id },
    },
  });
  if (!assigned)
    return { ok: false, error: "You are not assigned to this project" };

  await prisma.materialRequest.create({
    data: {
      materialId,
      projectId,
      contractorId: contractor.id,
      requestedById: user.id,
      quantity: q.data,
      note: String(formData.get("note") ?? "") || null,
    },
  });
  revalidatePath("/materials/requests");
  return { ok: true };
}

export async function reviewRequest(
  requestId: string,
  decision: "approve" | "reject",
): Promise<Result> {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER");

  const req = await prisma.materialRequest.findFirst({
    where: {
      id: requestId,
      status: "PENDING",
      ...(user.role === "PROJECT_MANAGER"
        ? { project: { managerId: user.id } }
        : {}),
    },
  });
  if (!req)
    return {
      ok: false,
      error: "Request not found, not allowed, or already reviewed",
    };

  if (decision === "reject") {
    await prisma.materialRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });
  } else {
    try {
      const m = await prisma.$transaction(async (tx) => {
        // Claim the request first so it can only be fulfilled once
        const claimed = await tx.materialRequest.updateMany({
          where: { id: requestId, status: "PENDING" },
          data: { status: "FULFILLED" },
        });
        if (claimed.count === 0)
          throw new StockError("Request was already reviewed");
        return issueStock(tx, {
          materialId: req.materialId,
          projectId: req.projectId,
          quantity: req.quantity,
          type: "ISSUED",
          userId: user.id,
          note: "Issued for approved request",
        });
      });
      await notifyIfLow(m);
    } catch (e) {
      if (e instanceof StockError) return { ok: false, error: e.message };
      return { ok: false, error: "Could not approve the request" };
    }
  }

  revalidatePath("/materials/requests");
  revalidatePath("/materials");
  return { ok: true };
}
