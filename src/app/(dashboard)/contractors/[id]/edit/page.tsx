import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { updateContractor } from "@/actions/contractor";
import { ContractorForm } from "@/components/contractors/contractor-form";

export default async function EditContractorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN", "PROJECT_MANAGER");
  const { id } = await params;
  const c = await prisma.contractor.findUnique({ where: { id } });
  if (!c) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#0B192C]">Edit Contractor</h1>
      <ContractorForm
        action={updateContractor.bind(null, id)}
        isNew={false}
        defaults={{
          companyName: c.companyName,
          contactName: c.contactName,
          email: c.email,
          phone: c.phone,
          address: c.address ?? "",
          status: c.status,
          rating: c.rating,
        }}
      />
    </div>
  );
}
