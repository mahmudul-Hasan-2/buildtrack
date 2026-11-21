"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import type { ProjectActionState } from "@/actions/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Defaults = {
  name?: string;
  description?: string;
  location?: string;
  startDate?: string;
  expectedEndDate?: string;
  totalBudget?: number;
  status?: string;
  progress?: number;
  managerId?: string;
};

export function ProjectForm({
  action,
  defaults = {},
  managers,
  isAdmin,
}: {
  action: (p: ProjectActionState, f: FormData) => Promise<ProjectActionState>;
  defaults?: Defaults;
  managers: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const err = (k: string) => state.fieldErrors?.[k]?.[0];

  const field = (name: keyof Defaults, label: string, type = "text") => (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaults[name] as string | number | undefined}
      />
      {err(name) && <p className="text-sm text-red-600">{err(name)}</p>}
    </div>
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      {state.error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {field("name", "Project name")}
      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaults.description}
        />
        {err("description") && (
          <p className="text-sm text-red-600">{err("description")}</p>
        )}
      </div>
      {field("location", "Location")}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("startDate", "Start date", "date")}
        {field("expectedEndDate", "Expected end date", "date")}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {field("totalBudget", "Total budget", "number")}
        {field("progress", "Progress %", "number")}
        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaults.status ?? "PLANNING"}
            className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
          >
            {["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"].map(
              (s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ),
            )}
          </select>
        </div>
      </div>
      {isAdmin && (
        <div className="space-y-1">
          <Label htmlFor="managerId">Project manager</Label>
          <select
            id="managerId"
            name="managerId"
            defaultValue={defaults.managerId}
            className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
          >
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <Button
        type="submit"
        disabled={pending}
        className="bg-orange-500 hover:bg-orange-600"
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save project
      </Button>
    </form>
  );
}
