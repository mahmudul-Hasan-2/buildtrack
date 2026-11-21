"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { taskScope } from "@/lib/task-access";
import { uploadImages } from "@/lib/storage";

export type ProgressState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[] | undefined>;
};

const schema = z.object({
  taskId: z.string().min(1, "Task is required"),
  progress: z.coerce.number().int().min(0, "Min 0").max(100, "Max 100"),
  description: z
    .string()
    .trim()
    .min(10, "Describe the work (at least 10 characters)"),
});

export async function submitProgress(
  _prev: ProgressState,
  formData: FormData,
): Promise<ProgressState> {
  const user = await requireRole("SITE_ENGINEER", "CONTRACTOR");

  const parsed = schema.safeParse({
    taskId: formData.get("taskId"),
    progress: formData.get("progress"),
    description: formData.get("description"),
  });
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  const { taskId, progress, description } = parsed.data;

  // The task must be inside this user's scope
  const task = await prisma.task.findFirst({
    where: { AND: [{ id: taskId }, await taskScope(user)] },
    select: {
      id: true,
      title: true,
      status: true,
      projectId: true,
      project: { select: { managerId: true } },
    },
  });
  if (!task) return { error: "Task not found or not allowed" };
  if (task.status === "COMPLETED")
    return { error: "This task is already completed" };

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  let photos: string[];
  try {
    photos = await uploadImages(files, `${task.projectId}/${taskId}`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.progressReport.create({
      data: {
        projectId: task.projectId,
        taskId,
        progress,
        description,
        photos,
        reportedById: user.id,
      },
    });
    await tx.task.update({ where: { id: taskId }, data: { progress } });
    await tx.taskHistory.create({
      data: {
        taskId,
        userId: user.id,
        action: `Progress report: ${progress}%`,
      },
    });
    // Project progress = average progress of its tasks (calculated on the server)
    const avg = await tx.task.aggregate({
      where: { projectId: task.projectId },
      _avg: { progress: true },
    });
    await tx.project.update({
      where: { id: task.projectId },
      data: { progress: Math.round(avg._avg.progress ?? 0) },
    });
  });

  await prisma.notification.create({
    data: {
      userId: task.project.managerId,
      title: "New progress report",
      message: `${user.name} reported ${progress}% on "${task.title}".`,
      link: "/progress",
    },
  });

  revalidatePath("/progress");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/projects");
  return { success: true };
}
