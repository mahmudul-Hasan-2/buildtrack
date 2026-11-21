import { requireUser } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import { getDashboardStats } from "@/lib/dashboard-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireUser();
  const stats = await getDashboardStats(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B192C]">
          Welcome back, {user.name}
        </h1>
        <p className="text-sm text-slate-500">
          {ROLE_LABELS[user.role]} overview
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#0B192C]">{s.value}</p>
              {s.hint && (
                <p className="mt-1 text-xs text-slate-500">{s.hint}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
