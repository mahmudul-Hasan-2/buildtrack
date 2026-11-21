"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import { HardHat, Loader2, AlertCircle, UserPlus } from "lucide-react";
import { registerAction, type AuthActionState } from "@/actions/auth";
import { ROLE_LABELS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initialState: AuthActionState = {};

export default function RegisterPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>(Role.SITE_ENGINEER);
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState,
  );

  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state.redirectTo, router]);

  return (
    <Card className="border-slate-200/80 shadow-xl bg-white">
      <CardHeader className="space-y-2 pb-6">
        <div className="flex lg:hidden items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-md bg-orange-500 flex items-center justify-center">
            <HardHat className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-[#0B192C]">
            Build<span className="text-orange-500">Track</span>
          </span>
        </div>
        <CardTitle className="text-2xl font-bold text-[#0B192C]">
          Create your account
        </CardTitle>
        <CardDescription className="text-slate-500">
          Set up your role-based access for BuildTrack
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700 font-medium">
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Alex Mercer"
              required
              disabled={isPending}
              className="focus-visible:ring-orange-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 font-medium">
              Work Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="alex.mercer@apexbuilders.com"
              required
              disabled={isPending}
              className="focus-visible:ring-orange-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-slate-700 font-medium">
              Project Role
            </Label>
            {/* Hidden input ensures FormData captures the Radix Select value */}
            <input type="hidden" name="role" value={selectedRole} />
            <Select
              value={selectedRole}
              onValueChange={(val) => setSelectedRole(val as Role)}
              disabled={isPending}
            >
              <SelectTrigger className="w-full focus:ring-orange-500">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Role).map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 font-medium">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimum 8 characters"
              minLength={8}
              required
              disabled={isPending}
              className="focus-visible:ring-orange-500"
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold h-11 shadow-md shadow-orange-500/20 transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Provisioning Workspace...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4 border-t border-slate-100 pt-6">
        <p className="text-sm text-center text-slate-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#0B192C] hover:text-orange-600 underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
