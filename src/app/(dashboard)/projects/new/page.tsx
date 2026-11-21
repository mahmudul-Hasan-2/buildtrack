import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { createProject } from "@/actions/project";
import { ProjectForm } from "@/components/projects/project-form";

export default async function NewProjectPage() {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER");
  const managers = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "PROJECT_MANAGER"] }, isActive: true },
    select: { id: true, name: true },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#0B192C]">New Project</h1>
      <ProjectForm
        action={createProject}
        managers={managers}
        isAdmin={user.role === "ADMIN"}
      />
    </div>
  );
}
