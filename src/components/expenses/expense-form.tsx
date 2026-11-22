"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  FileText,
  Loader2,
  Receipt,
  Save,
  Wallet,
} from "lucide-react";
import { createExpense, type ExpenseState } from "@/actions/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Opt = { id: string; name: string };

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
  const err = (k: string) => state.fieldErrors?.[k]?.[0];
  const E = (k: string) =>
    err(k) && (
      <p className="flex items-center gap-1 text-sm text-red-600">
        <AlertCircle className="h-3.5 w-3.5" />
        {err(k)}
      </p>
    );
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="max-w-3xl space-y-5">
      {state.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      <Section
        icon={FileText}
        title="Expense details"
        description="What was paid for and where it belongs."
      >
        <div className="space-y-1.5">
          <Label htmlFor="title" className="font-medium text-slate-700">
            Title
          </Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g. Cement purchase"
            aria-invalid={!!err("title")}
            className={`h-10 focus-visible:ring-orange-500/30 ${
              err("title") ? "border-red-400" : ""
            }`}
          />
          {E("title")}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="projectId" className="font-medium text-slate-700">
              Project
            </Label>
            <select
              id="projectId"
              name="projectId"
              defaultValue=""
              aria-invalid={!!err("projectId")}
              className={`${selectCls} ${err("projectId") ? "border-red-400" : ""}`}
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
        </div>
      </Section>

      <Section
        icon={Wallet}
        title="Amount and date"
        description="How much was spent and when."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="font-medium text-slate-700">
              Amount
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                $
              </span>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                aria-invalid={!!err("amount")}
                className={`h-10 pl-7 focus-visible:ring-orange-500/30 ${
                  err("amount") ? "border-red-400" : ""
                }`}
              />
            </div>
            {E("amount")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date" className="font-medium text-slate-700">
              Date
            </Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={today}
              aria-invalid={!!err("date")}
              className={`h-10 focus-visible:ring-orange-500/30 ${
                err("date") ? "border-red-400" : ""
              }`}
            />
            {E("date")}
          </div>
        </div>
      </Section>

      <Section
        icon={Receipt}
        title="Notes"
        description="Optional extra information."
      >
        <div className="space-y-1.5">
          <Label htmlFor="description" className="font-medium text-slate-700">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Invoice number, supplier, remarks..."
            className="focus-visible:ring-orange-500/30"
          />
        </div>
      </Section>

      <Card className="border-slate-200 shadow-sm">
        <CardFooter className="flex justify-end gap-3 py-4">
          <Button asChild type="button" variant="outline" disabled={pending}>
            <Link href="/expenses">Cancel</Link>
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
            {pending ? "Saving..." : "Save expense"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
