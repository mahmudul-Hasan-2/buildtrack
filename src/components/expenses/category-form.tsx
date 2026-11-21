"use client";

import { useState, useTransition } from "react";
import { createExpenseCategory } from "@/actions/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CategoryForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category"
          className="h-9 w-44"
        />
        <Button
          size="sm"
          variant="outline"
          disabled={pending || !name.trim()}
          onClick={() =>
            start(async () => {
              const r = await createExpenseCategory(name);
              if (!r.ok) return setError(r.error ?? "Failed");
              setError("");
              setName("");
            })
          }
        >
          Add category
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
