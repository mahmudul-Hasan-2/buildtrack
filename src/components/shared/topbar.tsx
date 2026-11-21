import Link from "next/link";
import { Bell, LogOut } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import { signOutAction } from "@/actions/session";
import { MobileNav } from "@/components/shared/dashboard-nav";
import { Button } from "@/components/ui/button";

export async function Topbar({ user }: { user: SessionUser }) {
  const unread = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 sm:px-6">
      <MobileNav role={user.role} />
      <div className="hidden lg:block" />

      <div className="flex items-center gap-4">
        <Link
          href="/notifications"
          className="relative rounded-md p-2 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-slate-600" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Link>

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
