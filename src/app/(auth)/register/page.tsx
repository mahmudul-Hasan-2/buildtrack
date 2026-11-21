"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HardHat, Loader2, AlertCircle, UserPlus } from "lucide-react";
import { registerAction } from "@/actions/auth";
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

type FieldName = "name" | "companyName" | "email" | "phone" | "password";

const FIELDS: {
  name: FieldName;
  label: string;
  type: string;
  placeholder: string;
  autoComplete: string;
}[] = [
  {
    name: "name",
    label: "Full Name",
    type: "text",
    placeholder: "Alex Mercer",
    autoComplete: "name",
  },
  {
    name: "companyName",
    label: "Company Name",
    type: "text",
    placeholder: "Apex Builders Ltd.",
    autoComplete: "organization",
  },
  {
    name: "email",
    label: "Work Email",
    type: "email",
    placeholder: "alex@apexbuilders.com",
    autoComplete: "email",
  },
  {
    name: "phone",
    label: "Phone",
    type: "tel",
    placeholder: "+8801XXXXXXXXX",
    autoComplete: "tel",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Minimum 8 characters",
    autoComplete: "new-password",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState,
  );
  const [values, setValues] = useState<Record<FieldName, string>>({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    password: "",
  });

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
          Register your company as a contractor on BuildTrack
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

          {FIELDS.map((f) => (
            <div key={f.name} className="space-y-2">
              <Label htmlFor={f.name} className="text-slate-700 font-medium">
                {f.label}
              </Label>
              <Input
                id={f.name}
                name={f.name}
                type={f.type}
                placeholder={f.placeholder}
                autoComplete={f.autoComplete}
                value={values[f.name]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.name]: e.target.value }))
                }
                minLength={f.name === "password" ? 8 : undefined}
                required
                disabled={isPending}
                className="focus-visible:ring-orange-500"
              />
            </div>
          ))}

          <p className="text-xs text-slate-500">
            Public sign-up creates a Contractor account. Other roles are
            assigned by an Admin.
          </p>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold h-11 shadow-md shadow-orange-500/20 transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
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
