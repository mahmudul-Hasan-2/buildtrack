import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/permissions";

export async function projectScope(
  user: SessionUser,
): Promise<Prisma.ProjectWhereInput> {
  switch (user.role) {
    case "ADMIN":
      return {};
    case "PROJECT_MANAGER":
      return { managerId: user.id };
    case "SITE_ENGINEER":
      return { tasks: { some: { assigneeId: user.id } } };
    case "CONTRACTOR": {
      const c = await prisma.contractor.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      return { contractors: { some: { contractorId: c?.id ?? "none" } } };
    }
    default:
      return { id: "none" };
  }
}
