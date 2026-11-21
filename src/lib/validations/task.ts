import { z } from "zod";

export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
] as const;
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const taskSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  priority: z.enum(PRIORITIES),
  deadline: z.coerce.date(),
  assigneeId: z.string().optional(),
  contractorId: z.string().optional(),
});

export const statusSchema = z.enum(TASK_STATUSES);
export const commentSchema = z.string().min(1, "Comment is empty").max(1000);
