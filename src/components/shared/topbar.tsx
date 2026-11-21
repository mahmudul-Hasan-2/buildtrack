import { LogOut } from "lucide-react";
import type { SessionUser } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import { signOutAction } from "@/actions/session";
import { MobileNav } from "@/components/dashboard/User-Nav";
import { Button } from "@/components/ui/button";

export function Topbar({ user }: { user: SessionUser }) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 sm:px-6">
      <MobileNav role={user.role} />
      <div className="hidden lg:block" />

      <div className="flex items-center gap-4">
        <div className="text-right leading-tight">
          <p className="text-sm font-semibold text-[#0B192C]">{user.name}</p>
          <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
        </div>

        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
