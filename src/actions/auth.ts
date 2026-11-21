"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { ROLE_DASHBOARD_MAP } from "@/lib/permissions";
import { APIError } from "better-auth/api";

export type AuthActionState = {
  error?: string;
  redirectTo?: string;
};

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  try {
    const response = await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });

    const userRole = (response.user.role as Role) || Role.SITE_ENGINEER;
    const redirectTo = ROLE_DASHBOARD_MAP[userRole] || "/dashboard/engineer";

    return { redirectTo };
  } catch (err) {
    if (err instanceof APIError) {
      return { error: err.message || "Invalid email or password." };
    }
    return { error: "An unexpected error occurred during sign in." };
  }
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = (formData.get("role") as Role) || Role.SITE_ENGINEER;

  if (!name || !email || !password) {
    return { error: "All fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  // Prevent unauthorized self-registration as ADMIN if desired (optional guard)
  if (!Object.values(Role).includes(role)) {
    return { error: "Invalid role selected." };
  }

  try {
    const response = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        role,
      },
      headers: await headers(),
    });

    const assignedRole = (response.user.role as Role) || role;
    const redirectTo = ROLE_DASHBOARD_MAP[assignedRole];

    return { redirectTo };
  } catch (err) {
    if (err instanceof APIError) {
      return { error: err.message || "Failed to create account." };
    }
    return { error: "An unexpected error occurred during registration." };
  }
}

export async function logoutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect("/login");
}
 