"use client";

import { useState, useTransition } from "react";
import { changeTaskStatus, addComment } from "@/actions/task";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"];

export function StatusChanger({
  taskId,
  current,
  canComplete,
}: {
  taskId: string;
  current: string;
  canComplete: boolean;
}) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-1">
      <select
        defaultValue={current}
        disabled={pending}
        onChange={(e) =>
          start(async () => {
            setError("");
            const r = await changeTaskStatus(taskId, e.target.value);
            if (!r.ok) {
              setError(r.error ?? "Failed");
              e.target.value = current;
            }
          })
        }
        className="h-9 rounded-md border border-input bg-white px-3 text-sm"
      >
        {STATUSES.filter((s) => canComplete || s !== "COMPLETED").map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ")}
          </option>
        ))}
        {!canComplete && current === "COMPLETED" && (
          <option value="COMPLETED">COMPLETED</option>
        )}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function CommentForm({ taskId }: { taskId: string }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a comment..."
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button
        size="sm"
        disabled={pending}
        className="bg-orange-500 hover:bg-orange-600"
        onClick={() =>
          start(async () => {
            const r = await addComment(taskId, text);
            if (!r.ok) return setError(r.error ?? "Failed");
            setError("");
            setText("");
          })
        }
      >
        Add comment
      </Button>
    </div>
  );
}
