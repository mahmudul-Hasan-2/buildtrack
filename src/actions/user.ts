"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

export type UserState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};
export type Result = { ok: boolean; error?: string };

const ROLES = [
  "ADMIN",
  "PROJECT_MANAGER",
  "SITE_ENGINEER",
  "FINANCE_MANAGER",
  "CONTRACTOR",
] as const;

const createSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  role: z.enum(ROLES),
});

export async function createUser(
  _prev: UserState,
  formData: FormData,
): Promise<UserState> {
  const admin = await requireRole("ADMIN");
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { name, password, role } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const [u, c] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.contractor.findUnique({ where: { email } }),
  ]);
  if (u || c) return { fieldErrors: { email: ["This email is already used"] } };

  const passwordHash = await hashPassword(password);
  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, role, emailVerified: true },
    });
    await tx.account.create({
      data: {
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: passwordHash,
      },
    });
    if (role === "CONTRACTOR") {
      await tx.contractor.create({
        data: {
          userId: user.id,
          companyName: `${name} (Independent)`,
          contactName: name,
          email,
          phone: "-",
        },
      });
    }
    return user;
  });

  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      action: `CREATE_USER (${role})`,
      entity: "User",
      entityId: created.id,
    },
  });
  revalidatePath("/users");
  redirect("/users");
}

export async function changeUserRole(
  userId: string,
  role: string,
): Promise<Result> {
  const admin = await requireRole("ADMIN");
  const parsed = z.enum(ROLES).safeParse(role);
  if (!parsed.success) return { ok: false, error: "Invalid role" };
  if (userId === admin.id)
    return { ok: false, error: "You cannot change your own role" };

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!target) return { ok: false, error: "User not found" };
  // A contractor user owns a contractor profile, so its role is locked
  if (target.role === "CONTRACTOR" || parsed.data === "CONTRACTOR") {
    return { ok: false, error: "Contractor accounts cannot be converted" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: parsed.data },
  });
  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      action: `CHANGE_ROLE -> ${parsed.data}`,
      entity: "User",
      entityId: userId,
    },
  });
  revalidatePath("/users");
  return { ok: true };
}

export async function setUserActive(
  userId: string,
  active: boolean,
): Promise<Result> {
  const admin = await requireRole("ADMIN");
  if (userId === admin.id)
    return { ok: false, error: "You cannot deactivate yourself" };

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!target) return { ok: false, error: "User not found" };

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: active },
  });
  // Deactivated users are signed out everywhere
  if (!active) await prisma.session.deleteMany({ where: { userId } });

  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      action: active ? "ACTIVATE_USER" : "DEACTIVATE_USER",
      entity: "User",
      entityId: userId,
    },
  });
  revalidatePath("/users");
  return { ok: true };
}
