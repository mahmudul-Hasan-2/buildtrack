"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

export type AssignResult = { ok: boolean; error?: string };

async function loadProject(projectId: string, userId: string, role: string) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      ...(role === "PROJECT_MANAGER" ? { managerId: userId } : {}),
    },
    select: { id: true },
  });
}

export async function assignContractor(
  projectId: string,
  contractorId: string,
): Promise<AssignResult> {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER");
  if (!contractorId) return { ok: false, error: "Select a contractor" };

  const project = await loadProject(projectId, user.id, user.role);
  if (!project) return { ok: false, error: "Project not found or not allowed" };

  const contractor = await prisma.contractor.findFirst({
    where: { id: contractorId, status: "ACTIVE" },
    select: { id: true, companyName: true },
  });
  if (!contractor)
    return { ok: false, error: "Contractor not found or not active" };

  const already = await prisma.projectContractor.findUnique({
    where: { projectId_contractorId: { projectId, contractorId } },
  });
  if (already) return { ok: false, error: "Already assigned to this project" };

  await prisma.projectContractor.create({ data: { projectId, contractorId } });
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: `ASSIGN_CONTRACTOR: ${contractor.companyName}`,
      entity: "Project",
      entityId: projectId,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function removeContractor(
  projectId: string,
  contractorId: string,
): Promise<AssignResult> {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER");

  const project = await loadProject(projectId, user.id, user.role);
  if (!project) return { ok: false, error: "Project not found or not allowed" };

  // Task history must be preserved
  const tasks = await prisma.task.count({ where: { projectId, contractorId } });
  if (tasks > 0) {
    return {
      ok: false,
      error: `Cannot remove: ${tasks} task(s) are assigned to this contractor in this project`,
    };
  }

  await prisma.projectContractor.deleteMany({
    where: { projectId, contractorId },
  });
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "REMOVE_CONTRACTOR",
      entity: "Project",
      entityId: projectId,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
