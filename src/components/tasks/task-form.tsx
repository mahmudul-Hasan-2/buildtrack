"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import type { TaskFormState } from "@/actions/task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

const selectCls =
  "h-9 w-full rounded-md border border-input bg-white px-3 text-sm";

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
    err(k) && <p className="text-sm text-red-600">{err(k)}</p>;

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      {state.error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="space-y-1">
        <Label htmlFor="projectId">Project</Label>
        {lockProject && (
          <input type="hidden" name="projectId" value={defaults.projectId} />
        )}
        <select
          id="projectId"
          name={lockProject ? undefined : "projectId"}
          defaultValue={defaults.projectId}
          disabled={lockProject}
          className={selectCls}
        >
          <option value="">Select project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {E("projectId")}
      </div>

      <div className="space-y-1">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={defaults.title} />
        {E("title")}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaults.description}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            name="priority"
            defaultValue={defaults.priority ?? "MEDIUM"}
            className={selectCls}
          >
            {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            name="deadline"
            type="date"
            defaultValue={defaults.deadline}
          />
          {E("deadline")}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="assigneeId">Assigned engineer</Label>
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
        <div className="space-y-1">
          <Label htmlFor="contractorId">Contractor</Label>
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
        </div>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="bg-orange-500 hover:bg-orange-600"
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save task
      </Button>
    </form>
  );
}
