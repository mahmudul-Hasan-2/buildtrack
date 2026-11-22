"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  MapPin,
  Save,
  UserCog,
} from "lucide-react";
import type { ProjectActionState } from "@/actions/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

const STATUSES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];

const selectCls =
  "h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/30";

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base text-[#0B192C]">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100">
            <Icon className="h-4 w-4 text-orange-600" />
          </span>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

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
  const [progress, setProgress] = useState(defaults.progress ?? 0);
  const err = (k: string) => state.fieldErrors?.[k]?.[0];

  const field = (
    name: keyof Defaults,
    label: string,
    opts: { type?: string; placeholder?: string; step?: string } = {},
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="font-medium text-slate-700">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={opts.type ?? "text"}
        step={opts.step}
        placeholder={opts.placeholder}
        defaultValue={defaults[name] as string | number | undefined}
        aria-invalid={!!err(name)}
        className={`h-10 focus-visible:ring-orange-500/30 ${
          err(name) ? "border-red-400" : ""
        }`}
      />
      {err(name) && (
        <p className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {err(name)}
        </p>
      )}
    </div>
  );

  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      {state.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      <Section
        icon={FileText}
        title="Basic information"
        description="Name and describe the project."
      >
        {field("name", "Project name", { placeholder: "e.g. Skyline Tower" })}
        <div className="space-y-1.5">
          <Label htmlFor="description" className="font-medium text-slate-700">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Scope, goals and key details..."
            defaultValue={defaults.description}
            aria-invalid={!!err("description")}
            className={`focus-visible:ring-orange-500/30 ${
              err("description") ? "border-red-400" : ""
            }`}
          />
          {err("description") && (
            <p className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {err("description")}
            </p>
          )}
        </div>
      </Section>

      <Section
        icon={MapPin}
        title="Location"
        description="Where the project is being built."
      >
        {field("location", "Location", {
          placeholder: "Street address, city",
        })}
      </Section>

      <Section
        icon={Calendar}
        title="Schedule"
        description="Start date and expected completion."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {field("startDate", "Start date", { type: "date" })}
          {field("expectedEndDate", "Expected end date", { type: "date" })}
        </div>
      </Section>

      <Section
        icon={DollarSign}
        title="Budget and status"
        description="Total budget, current status and progress."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {field("totalBudget", "Total budget ($)", {
            type: "number",
            step: "0.01",
            placeholder: "0.00",
          })}
          <div className="space-y-1.5">
            <Label htmlFor="status" className="font-medium text-slate-700">
              Status
            </Label>
            <select
              id="status"
              name="status"
              defaultValue={defaults.status ?? "PLANNING"}
              className={selectCls}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="progress" className="font-medium text-slate-700">
              Progress
            </Label>
            <span className="text-sm font-semibold text-orange-600">
              {progress}%
            </span>
          </div>
          <input
            id="progress"
            name="progress"
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-orange-500"
          />
          {err("progress") && (
            <p className="text-sm text-red-600">{err("progress")}</p>
          )}
        </div>
      </Section>

      {isAdmin && (
        <Section
          icon={UserCog}
          title="Project manager"
          description="Who is responsible for this project."
        >
          <div className="space-y-1.5">
            <Label htmlFor="managerId" className="font-medium text-slate-700">
              Manager
            </Label>
            <select
              id="managerId"
              name="managerId"
              defaultValue={defaults.managerId}
              className={selectCls}
            >
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </Section>
      )}

      <Card className="border-slate-200 shadow-sm">
        <CardFooter className="flex justify-end gap-3 py-4">
          <Button asChild type="button" variant="outline" disabled={pending}>
            <Link href="/projects">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={pending}
            className="bg-orange-500 font-semibold shadow-md shadow-orange-500/20 hover:bg-orange-600"
          >
            {pending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {pending ? "Saving..." : "Save project"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
