import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { UserForm } from "@/components/users/user-form";

export default async function NewUserPage() {
  // Ensure only ADMIN can access user creation
  await requireRole("ADMIN");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon">
          <Link href="/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New User</h1>
          <p className="text-sm text-muted-foreground">
            Add a new team member and assign their workspace role.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-xs max-w-2xl">
        <UserForm />
      </div>
    </div>
  );
}
