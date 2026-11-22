"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Boxes,
  DollarSign,
  Loader2,
  PackageCheck,
  Save,
} from "lucide-react";
import { createMaterial, type MaterialState } from "@/actions/material";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const UNITS = ["bag", "kg", "pcs", "m", "ton", "sheet", "liter"];

const selectCls =
  "h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/30";

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base text-[#0B192C]">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100">
            <Icon className="h-4 w-4 text-orange-600" />
          </span>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function MaterialForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<MaterialState, FormData>(
    createMaterial,
    {},
  );
  const err = (k: string) => state.fieldErrors?.[k]?.[0];

  const E = (k: string) =>
    err(k) && (
      <p className="flex items-center gap-1 text-sm text-red-600">
        <AlertCircle className="h-3.5 w-3.5" />
        {err(k)}
      </p>
    );

  const field = (
    name: string,
    label: string,
    opts: { type?: string; placeholder?: string; hint?: string } = {},
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="font-medium text-slate-700">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={opts.type ?? "text"}
        step={opts.type === "number" ? "any" : undefined}
        min={opts.type === "number" ? 0 : undefined}
        placeholder={opts.placeholder}
        aria-invalid={!!err(name)}
        className={`h-10 focus-visible:ring-orange-500/30 ${
          err(name) ? "border-red-400" : ""
        }`}
      />
      {opts.hint && !err(name) && (
        <p className="text-xs text-slate-500">{opts.hint}</p>
      )}
      {E(name)}
    </div>
  );

  return (
    <form action={action} className="max-w-3xl space-y-5">
      {state.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      <Section
        icon={Boxes}
        title="Material details"
        description="Name, unique SKU and category."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {field("name", "Material name", {
            placeholder: "e.g. Portland Cement",
          })}
          {field("sku", "SKU", {
            placeholder: "MAT-0100",
            hint: "Must be unique",
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="categoryId" className="font-medium text-slate-700">
              Category
            </Label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue=""
              aria-invalid={!!err("categoryId")}
              className={`${selectCls} ${err("categoryId") ? "border-red-400" : ""}`}
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
          <div className="space-y-1.5">
            <Label htmlFor="unit" className="font-medium text-slate-700">
              Unit
            </Label>
            <Input
              id="unit"
              name="unit"
              list="unit-options"
              placeholder="bag, kg, pcs..."
              aria-invalid={!!err("unit")}
              className={`h-10 focus-visible:ring-orange-500/30 ${
                err("unit") ? "border-red-400" : ""
              }`}
            />
            <datalist id="unit-options">
              {UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
            {E("unit")}
          </div>
        </div>
      </Section>

      <Section
        icon={PackageCheck}
        title="Stock"
        description="Opening quantity and when to warn about low stock."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {field("availableQuantity", "Opening quantity", {
            type: "number",
            placeholder: "0",
            hint: "Recorded as the first stock entry",
          })}
          {field("lowStockThreshold", "Low-stock threshold", {
            type: "number",
            placeholder: "20",
            hint: "Admins are alerted at or below this level",
          })}
        </div>
      </Section>

      <Section
        icon={DollarSign}
        title="Pricing"
        description="Cost of one unit."
      >
        <div className="sm:max-w-xs">
          {field("unitPrice", "Unit price ($)", {
            type: "number",
            placeholder: "0.00",
          })}
        </div>
      </Section>

      <Card className="border-slate-200 shadow-sm">
        <CardFooter className="flex justify-end gap-3 py-4">
          <Button asChild type="button" variant="outline" disabled={pending}>
            <Link href="/materials">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={pending}
            className="bg-orange-500 font-semibold shadow-md shadow-orange-500/20 hover:bg-orange-600"
          >
            {pending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {pending ? "Saving..." : "Save material"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
