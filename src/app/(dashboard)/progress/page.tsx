import Link from "next/link";
import { Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { taskScope } from "@/lib/task-access";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

const PAGE_SIZE = 6;

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireRole(
    "ADMIN",
    "PROJECT_MANAGER",
    "SITE_ENGINEER",
    "CONTRACTOR",
  );
  const page = Math.max(1, Number((await searchParams).page) || 1);

  let where: Prisma.ProgressReportWhereInput = {};
  if (user.role === "PROJECT_MANAGER")
    where = { project: { managerId: user.id } };
  if (user.role === "SITE_ENGINEER" || user.role === "CONTRACTOR") {
    where = {
      OR: [{ reportedById: user.id }, { task: await taskScope(user) }],
    };
  }

  const [reports, total] = await Promise.all([
    prisma.progressReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        project: { select: { name: true } },
        task: { select: { title: true } },
        reportedBy: { select: { name: true } },
      },
    }),
    prisma.progressReport.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canSubmit = user.role === "SITE_ENGINEER" || user.role === "CONTRACTOR";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B192C]">
            Progress Reports
          </h1>
          <p className="text-sm text-slate-500">{total} report(s)</p>
        </div>
        {canSubmit && (
          <Button asChild className="bg-orange-500 hover:bg-orange-600">
            <Link href="/progress/new">
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Link>
          </Button>
        )}
      </div>

      {reports.length === 0 && (
        <p className="py-10 text-center text-slate-500">No reports yet.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((r) => (
          <Card key={r.id}>
            <CardContent className="space-y-2 pt-6 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#0B192C]">
                    {r.task?.title ?? "General report"}
                  </p>
                  <p className="text-xs text-slate-500">{r.project.name}</p>
                </div>
                <span className="text-lg font-bold">{r.progress}%</span>
              </div>
              <Progress value={r.progress} className="h-2" />
              <p className="text-slate-700">{r.description}</p>
              {r.photos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {r.photos.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt="Progress photo"
                        className="h-16 w-16 rounded object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400">
                {r.reportedBy.name} · {r.createdAt.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/progress"
        params={{}}
      />
    </div>
  );
}
