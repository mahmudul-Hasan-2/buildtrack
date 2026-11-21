"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HardHat,
  Loader2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { loginAction } from "@/actions/auth";
import type { AuthActionState } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const DEMO_PASSWORD = "Password123!";
const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@buildtrack.com" },
  { label: "Project Manager", email: "pm@buildtrack.com" },
  { label: "Site Engineer", email: "engineer@buildtrack.com" },
  { label: "Finance Manager", email: "finance@buildtrack.com" },
  { label: "Contractor", email: "contractor@buildtrack.com" },
];

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
          Welcome back
        </CardTitle>
        <CardDescription className="text-slate-500">
          Sign in to access your project command center
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
            <Label htmlFor="email" className="text-slate-700 font-medium">
              Work Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
              autoComplete="email"
              className="focus-visible:ring-orange-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 font-medium">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isPending}
                autoComplete="current-password"
                className="pr-10 focus-visible:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#0B192C] hover:bg-[#152842] text-white font-semibold h-11 transition-all group"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-orange-500" />
                Authenticating...
              </>
            ) : (
              <>
                Sign In to Workspace
                <ArrowRight className="ml-2 h-4 w-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>

        {/* Demo accounts: remove this block before real production use */}
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Demo accounts (click to fill)
          </p>
          <div className="flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                disabled={isPending}
                onClick={() => {
                  setEmail(a.email);
                  setPassword(DEMO_PASSWORD);
                }}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-orange-400 hover:text-orange-600 disabled:opacity-50"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4 border-t border-slate-100 pt-6">
        <p className="text-sm text-center text-slate-600">
          New contractor?{" "}
          <Link
            href="/register"
            className="font-semibold text-orange-600 hover:text-orange-500 underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
