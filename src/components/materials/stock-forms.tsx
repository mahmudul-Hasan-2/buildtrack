"use client";

import { useEffect, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  PackagePlus,
  PackageMinus,
  Send,
} from "lucide-react";
import {
  stockIn,
  recordUsage,
  requestMaterial,
  type Result,
} from "@/actions/material";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Opt = { id: string; name: string };
type Act = (materialId: string, fd: FormData) => Promise<Result>;

const selectCls =
  "h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/30";

function MiniForm({
  materialId,
  action,
  label,
  icon: Icon,
  projects,
}: {
  materialId: string;
  action: Act;
  label: string;
  icon: React.ElementType;
  projects?: Opt[];
}) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  // Success messages disappear by themselves; errors stay until the next try
  useEffect(() => {
    if (!msg?.ok) return;
    const t = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(t);
  }, [msg]);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        start(async () => {
          const r = await action(materialId, fd);
          setMsg({
            ok: r.ok,
            text: r.ok ? "Saved successfully" : (r.error ?? "Failed"),
          });
          if (r.ok) form.reset();
        });
      }}
    >
      {projects && (
        <div className="space-y-1.5">
          <Label className="font-medium text-slate-700">Project</Label>
          <select
            name="projectId"
            required
            defaultValue=""
            className={selectCls}
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="font-medium text-slate-700">Quantity</Label>
          <Input
            name="quantity"
            type="number"
            step="any"
            min="0"
            placeholder="0"
            required
            className="h-10 focus-visible:ring-orange-500/30"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="font-medium text-slate-700">Note</Label>
          <Input
            name="note"
            placeholder="Optional"
            className="h-10 focus-visible:ring-orange-500/30"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-orange-500 font-semibold shadow-md shadow-orange-500/20 hover:bg-orange-600 sm:w-auto"
      >
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icon className="mr-2 h-4 w-4" />
        )}
        {pending ? "Saving..." : label}
      </Button>

      {msg && (
        <div
          role="status"
          className={`flex items-start gap-2 rounded-lg border p-2.5 text-sm ${
            msg.ok
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {msg.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {msg.text}
        </div>
      )}
    </form>
  );
}

export const StockInForm = ({ materialId }: { materialId: string }) => (
  <MiniForm
    materialId={materialId}
    action={stockIn}
    label="Add stock"
    icon={PackagePlus}
  />
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
    icon={PackageMinus}
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
    icon={Send}
    projects={projects}
  />
);
