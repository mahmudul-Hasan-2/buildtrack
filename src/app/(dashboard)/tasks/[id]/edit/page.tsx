import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { taskScope } from "@/lib/task-access";
import { updateTask } from "@/actions/task";
import { TaskForm } from "@/components/tasks/task-form";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("ADMIN", "PROJECT_MANAGER");
  const { id } = await params;

  const t = await prisma.task.findFirst({
    where: { AND: [{ id }, await taskScope(user)] },
    include: { project: { select: { id: true, name: true } } },
  });
  if (!t) notFound();

  const [engineers, contractors] = await Promise.all([
    prisma.user.findMany({
      where: { role: "SITE_ENGINEER", isActive: true },
      select: { id: true, name: true },
    }),
    prisma.projectContractor.findMany({
      where: { projectId: t.projectId },
      select: { contractor: { select: { id: true, companyName: true } } },
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#0B192C]">Edit Task</h1>
      <TaskForm
        action={updateTask.bind(null, id)}
        lockProject
        projects={[t.project]}
        engineers={engineers}
        contractors={contractors.map((c) => ({
          id: c.contractor.id,
          name: c.contractor.companyName,
        }))}
        defaults={{
          projectId: t.projectId,
          title: t.title,
          description: t.description ?? "",
          priority: t.priority,
          deadline: t.deadline.toISOString().slice(0, 10),
          assigneeId: t.assigneeId ?? "",
          contractorId: t.contractorId ?? "",
        }}
      />
    </div>
  );
}
