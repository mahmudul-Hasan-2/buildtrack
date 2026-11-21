"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { submitProgress, type ProgressState } from "@/actions/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ProgressForm({
  tasks,
  defaultTaskId,
}: {
  tasks: { id: string; label: string }[];
  defaultTaskId?: string;
}) {
  const [state, action, pending] = useActionState<ProgressState, FormData>(
    submitProgress,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success) ref.current?.reset();
  }, [state]);

  const E = (k: string) =>
    state.fieldErrors?.[k]?.[0] && (
      <p className="text-sm text-red-600">{state.fieldErrors[k]![0]}</p>
    );

  return (
    <form ref={ref} action={action} className="max-w-2xl space-y-4">
      {state.error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded bg-green-50 p-2 text-sm text-green-700">
          Progress report submitted.
        </p>
      )}

      <div className="space-y-1">
        <Label htmlFor="taskId">Task</Label>
        <select
          id="taskId"
          name="taskId"
          defaultValue={defaultTaskId ?? ""}
          className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
        >
          <option value="">Select task</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        {E("taskId")}
      </div>

      <div className="space-y-1">
        <Label htmlFor="progress">Progress (%)</Label>
        <Input
          id="progress"
          name="progress"
          type="number"
          min={0}
          max={100}
          defaultValue={0}
        />
        {E("progress")}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Work description</Label>
        <Textarea id="description" name="description" />
        {E("description")}
      </div>

      <div className="space-y-1">
        <Label htmlFor="photos">Photos (max 4, JPG/PNG/WebP, 3 MB each)</Label>
        <Input
          id="photos"
          name="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="bg-orange-500 hover:bg-orange-600"
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit report
      </Button>
    </form>
  );
}
