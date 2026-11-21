"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { createMaterial, type MaterialState } from "@/actions/material";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MaterialForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<MaterialState, FormData>(
    createMaterial,
    {},
  );
  const E = (k: string) =>
    state.fieldErrors?.[k]?.[0] && (
      <p className="text-sm text-red-600">{state.fieldErrors[k]![0]}</p>
    );
  const field = (name: string, label: string, type = "text") => (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        step={type === "number" ? "any" : undefined}
      />
      {E(name)}
    </div>
  );

  return (
    <form action={action} className="max-w-2xl space-y-4">
      {state.error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", "Material name")}
        {field("sku", "SKU (e.g. MAT-0100)")}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue=""
            className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
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
        {field("unit", "Unit (bag, kg, pcs...)")}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {field("availableQuantity", "Opening quantity", "number")}
        {field("lowStockThreshold", "Low-stock threshold", "number")}
        {field("unitPrice", "Unit price", "number")}
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="bg-orange-500 hover:bg-orange-600"
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save material
      </Button>
    </form>
  );
}
