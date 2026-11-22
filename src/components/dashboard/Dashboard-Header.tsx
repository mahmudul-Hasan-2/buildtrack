"use client";

import { useState } from "react";
import { Menu, Bell, Sun, Moon, HardHat } from "lucide-react";
import { useTheme } from "next-themes";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/dashboard/User-Nav";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  CheckSquare,
  Package,
  DollarSign,
  FileText,
  Users,
  Settings,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ALL_NAV_ITEMS: Record<string, NavItem> = {
  dashboard: { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  projects: { title: "Projects", href: "/projects", icon: Briefcase },
  tasks: { title: "Tasks", href: "/tasks", icon: CheckSquare },
  contractors: { title: "Contractors", href: "/contractors", icon: HardHat },
  materials: { title: "Materials", href: "/materials", icon: Package },
  budget: { title: "Budget", href: "/budget", icon: DollarSign },
  reports: { title: "Reports", href: "/reports", icon: FileText },
  users: { title: "Users", href: "/users", icon: Users },
  settings: { title: "Settings", href: "/settings", icon: Settings },
};

const ROLE_NAVIGATION: Record<Role, string[]> = {
  ADMIN: [
    "dashboard",
    "projects",
    "tasks",
    "contractors",
    "materials",
    "budget",
    "reports",
    "users",
    "settings",
  ],
  PROJECT_MANAGER: [
    "dashboard",
    "projects",
    "tasks",
    "contractors",
    "materials",
    "reports",
    "settings",
  ],
  SITE_ENGINEER: ["dashboard", "tasks", "materials", "reports", "settings"],
  FINANCE_MANAGER: ["dashboard", "budget", "reports", "settings"],
  CONTRACTOR: ["dashboard", "projects", "tasks", "materials", "settings"],
};

interface DashboardHeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
    image?: string | null;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const userRole = user.role as Role;
  const navKeys = ROLE_NAVIGATION[userRole] || ["dashboard", "settings"];
  const navItems = navKeys.map((key) => ALL_NAV_ITEMS[key]).filter(Boolean);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Mobile Menu & Brand */}
      <div className="flex items-center gap-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-slate-700 dark:text-slate-300"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 bg-[#0B192C] text-slate-300 p-0 border-r border-slate-800"
          >
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
              <div className="h-9 w-9 rounded-lg bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                <HardHat className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Build<span className="text-orange-500">Track</span>
              </span>
            </div>
            <div className="px-4 py-6 space-y-1.5 overflow-y-auto">
              <div className="px-3 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Workspace
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                      isActive
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/20 font-semibold"
                        : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-orange-400",
                      )}
                    />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>

        {/* Command Center Indicator */}
        <div className="hidden sm:block">
          <span className="text-xs font-semibold uppercase tracking-widest text-orange-600 dark:text-orange-400">
            BuildTrack Command Center
          </span>
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative rounded-full"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
        </Button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        <UserNav user={user} />
      </div>
    </header>
  );
}
