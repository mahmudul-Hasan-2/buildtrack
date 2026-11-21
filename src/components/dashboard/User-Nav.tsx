"use client";

import { useTransition } from "react";
import Link from "next/link";
import type { Role } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/roles";
import { signOutAction } from "@/actions/session";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, ShieldCheck, Loader2 } from "lucide-react";

interface UserNavProps {
  user: {
    name: string;
    email: string;
    role: string;
    image?: string | null;
  };
}

export function UserNav({ user }: UserNavProps) {
  const [isPending, startTransition] = useTransition();
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "BT";

  const roleLabel = ROLE_LABELS[user.role as Role] || user.role;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full focus-visible:ring-orange-500"
        >
          <Avatar className="h-10 w-10 border-2 border-orange-500/30">
            <AvatarImage src={user.image || undefined} alt={user.name} />
            <AvatarFallback className="bg-[#0B192C] text-sm font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-slate-900">
              {user.name}
            </p>
            <p className="text-xs leading-none text-slate-500">{user.email}</p>
            <div className="flex items-center gap-1 pt-1.5 text-[11px] font-medium text-orange-600">
              <ShieldCheck className="h-3 w-3" />
              <span>{roleLabel}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex cursor-pointer items-center">
              <User className="mr-2 h-4 w-4 text-slate-500" />
              <span>Profile Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await signOutAction();
            });
          }}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
