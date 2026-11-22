"use client";

import { useState, useTransition } from "react";
import {
  createMilestone,
  toggleMilestone,
  deleteMilestone,
  type Result,
} from "@/actions/milestone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type M = { id: string; title: string; dueDate: string; completed: boolean };

export function MilestoneManager({
  projectId,
  milestones,
  canEdit,
}: {
  projectId: string;
  milestones: M[];
  canEdit: boolean;
}) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<Result>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? "" : (r.error ?? "Failed"));
      if (r.ok) after?.();
    });

  return (
    <div className="space-y-3 text-sm">
      {milestones.length === 0 && (
        <p className="text-slate-500">No milestones yet.</p>
      )}
      {milestones.map((m) => (
        <div key={m.id} className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {canEdit && (
              <input
                type="checkbox"
                checked={m.completed}
                disabled={pending}
                onChange={() => run(() => toggleMilestone(m.id))}
                aria-label="Completed"
              />
            )}
            <span className={m.completed ? "text-slate-400 line-through" : ""}>
              {m.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={m.completed ? "text-green-600" : "text-slate-500"}>
              {m.completed ? "Done" : new Date(m.dueDate).toLocaleDateString()}
            </span>
            {canEdit && !m.completed && (
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                className="text-red-600"
                onClick={() => run(() => deleteMilestone(m.id))}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      ))}

      {canEdit && (
        <div className="flex flex-wrap gap-2 border-t pt-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New milestone"
            className="h-9 min-w-0 flex-1"
          />
          <Input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="h-9 w-40"
          />
          <Button
            size="sm"
            disabled={pending || !title.trim() || !due}
            className="bg-orange-500 hover:bg-orange-600"
            onClick={() =>
              run(
                () => createMilestone(projectId, title, due),
                () => {
                  setTitle("");
                  setDue("");
                },
              )
            }
          >
            Add
          </Button>
        </div>
      )}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
