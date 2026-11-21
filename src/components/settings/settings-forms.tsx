"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  updateProfile,
  changePassword,
  type SettingsState,
} from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Msg({ s }: { s: SettingsState }) {
  if (s.error)
    return (
      <p className="rounded bg-red-50 p-2 text-sm text-red-600">{s.error}</p>
    );
  if (s.success)
    return (
      <p className="rounded bg-green-50 p-2 text-sm text-green-700">
        {s.success}
      </p>
    );
  return null;
}

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    updateProfile,
    {},
  );
  return (
    <form action={action} className="space-y-4">
      <Msg s={state} />
      <div className="space-y-1">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" defaultValue={name} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={phone} />
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="bg-orange-500 hover:bg-orange-600"
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save profile
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    changePassword,
    {},
  );
  return (
    <form action={action} className="space-y-4">
      <Msg s={state} />
      <div className="space-y-1">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
        />
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="bg-[#0B192C] hover:bg-[#152842]"
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Change password
      </Button>
    </form>
  );
}
