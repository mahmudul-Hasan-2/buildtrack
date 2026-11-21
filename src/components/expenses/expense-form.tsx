"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { createExpense, type ExpenseState } from "@/actions/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Opt = { id: string; name: string };
const selectCls =
  "h-9 w-full rounded-md border border-input bg-white px-3 text-sm";

export function ExpenseForm({
  projects,
  categories,
}: {
  projects: Opt[];
  categories: Opt[];
}) {
  const [state, action, pending] = useActionState<ExpenseState, FormData>(
    createExpense,
    {},
  );
  const E = (k: string) =>
    state.fieldErrors?.[k]?.[0] && (
      <p className="text-sm text-red-600">{state.fieldErrors[k]![0]}</p>
    );

  return (
    <form action={action} className="max-w-2xl space-y-4">
      {state.error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="space-y-1">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" />
        {E("title")}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="projectId">Project</Label>
          <select
            id="projectId"
            name="projectId"
            className={selectCls}
            defaultValue=""
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
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            name="categoryId"
            className={selectCls}
            defaultValue=""
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {E("categoryId")}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" name="amount" type="number" step="0.01" />
          {E("amount")}
        </div>
        <div className="space-y-1">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" />
          {E("date")}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="bg-orange-500 hover:bg-orange-600"
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save expense
      </Button>
    </form>
  );
}
