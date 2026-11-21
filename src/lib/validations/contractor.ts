import { z } from "zod";

export const contractorSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required"),
  contactName: z.string().trim().min(2, "Contact name is required"),
  phone: z.string().trim().min(6, "Enter a valid phone number"),
  address: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  rating: z.coerce.number().min(0).max(5),
});

export const newContractorSchema = contractorSchema.extend({
  email: z.string().email("Enter a valid email"),
});
