import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Future global dashboard sidebar/header shell can be integrated here */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
