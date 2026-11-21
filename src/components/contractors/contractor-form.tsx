"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import type { ContractorState } from "@/actions/contractor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Defaults = {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  rating?: number;
};

export function ContractorForm({
  action,
  defaults = {},
  isNew,
}: {
  action: (p: ContractorState, f: FormData) => Promise<ContractorState>;
  defaults?: Defaults;
  isNew: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const E = (k: string) =>
    state.fieldErrors?.[k]?.[0] && (
      <p className="text-sm text-red-600">{state.fieldErrors[k]![0]}</p>
    );
  const field = (name: keyof Defaults, label: string, type = "text") => (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        step={type === "number" ? "0.1" : undefined}
        min={type === "number" ? 0 : undefined}
        max={type === "number" ? 5 : undefined}
        defaultValue={defaults[name] as string | number | undefined}
      />
      {E(name)}
    </div>
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      {state.error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("companyName", "Company name")}
        {field("contactName", "Contact person")}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {isNew ? (
          field("email", "Email", "email")
        ) : (
          <div className="space-y-1">
            <Label>Email</Label>
            <p className="flex h-9 items-center rounded-md border bg-slate-50 px-3 text-sm text-slate-600">
              {defaults.email}
            </p>
          </div>
        )}
        {field("phone", "Phone")}
      </div>
      {field("address", "Address")}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaults.status ?? "ACTIVE"}
            className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
          >
            {["ACTIVE", "INACTIVE", "SUSPENDED"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {field("rating", "Performance rating (0-5)", "number")}
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="bg-orange-500 hover:bg-orange-600"
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save contractor
      </Button>
    </form>
  );
}
