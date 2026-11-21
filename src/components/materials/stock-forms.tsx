"use client";

import { useState, useTransition } from "react";
import {
  stockIn,
  recordUsage,
  requestMaterial,
  type Result,
} from "@/actions/material";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Opt = { id: string; name: string };
type Act = (materialId: string, fd: FormData) => Promise<Result>;

function MiniForm({
  materialId,
  action,
  label,
  projects,
}: {
  materialId: string;
  action: Act;
  label: string;
  projects?: Opt[];
}) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        start(async () => {
          const r = await action(materialId, fd);
          setMsg({ ok: r.ok, text: r.ok ? "Saved" : (r.error ?? "Failed") });
          if (r.ok) form.reset();
        });
      }}
    >
      {projects && (
        <select
          name="projectId"
          required
          defaultValue=""
          className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
        >
          <option value="">Select project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-2">
        <Input
          name="quantity"
          type="number"
          step="any"
          min="0"
          placeholder="Quantity"
          required
          className="h-9"
        />
        <Input name="note" placeholder="Note (optional)" className="h-9" />
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={pending}
        className="bg-orange-500 hover:bg-orange-600"
      >
        {label}
      </Button>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-green-600" : "text-red-600"}`}>
          {msg.text}
        </p>
      )}
    </form>
  );
}

export const StockInForm = ({ materialId }: { materialId: string }) => (
  <MiniForm materialId={materialId} action={stockIn} label="Add stock" />
);
export const UsageForm = ({
  materialId,
  projects,
}: {
  materialId: string;
  projects: Opt[];
}) => (
  <MiniForm
    materialId={materialId}
    action={recordUsage}
    label="Record usage"
    projects={projects}
  />
);
export const RequestForm = ({
  materialId,
  projects,
}: {
  materialId: string;
  projects: Opt[];
}) => (
  <MiniForm
    materialId={materialId}
    action={requestMaterial}
    label="Submit request"
    projects={projects}
  />
);
