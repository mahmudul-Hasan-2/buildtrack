"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { taskScope, getBlockedTaskIds } from "@/lib/task-access";
import { statusSchema, commentSchema } from "@/lib/validations/task";

export type TaskResult = { ok: boolean; error?: string };

const ORDER = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"] as const;

export async function changeTaskStatus(
  taskId: string,
  next: string,
): Promise<TaskResult> {
  const user = await requireRole(
    "ADMIN",
    "PROJECT_MANAGER",
    "SITE_ENGINEER",
    "CONTRACTOR",
  );

  const parsed = statusSchema.safeParse(next);
  if (!parsed.success) return { ok: false, error: "Invalid status" };
  const status = parsed.data;

  // Scope check: the task must be one this user is allowed to touch
  const task = await prisma.task.findFirst({
    where: { AND: [{ id: taskId }, await taskScope(user)] },
  });
  if (!task) return { ok: false, error: "Task not found or not allowed" };
  if (task.status === status) return { ok: true };

  // Only Admin / PM can approve completion
  const canApprove = user.role === "ADMIN" || user.role === "PROJECT_MANAGER";
  if (status === "COMPLETED" && !canApprove) {
    return { ok: false, error: "Only a manager can mark a task as completed" };
  }
  // A completed task is only reopened by a manager
  if (task.status === "COMPLETED" && !canApprove) {
    return {
      ok: false,
      error: "Completed tasks can only be reopened by a manager",
    };
  }

  // Dependency rule: blocked tasks cannot move past TODO / IN_PROGRESS
  if (ORDER.indexOf(status) > 1) {
    const blocked = await getBlockedTaskIds([taskId]);
    if (blocked.has(taskId)) {
      return {
        ok: false,
        error: "Blocked: complete the tasks it depends on first",
      };
    }
  }

  await prisma.$transaction([
    prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        progress:
          status === "COMPLETED" ? 100 : status === "TODO" ? 0 : task.progress,
      },
    }),
    prisma.taskHistory.create({
      data: {
        taskId,
        userId: user.id,
        action: "Status changed",
        fromStatus: task.status,
        toStatus: status,
      },
    }),
  ]);

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  return { ok: true };
}

export async function addComment(
  taskId: string,
  content: string,
): Promise<TaskResult> {
  const user = await requireRole(
    "ADMIN",
    "PROJECT_MANAGER",
    "SITE_ENGINEER",
    "CONTRACTOR",
  );

  const parsed = commentSchema.safeParse(content);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const task = await prisma.task.findFirst({
    where: { AND: [{ id: taskId }, await taskScope(user)] },
    select: { id: true },
  });
  if (!task) return { ok: false, error: "Task not found or not allowed" };

  await prisma.taskComment.create({
    data: { taskId, userId: user.id, content: parsed.data },
  });
  revalidatePath(`/tasks/${taskId}`);
  return { ok: true };
}

export async function addDependency(
  taskId: string,
  dependsOnTaskId: string,
): Promise<TaskResult> {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER");

  if (taskId === dependsOnTaskId)
    return { ok: false, error: "A task cannot depend on itself" };

  const [task, dep] = await Promise.all([
    prisma.task.findFirst({
      where: { AND: [{ id: taskId }, await taskScope(user)] },
    }),
    prisma.task.findUnique({ where: { id: dependsOnTaskId } }),
  ]);
  if (!task || !dep)
    return { ok: false, error: "Task not found or not allowed" };
  if (task.projectId !== dep.projectId) {
    return { ok: false, error: "Dependencies must be within the same project" };
  }

  // Circular dependency check: walk the chain from dep; if we reach taskId, it is a cycle
  const seen = new Set<string>();
  const stack = [dependsOnTaskId];
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === taskId)
      return { ok: false, error: "This would create a circular dependency" };
    if (seen.has(cur)) continue;
    seen.add(cur);
    const next = await prisma.taskDependency.findMany({
      where: { taskId: cur },
      select: { dependsOnTaskId: true },
    });
    next.forEach((n) => stack.push(n.dependsOnTaskId));
  }

  await prisma.taskDependency.upsert({
    where: { taskId_dependsOnTaskId: { taskId, dependsOnTaskId } },
    create: { taskId, dependsOnTaskId },
    update: {},
  });
  await prisma.taskHistory.create({
    data: { taskId, userId: user.id, action: `Dependency added: ${dep.title}` },
  });
  revalidatePath(`/tasks/${taskId}`);
  return { ok: true };
}
