import { requireRole } from "@/lib/permissions";
import { createContractor } from "@/actions/contractor";
import { ContractorForm } from "@/components/contractors/contractor-form";

export default async function NewContractorPage() {
  await requireRole("ADMIN", "PROJECT_MANAGER");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#0B192C]">New Contractor</h1>
      <ContractorForm
        action={createContractor}
        isNew
        defaults={{ rating: 3 }}
      />
    </div>
  );
}
