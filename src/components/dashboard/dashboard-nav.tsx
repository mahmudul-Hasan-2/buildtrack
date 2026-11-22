"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import {
  HardHat,
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Wallet,
  Receipt,
  Boxes,
  Users,
  BarChart3,
  UserCog,
  Settings,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const ALL: Role[] = [
  "ADMIN",
  "PROJECT_MANAGER",
  "SITE_ENGINEER",
  "FINANCE_MANAGER",
  "CONTRACTOR",
];

const NAV: {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ALL },
  {
    href: "/projects",
    label: "Projects",
    icon: FolderKanban,
    roles: ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "CONTRACTOR"],
  },
  {
    href: "/tasks",
    label: "Tasks",
    icon: ListChecks,
    roles: ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "CONTRACTOR"],
  },
  {
    href: "/budget",
    label: "Budget",
    icon: Wallet,
    roles: ["ADMIN", "PROJECT_MANAGER", "FINANCE_MANAGER"],
  },
  {
    href: "/expenses",
    label: "Expenses",
    icon: Receipt,
    roles: ["ADMIN", "FINANCE_MANAGER"],
  },
  {
    href: "/materials",
    label: "Materials",
    icon: Boxes,
    roles: ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "CONTRACTOR"],
  },
  {
    href: "/contractors",
    label: "Contractors",
    icon: Users,
    roles: ["ADMIN", "PROJECT_MANAGER"],
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["ADMIN", "PROJECT_MANAGER", "FINANCE_MANAGER"],
  },
  { href: "/users", label: "Users", icon: UserCog, roles: ["ADMIN"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ALL },
];

function Brand() {
  return (
    <div className="flex items-center gap-2 px-4 py-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-500">
        <HardHat className="h-5 w-5 text-white" />
      </div>
      <span className="text-lg font-bold text-white">
        Build<span className="text-orange-500">Track</span>
      </span>
    </div>
  );
}

function Links({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.filter((i) => i.roles.includes(role)).map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-orange-500 text-white"
                : "text-slate-300 hover:bg-white/10 hover:text-white",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarNav({ role }: { role: Role }) {
  return (
    <aside className="hidden w-64 shrink-0 bg-[#0B192C] lg:block">
      <Brand />
      <Links role={role} />
    </aside>
  );
}

export function MobileNav({ role }: { role: Role }) {
  return (
    <Sheet>
      <SheetTrigger>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 border-0 bg-[#0B192C] p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <Brand />
        <Links role={role} />
      </SheetContent>
    </Sheet>
  );
}
