"use client";

import { useState, useTransition } from "react";
import {
  assignContractor,
  removeContractor,
} from "@/actions/project-contractor";
import { Button } from "@/components/ui/button";

type Opt = { id: string; name: string };

export function ContractorManager({
  projectId,
  assigned,
  available,
}: {
  projectId: string;
  assigned: Opt[];
  available: Opt[];
}) {
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError("");
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Failed");
      else setSelected("");
    });

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {assigned.length === 0 && (
          <p className="text-sm text-slate-500">No contractors assigned yet.</p>
        )}
        {assigned.map((c) => (
          <div key={c.id} className="flex items-center justify-between text-sm">
            <span>{c.name}</span>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              className="text-red-600 hover:text-red-700"
              onClick={() => run(() => removeContractor(projectId, c.id))}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-t pt-3">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={pending}
          className="h-9 min-w-0 flex-1 rounded-md border border-input bg-white px-3 text-sm"
        >
          <option value="">Select contractor...</option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          disabled={pending || !selected}
          className="bg-orange-500 hover:bg-orange-600"
          onClick={() => run(() => assignContractor(projectId, selected))}
        >
          Assign
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
