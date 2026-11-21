import { z } from "zod";

export const materialSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  sku: z.string().trim().min(3, "SKU is required"),
  categoryId: z.string().min(1, "Category is required"),
  unit: z.string().trim().min(1, "Unit is required"),
  availableQuantity: z.coerce.number().min(0, "Cannot be negative"),
  lowStockThreshold: z.coerce.number().min(0, "Cannot be negative"),
  unitPrice: z.coerce.number().positive("Price must be greater than 0"),
});

export const quantitySchema = z.coerce
  .number()
  .positive("Quantity must be greater than 0");
