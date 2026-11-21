import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { MaterialForm } from "@/components/materials/material-form";

export default async function NewMaterialPage() {
  await requireRole("ADMIN", "PROJECT_MANAGER");
  const categories = await prisma.materialCategory.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#0B192C]">New Material</h1>
      <MaterialForm categories={categories} />
    </div>
  );
}
