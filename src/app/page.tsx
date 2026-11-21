import { redirect } from "next/navigation";
import { getCurrentUser, ROLE_DASHBOARD_MAP } from "@/lib/permissions";

export default async function RootPage() {
  const user = await getCurrentUser();

  // If unauthenticated, direct to login
  if (!user || !user.role) {
    redirect("/login");
  }

  // Route directly to the corresponding role dashboard
  const targetDashboard =
    ROLE_DASHBOARD_MAP[user.role] || "/dashboard/engineer";
  redirect(targetDashboard);
}
