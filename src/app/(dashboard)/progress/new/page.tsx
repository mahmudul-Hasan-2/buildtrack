import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { taskScope } from "@/lib/task-access";
import { ProgressForm } from "@/components/progress/progress-form";

export default async function NewProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ taskId?: string }>;
}) {
  const user = await requireRole("SITE_ENGINEER", "CONTRACTOR");
  const { taskId } = await searchParams;

  const tasks = await prisma.task.findMany({
    where: { AND: [await taskScope(user), { status: { not: "COMPLETED" } }] },
    select: { id: true, title: true, project: { select: { name: true } } },
    orderBy: { deadline: "asc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#0B192C]">New Progress Report</h1>
      <ProgressForm
        defaultTaskId={taskId}
        tasks={tasks.map((t) => ({
          id: t.id,
          label: `${t.title} (${t.project.name})`,
        }))}
      />
    </div>
  );
}
