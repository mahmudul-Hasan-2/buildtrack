import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { createTask } from "@/actions/task";
import { TaskForm } from "@/components/tasks/task-form";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER");
  const { projectId } = await searchParams;

  const [projects, engineers, contractors] = await Promise.all([
    prisma.project.findMany({
      where: user.role === "PROJECT_MANAGER" ? { managerId: user.id } : {},
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "SITE_ENGINEER", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.contractor.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#0B192C]">New Task</h1>
      <TaskForm
        action={createTask}
        defaults={{ projectId }}
        projects={projects}
        engineers={engineers}
        contractors={contractors.map((c) => ({
          id: c.id,
          name: c.companyName,
        }))}
      />
    </div>
  );
}
