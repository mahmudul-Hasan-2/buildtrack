import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
};

// cache(): one DB lookup per request, even if called from layout + page + topbar
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const user = session.user as unknown as SessionUser;
  if (user.isActive === false) redirect("/login");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}
