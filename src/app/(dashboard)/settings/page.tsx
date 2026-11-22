import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import {
  ProfileForm,
  PasswordForm,
} from "@/components/settings/settings-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function SettingsContent() {
  const user = await requireUser();
  const full = await prisma.user.findUnique({
    where: { id: user.id },
    select: { phone: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B192C]">Profile Settings</h1>
        <p className="flex items-center gap-2 text-sm text-slate-500">
          {user.email} <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
        </p>
      </div>
      <div className="grid max-w-4xl gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm name={user.name} phone={full?.phone ?? ""} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-96 w-full rounded-lg border bg-muted/25 animate-pulse" />
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
