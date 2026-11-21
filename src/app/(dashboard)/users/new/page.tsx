"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { createUser, type UserState } from "@/actions/user";
import { ROLE_LABELS } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UserForm() {
  const [state, action, pending] = useActionState<UserState, FormData>(
    createUser,
    {},
  );
  const E = (k: string) =>
    state.fieldErrors?.[k]?.[0] && (
      <p className="text-sm text-red-600">{state.fieldErrors[k]![0]}</p>
    );

  return (
    <form action={action} className="max-w-md space-y-4">
      {state.error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <div className="space-y-1">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" />
        {E("name")}
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" />
        {E("email")}
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Temporary password</Label>
        <Input id="password" name="password" type="password" />
        {E("password")}
      </div>
      <div className="space-y-1">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          defaultValue="PROJECT_MANAGER"
          className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
        >
          {Object.entries(ROLE_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="bg-orange-500 hover:bg-orange-600"
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create user
      </Button>
    </form>
  );
}
