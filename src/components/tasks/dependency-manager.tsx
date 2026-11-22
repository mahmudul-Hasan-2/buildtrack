"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  addDependency,
  removeDependency,
  type TaskResult,
} from "@/actions/task";
import { Button } from "@/components/ui/button";

type T = { id: string; title: string };

export function DependencyManager({
  taskId,
  current,
  options,
  canEdit,
}: {
  taskId: string;
  current: T[];
  options: T[];
  canEdit: boolean;
}) {
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<TaskResult>) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? "" : (r.error ?? "Failed"));
      if (r.ok) setSelected("");
    });

  return (
    <div className="space-y-2 text-sm">
      {current.length === 0 && (
        <p className="text-slate-500">No dependencies</p>
      )}
      {current.map((d) => (
        <div key={d.id} className="flex items-center justify-between">
          <Link href={`/tasks/${d.id}`} className="hover:underline">
            {d.title}
          </Link>
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              className="text-red-600"
              onClick={() => run(() => removeDependency(taskId, d.id))}
            >
              Remove
            </Button>
          )}
        </div>
      ))}

      {canEdit && (
        <div className="flex gap-2 border-t pt-3">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={pending}
            className="h-9 min-w-0 flex-1 rounded-md border border-input bg-white px-3 text-sm"
          >
            <option value="">Depends on...</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={pending || !selected}
            className="bg-orange-500 hover:bg-orange-600"
            onClick={() => run(() => addDependency(taskId, selected))}
          >
            Add
          </Button>
        </div>
      )}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
