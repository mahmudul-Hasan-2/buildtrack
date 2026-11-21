import { requireUser } from "@/lib/permissions";
import { Topbar } from "@/components/shared/topbar";
import { SidebarNav } from "@/components/shared/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarNav role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
