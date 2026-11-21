"use client";

import { useState, useTransition } from "react";
import { changeUserRole, setUserActive, type Result } from "@/actions/user";
import { ROLE_LABELS } from "@/lib/roles";
import { Button } from "@/components/ui/button";

export function UserActions({
  id,
  role,
  isActive,
  isSelf,
}: {
  id: string;
  role: string;
  isActive: boolean;
  isSelf: boolean;
}) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  if (isSelf) return <span className="text-xs text-slate-400">You</span>;

  const run = (fn: () => Promise<Result>) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? "" : (r.error ?? "Failed"));
    });

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {role !== "CONTRACTOR" && (
          <select
            defaultValue={role}
            disabled={pending}
            onChange={(e) => run(() => changeUserRole(id, e.target.value))}
            className="h-8 rounded-md border border-input bg-white px-2 text-xs"
          >
            {Object.entries(ROLE_LABELS)
              .filter(([k]) => k !== "CONTRACTOR")
              .map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
          </select>
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => setUserActive(id, !isActive))}
        >
          {isActive ? "Deactivate" : "Activate"}
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
