"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Loader2, Plus, Tag } from "lucide-react";
import { createExpenseCategory } from "@/actions/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CategoryForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [pending, start] = useTransition();

  // The success message disappears by itself
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 2000);
    return () => clearTimeout(t);
  }, [added]);

  const submit = () => {
    if (pending || !name.trim()) return;
    start(async () => {
      const r = await createExpenseCategory(name);
      if (!r.ok) {
        setAdded(false);
        return setError(r.error ?? "Failed");
      }
      setError("");
      setName("");
      setAdded(true);
    });
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <div className="relative">
          <Tag className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="New category"
            maxLength={40}
            aria-invalid={!!error}
            className={`h-9 w-48 pl-8 focus-visible:ring-orange-500/30 ${
              error ? "border-red-400" : ""
            }`}
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={pending || !name.trim()}
          onClick={submit}
          className="hover:border-orange-400 hover:text-orange-600"
        >
          {pending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-1.5 h-4 w-4" />
          )}
          Add category
        </Button>
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
      {added && !error && (
        <p className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Category added
        </p>
      )}
    </div>
  );
}
