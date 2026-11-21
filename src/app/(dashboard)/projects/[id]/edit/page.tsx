import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { updateProject } from "@/actions/project";
import { ProjectForm } from "@/components/projects/project-form";

const d = (x: Date) => x.toISOString().slice(0, 10);

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER");
  const { id } = await params;
  const p = await prisma.project.findUnique({ where: { id } });
  if (!p) notFound();
  if (user.role === "PROJECT_MANAGER" && p.managerId !== user.id)
    redirect("/projects");

  const managers = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "PROJECT_MANAGER"] }, isActive: true },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#0B192C]">Edit Project</h1>
      <ProjectForm
        action={updateProject.bind(null, id)}
        managers={managers}
        isAdmin={user.role === "ADMIN"}
        defaults={{
          name: p.name,
          description: p.description,
          location: p.location,
          startDate: d(p.startDate),
          expectedEndDate: d(p.expectedEndDate),
          totalBudget: Number(p.totalBudget),
          status: p.status,
          progress: p.progress,
          managerId: p.managerId,
        }}
      />
    </div>
  );
}
