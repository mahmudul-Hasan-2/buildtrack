import { z } from "zod";

export const projectSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    location: z.string().min(3, "Location is required"),
    startDate: z.coerce.date(),
    expectedEndDate: z.coerce.date(),
    totalBudget: z.coerce.number().positive("Budget must be greater than 0"),
    status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]),
    progress: z.coerce.number().int().min(0).max(100),
    managerId: z.string().optional(),
  })
  .refine((d) => d.expectedEndDate > d.startDate, {
    message: "End date must be after start date",
    path: ["expectedEndDate"],
  });

export type ProjectInput = z.infer<typeof projectSchema>;
