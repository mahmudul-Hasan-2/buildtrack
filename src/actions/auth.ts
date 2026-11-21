"use server";

import { z } from "zod";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AuthActionState } from "@/types/auth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { isActive: true },
  });
  if (existing && !existing.isActive) {
    return { error: "This account has been deactivated" };
  }

  try {
    await auth.api.signInEmail({
      body: { email, password: parsed.data.password },
    });
    return { redirectTo: "/dashboard" };
  } catch (e) {
    if (e instanceof APIError) return { error: "Invalid email or password" };
    return { error: "Something went wrong. Please try again." };
  }
}

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const exists =
    (await prisma.user.findUnique({ where: { email } })) ||
    (await prisma.contractor.findUnique({ where: { email } }));
  if (exists) return { error: "This email is already registered" };

  try {
    // Role is NEVER read from the form. Public sign-up is always CONTRACTOR.
    const res = await auth.api.signUpEmail({ body: { name, email, password } });

    await prisma.contractor.create({
      data: {
        userId: res.user.id,
        companyName: `${name} (Independent)`,
        contactName: name,
        email,
        phone: "-",
      },
    });
    return { redirectTo: "/dashboard" };
  } catch {
    return { error: "Could not create the account. Please try again." };
  }
}
