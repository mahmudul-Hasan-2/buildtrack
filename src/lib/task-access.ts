import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/permissions";

// Which tasks a user may SEE
export async function taskScope(
  user: SessionUser,
): Promise<Prisma.TaskWhereInput> {
  switch (user.role) {
    case "ADMIN":
      return {};
    case "PROJECT_MANAGER":
      return { project: { managerId: user.id } };
    case "SITE_ENGINEER":
      return { assigneeId: user.id };
    case "CONTRACTOR": {
      const c = await prisma.contractor.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      return { contractorId: c?.id ?? "none" };
    }
    default:
      return { id: "none" };
  }
}

// Tasks that are blocked: at least one dependency is not COMPLETED
export async function getBlockedTaskIds(
  taskIds: string[],
): Promise<Set<string>> {
  if (taskIds.length === 0) return new Set();
  const deps = await prisma.taskDependency.findMany({
    where: {
      taskId: { in: taskIds },
      dependsOnTask: { status: { not: "COMPLETED" } },
    },
    select: { taskId: true },
  });
  return new Set(deps.map((d) => d.taskId));
}

export const isOverdue = (t: { deadline: Date; status: string }) =>
  t.status !== "COMPLETED" && t.deadline < new Date();
