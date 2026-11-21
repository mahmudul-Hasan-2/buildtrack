import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "./auth";

export const ROLE_DASHBOARD_MAP: Record<Role, string> = {
  ADMIN: "/dashboard/admin",
  PROJECT_MANAGER: "/dashboard/pm",
  SITE_ENGINEER: "/dashboard/engineer",
  FINANCE_MANAGER: "/dashboard/finance",
  CONTRACTOR: "/dashboard/contractor",
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "System Administrator",
  PROJECT_MANAGER: "Project Manager",
  SITE_ENGINEER: "Site Engineer",
  FINANCE_MANAGER: "Finance Manager",
  CONTRACTOR: "Subcontractor / Vendor",
};

/**
 * Fetches the currently authenticated user in Server Components or Server Actions.
 * Returns null if unauthenticated.
 */
export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  return {
    ...session.user,
    role: (session.user.role as Role) || Role.SITE_ENGINEER,
  };
}

/**
 * Enforces authentication and optional role checks inside Server Components/Actions.
 */
export async function requireRole(allowedRoles?: Role[]) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect(ROLE_DASHBOARD_MAP[user.role]);
  }

  return user;
}

/**
 * Granular feature-level permission helpers
 */
export const permissions = {
  canManageUsers: (role: Role) => role === Role.ADMIN,

  canCreateProject: (role: Role) =>
    role === Role.ADMIN || role === Role.PROJECT_MANAGER,

  canApproveBudgets: (role: Role) =>
    role === Role.ADMIN || role === Role.FINANCE_MANAGER,

  canSubmitDailyLogs: (role: Role) =>
    role === Role.ADMIN ||
    role === Role.PROJECT_MANAGER ||
    role === Role.SITE_ENGINEER,

  canViewInvoices: (role: Role) =>
    role === Role.ADMIN ||
    role === Role.FINANCE_MANAGER ||
    role === Role.CONTRACTOR,
};
