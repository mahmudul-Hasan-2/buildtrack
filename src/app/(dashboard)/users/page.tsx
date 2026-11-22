import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import { ListFilters } from "@/components/shared/list-filters";
import { Pagination } from "@/components/shared/pagination";
import { UserActions } from "@/components/users/user-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 10;
type SP = { q?: string; role?: string; state?: string; page?: string };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const admin = await requireRole("ADMIN");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.UserWhereInput = {
    AND: [
      sp.q
        ? {
            OR: [
              { name: { contains: sp.q, mode: "insensitive" } },
              { email: { contains: sp.q, mode: "insensitive" } },
            ],
          }
        : {},
      sp.role ? { role: sp.role as Prisma.UserWhereInput["role"] } : {},
      sp.state === "active"
        ? { isActive: true }
        : sp.state === "inactive"
          ? { isActive: false }
          : {},
    ],
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B192C]">Users</h1>
          <p className="text-sm text-slate-500">{total} user(s)</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Link href="/users/new" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            New User
          </Link>
        </Button>
      </div>

      <Suspense>
        <ListFilters
          placeholder="Search name or email..."
          selects={[
            {
              key: "role",
              label: "All roles",
              options: Object.entries(ROLE_LABELS).map(([v, l]) => ({
                value: v,
                label: l,
              })),
            },
            {
              key: "state",
              label: "All users",
              options: [
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ],
            },
          ]}
        />
      </Suspense>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-slate-500"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-[#0B192C]">
                  {u.name}
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{ROLE_LABELS[u.role]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? "secondary" : "destructive"}>
                    {u.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{u.createdAt.toLocaleDateString()}</TableCell>
                <TableCell>
                  <UserActions
                    id={u.id}
                    role={u.role}
                    isActive={u.isActive}
                    isSelf={u.id === admin.id}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/users"
        params={{ q: sp.q, role: sp.role, state: sp.state }}
      />
    </div>
  );
}
