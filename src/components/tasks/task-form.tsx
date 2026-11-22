"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarClock,
  FileText,
  Flag,
  Loader2,
  Save,
  Users,
} from "lucide-react";
import type { TaskFormState } from "@/actions/task";
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

type Opt = { id: string; name: string };
type Defaults = {
  projectId?: string;
  title?: string;
  description?: string;
  priority?: string;
  deadline?: string;
  assigneeId?: string;
  contractorId?: string;
};

const PRIORITIES = [
  {
    value: "LOW",
    label: "Low",
    cls: "peer-checked:border-slate-500 peer-checked:bg-slate-100 peer-checked:text-slate-700",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    cls: "peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700",
  },
  {
    value: "HIGH",
    label: "High",
    cls: "peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:text-orange-700",
  },
  {
    value: "CRITICAL",
    label: "Critical",
    cls: "peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700",
  },
];

const selectCls =
  "h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/30 disabled:bg-slate-50 disabled:text-slate-500";

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

export function TaskForm({
  action,
  defaults = {},
  projects,
  engineers,
  contractors,
  lockProject,
}: {
  action: (p: TaskFormState, f: FormData) => Promise<TaskFormState>;
  defaults?: Defaults;
  projects: Opt[];
  engineers: Opt[];
  contractors: Opt[];
  lockProject?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const err = (k: string) => state.fieldErrors?.[k]?.[0];
  const E = (k: string) =>
    err(k) && (
      <p className="flex items-center gap-1 text-sm text-red-600">
        <AlertCircle className="h-3.5 w-3.5" />
        {err(k)}
      </p>
    );

  const currentPriority = defaults.priority ?? "MEDIUM";

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
        title="Task details"
        description="Which project it belongs to and what needs to be done."
      >
        <div className="space-y-1.5">
          <Label htmlFor="projectId" className="font-medium text-slate-700">
            Project
          </Label>
          {lockProject && (
            <input type="hidden" name="projectId" value={defaults.projectId} />
          )}
          <select
            id="projectId"
            name={lockProject ? undefined : "projectId"}
            defaultValue={defaults.projectId ?? ""}
            disabled={lockProject}
            aria-invalid={!!err("projectId")}
            className={`${selectCls} ${err("projectId") ? "border-red-400" : ""}`}
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {lockProject && (
            <p className="text-xs text-slate-500">
              A task cannot be moved to another project.
            </p>
          )}
          {E("projectId")}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title" className="font-medium text-slate-700">
            Title
          </Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g. Foundation work"
            defaultValue={defaults.title}
            aria-invalid={!!err("title")}
            className={`h-10 focus-visible:ring-orange-500/30 ${
              err("title") ? "border-red-400" : ""
            }`}
          />
          {E("title")}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description" className="font-medium text-slate-700">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Scope and instructions (optional)"
            defaultValue={defaults.description}
            className="focus-visible:ring-orange-500/30"
          />
        </div>
      </Section>

      <Section
        icon={Flag}
        title="Priority and deadline"
        description="How urgent it is and when it is due."
      >
        <div className="space-y-1.5">
          <Label className="font-medium text-slate-700">Priority</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PRIORITIES.map((p) => (
              <label key={p.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value={p.value}
                  defaultChecked={currentPriority === p.value}
                  className="peer sr-only"
                />
                <span
                  className={`block rounded-md border border-slate-200 bg-white px-3 py-2 text-center text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500/40 ${p.cls}`}
                >
                  {p.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 sm:max-w-xs">
          <Label
            htmlFor="deadline"
            className="flex items-center gap-1.5 font-medium text-slate-700"
          >
            <CalendarClock className="h-4 w-4 text-slate-500" />
            Deadline
          </Label>
          <Input
            id="deadline"
            name="deadline"
            type="date"
            defaultValue={defaults.deadline}
            aria-invalid={!!err("deadline")}
            className={`h-10 focus-visible:ring-orange-500/30 ${
              err("deadline") ? "border-red-400" : ""
            }`}
          />
          {E("deadline")}
        </div>
      </Section>

      <Section
        icon={Users}
        title="Assignment"
        description="Who will work on this task."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="assigneeId" className="font-medium text-slate-700">
              Assigned engineer
            </Label>
            <select
              id="assigneeId"
              name="assigneeId"
              defaultValue={defaults.assigneeId ?? ""}
              className={selectCls}
            >
              <option value="">Unassigned</option>
              {engineers.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="contractorId"
              className="font-medium text-slate-700"
            >
              Contractor
            </Label>
            <select
              id="contractorId"
              name="contractorId"
              defaultValue={defaults.contractorId ?? ""}
              className={selectCls}
            >
              <option value="">None</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">
              Must already be assigned to the project.
            </p>
          </div>
        </div>
      </Section>

      <Card className="border-slate-200 shadow-sm">
        <CardFooter className="flex justify-end gap-3 py-4">
          <Button asChild type="button" variant="outline" disabled={pending}>
            <Link href="/tasks">Cancel</Link>
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
            {pending ? "Saving..." : "Save task"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
