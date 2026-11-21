"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import {
  contractorSchema,
  newContractorSchema,
} from "@/lib/validations/contractor";

export type ContractorState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createContractor(
  _prev: ContractorState,
  formData: FormData,
): Promise<ContractorState> {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER");
  const parsed = newContractorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };

  const email = parsed.data.email.toLowerCase();
  const [c, u] = await Promise.all([
    prisma.contractor.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { email } }),
  ]);
  if (c || u) return { fieldErrors: { email: ["This email is already used"] } };

  const created = await prisma.contractor.create({
    data: { ...parsed.data, email, address: parsed.data.address || null },
  });
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "CREATE",
      entity: "Contractor",
      entityId: created.id,
    },
  });

  revalidatePath("/contractors");
  redirect(`/contractors/${created.id}`);
}

export async function updateContractor(
  id: string,
  _prev: ContractorState,
  formData: FormData,
): Promise<ContractorState> {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER");
  const parsed = contractorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };

  const existing = await prisma.contractor.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return { error: "Contractor not found" };

  await prisma.contractor.update({
    where: { id },
    data: { ...parsed.data, address: parsed.data.address || null },
  });
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "UPDATE",
      entity: "Contractor",
      entityId: id,
    },
  });

  revalidatePath("/contractors");
  revalidatePath(`/contractors/${id}`);
  redirect(`/contractors/${id}`);
}
