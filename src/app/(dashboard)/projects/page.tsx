import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { projectScope } from "@/lib/project-access";
import { ProjectFilters } from "@/components/projects/project-filters";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 8;

const ORDER: Record<string, Prisma.ProjectOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  name: { name: "asc" },
  budget: { totalBudget: "desc" },
  progress: { progress: "desc" },
};

type SP = { q?: string; status?: string; sort?: string; page?: string };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const user = await requireRole(
    "ADMIN",
    "PROJECT_MANAGER",
    "SITE_ENGINEER",
    "CONTRACTOR",
  );
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.ProjectWhereInput = {
    AND: [
      await projectScope(user),
      sp.q
        ? {
            OR: [
              { name: { contains: sp.q, mode: "insensitive" } },
              { location: { contains: sp.q, mode: "insensitive" } },
            ],
          }
        : {},
      sp.status
        ? { status: sp.status as Prisma.ProjectWhereInput["status"] }
        : {},
    ],
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: ORDER[sp.sort ?? "newest"] ?? ORDER.newest,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { manager: { select: { name: true } } },
    }),
    prisma.project.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Only Admin and Project Manager can create projects (also enforced in the server action)
  const canCreate = user.role === "ADMIN" || user.role === "PROJECT_MANAGER";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B192C]">Projects</h1>
          <p className="text-sm text-slate-500">{total} project(s)</p>
        </div>
        {canCreate && (
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Link href="/projects/new" className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        )}
      </div>

      <Suspense>
        <ProjectFilters />
      </Suspense>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-40">Progress</TableHead>
              <TableHead className="text-right">Budget</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  <p className="text-slate-500">No projects found.</p>
                  {canCreate && (
                    <Button
                      asChild
                      size="sm"
                      className="mt-3 bg-orange-500 hover:bg-orange-600"
                    >
                      <Link href="/projects/new">Create project</Link>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
            {projects.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link
                    href={`/projects/${p.id}`}
                    className="font-medium text-[#0B192C] hover:underline"
                  >
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell className="text-slate-600">{p.location}</TableCell>
                <TableCell>{p.manager.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {p.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={p.progress} className="h-2" />
                    <span className="text-xs">{p.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  ${Number(p.totalBudget).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/projects"
        params={{ q: sp.q, status: sp.status, sort: sp.sort }}
      />
    </div>
  );
}
