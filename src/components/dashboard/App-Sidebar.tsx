"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import {
  LayoutDashboard,
  Briefcase,
  CheckSquare,
  HardHat,
  Package,
  DollarSign,
  FileText,
  Users,
  Settings,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface AppSidebarProps {
  userRole: Role;
  className?: string;
}

export function AppSidebar({ userRole, className }: AppSidebarProps) {
  const pathname = usePathname();
  const navKeys = ROLE_NAVIGATION[userRole] || ["dashboard", "settings"];
  const navItems = navKeys.map((key) => ALL_NAV_ITEMS[key]).filter(Boolean);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col w-64 bg-[#0B192C] text-slate-300 border-r border-slate-800 shrink-0",
        className,
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
        <div className="h-9 w-9 rounded-lg bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20">
          <HardHat className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-white">
            Build<span className="text-orange-500">Track</span>
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
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

      {/* Sidebar Footer Badge */}
      <div className="p-4 border-t border-slate-800/80 m-4 rounded-xl bg-slate-900/50">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Shield className="h-3.5 w-3.5 text-orange-500 shrink-0" />
          <span className="truncate">Role: {userRole.replace("_", " ")}</span>
        </div>
      </div>
    </aside>
  );
}
