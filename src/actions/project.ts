"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { projectSchema } from "@/lib/validations/project";
import { redirect } from "next/navigation";

export type ProjectActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function parse(formData: FormData) {
  return projectSchema.safeParse(Object.fromEntries(formData));
}

export async function createProject(
  _p: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER");
  const parsed = parse(formData);
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { managerId, ...data } = parsed.data;
  // PM can only create projects for themselves
  const finalManagerId = user.role === "ADMIN" ? managerId || user.id : user.id;

  const manager = await prisma.user.findFirst({
    where: {
      id: finalManagerId,
      role: { in: ["ADMIN", "PROJECT_MANAGER"] },
      isActive: true,
    },
  });
  if (!manager) return { error: "Invalid project manager" };

  const project = await prisma.project.create({
    data: { ...data, managerId: finalManagerId },
  });
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "CREATE",
      entity: "Project",
      entityId: project.id,
    },
  });

  revalidatePath("/projects");
  return redirect(`/projects/${project.id}`);
}

export async function updateProject(
  id: string,
  _p: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER");
  const parsed = parse(formData);
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return { error: "Project not found" };
  if (user.role === "PROJECT_MANAGER" && existing.managerId !== user.id) {
    return { error: "You can only edit your own projects" };
  }

  const { managerId, ...data } = parsed.data;
  await prisma.project.update({
    where: { id },
    data: {
      ...data,
      ...(user.role === "ADMIN" && managerId ? { managerId } : {}),
    },
  });
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "UPDATE",
      entity: "Project",
      entityId: id,
    },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return redirect(`/projects/${id}`);
}

export async function deleteProject(id: string) {
  const user = await requireRole("ADMIN");

  const [expenses, tasks] = await Promise.all([
    prisma.expense.count({ where: { projectId: id } }),
    prisma.task.count({ where: { projectId: id } }),
  ]);
  // Financial records and task history must be preserved
  if (expenses > 0 || tasks > 0) {
    return {
      error:
        "Cannot delete a project that has tasks or expenses. Mark it Cancelled instead.",
    };
  }

  await prisma.project.delete({ where: { id } });
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "DELETE",
      entity: "Project",
      entityId: id,
    },
  });
  revalidatePath("/projects");
  return redirect("/projects");
}
