import { z } from "zod";

export const expenseSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  projectId: z.string().min(1, "Project is required"),
  categoryId: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.coerce.date(),
  description: z.string().optional(),
});
