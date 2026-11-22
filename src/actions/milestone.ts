"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, type SessionUser } from "@/lib/permissions";

export type Result = { ok: boolean; error?: string };

// Admin: any project. PM: only own projects.
const projectWhere = (user: SessionUser, projectId: string) => ({
  id: projectId,
  ...(user.role === "PROJECT_MANAGER" ? { managerId: user.id } : {}),
});

export async function createMilestone(
  projectId: string,
  title: string,
  dueDate: string,
): Promise<Result> {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER");
  const parsed = z
    .object({
      title: z.string().trim().min(3, "Title is too short"),
      dueDate: z.coerce.date(),
    })
    .safeParse({ title, dueDate });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const project = await prisma.project.findFirst({
    where: projectWhere(user, projectId),
    select: { id: true },
  });
  if (!project) return { ok: false, error: "Project not found or not allowed" };

  await prisma.milestone.create({ data: { projectId, ...parsed.data } });
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: `ADD_MILESTONE: ${parsed.data.title}`,
      entity: "Project",
      entityId: projectId,
    },
  });
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function toggleMilestone(id: string): Promise<Result> {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER");
  const m = await prisma.milestone.findFirst({
    where: {
      id,
      project: user.role === "PROJECT_MANAGER" ? { managerId: user.id } : {},
    },
  });
  if (!m) return { ok: false, error: "Milestone not found or not allowed" };

  await prisma.milestone.update({
    where: { id },
    data: {
      completed: !m.completed,
      completedAt: m.completed ? null : new Date(),
    },
  });
  revalidatePath(`/projects/${m.projectId}`);
  return { ok: true };
}

export async function deleteMilestone(id: string): Promise<Result> {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER");
  const m = await prisma.milestone.findFirst({
    where: {
      id,
      project: user.role === "PROJECT_MANAGER" ? { managerId: user.id } : {},
    },
  });
  if (!m) return { ok: false, error: "Milestone not found or not allowed" };
  // A completed milestone is project history and is kept
  if (m.completed)
    return { ok: false, error: "Completed milestones cannot be deleted" };

  await prisma.milestone.delete({ where: { id } });
  revalidatePath(`/projects/${m.projectId}`);
  return { ok: true };
}
