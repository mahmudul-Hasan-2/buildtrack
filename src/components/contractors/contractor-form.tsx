"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Star,
} from "lucide-react";
import type { ContractorState } from "@/actions/contractor";
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

type Defaults = {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  rating?: number;
};

const STATUSES = [
  {
    value: "ACTIVE",
    label: "Active",
    cls: "peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-700",
  },
  {
    value: "INACTIVE",
    label: "Inactive",
    cls: "peer-checked:border-slate-500 peer-checked:bg-slate-100 peer-checked:text-slate-700",
  },
  {
    value: "SUSPENDED",
    label: "Suspended",
    cls: "peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700",
  },
];

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

export function ContractorForm({
  action,
  defaults = {},
  isNew,
}: {
  action: (p: ContractorState, f: FormData) => Promise<ContractorState>;
  defaults?: Defaults;
  isNew: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [rating, setRating] = useState(defaults.rating ?? 3);
  const err = (k: string) => state.fieldErrors?.[k]?.[0];
  const E = (k: string) =>
    err(k) && (
      <p className="flex items-center gap-1 text-sm text-red-600">
        <AlertCircle className="h-3.5 w-3.5" />
        {err(k)}
      </p>
    );

  const field = (
    name: keyof Defaults,
    label: string,
    opts: { type?: string; placeholder?: string } = {},
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="font-medium text-slate-700">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={opts.type ?? "text"}
        placeholder={opts.placeholder}
        defaultValue={defaults[name] as string | number | undefined}
        aria-invalid={!!err(name)}
        className={`h-10 focus-visible:ring-orange-500/30 ${
          err(name) ? "border-red-400" : ""
        }`}
      />
      {E(name)}
    </div>
  );

  const currentStatus = defaults.status ?? "ACTIVE";

  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      {state.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      <Section
        icon={Building2}
        title="Company"
        description="Who the contractor is."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {field("companyName", "Company name", {
            placeholder: "e.g. Apex Builders Ltd.",
          })}
          {field("contactName", "Contact person", { placeholder: "Full name" })}
        </div>
        {field("address", "Address", {
          placeholder: "Street, city (optional)",
        })}
      </Section>

      <Section icon={Mail} title="Contact" description="How to reach them.">
        <div className="grid gap-4 sm:grid-cols-2">
          {isNew ? (
            field("email", "Email", {
              type: "email",
              placeholder: "name@company.com",
            })
          ) : (
            <div className="space-y-1.5">
              <Label className="font-medium text-slate-700">Email</Label>
              <p className="flex h-10 items-center gap-2 rounded-md border bg-slate-50 px-3 text-sm text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                {defaults.email}
              </p>
              <p className="text-xs text-slate-500">Email cannot be changed.</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label
              htmlFor="phone"
              className="flex items-center gap-1.5 font-medium text-slate-700"
            >
              <Phone className="h-4 w-4 text-slate-500" />
              Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              placeholder="+8801XXXXXXXXX"
              defaultValue={defaults.phone}
              aria-invalid={!!err("phone")}
              className={`h-10 focus-visible:ring-orange-500/30 ${
                err("phone") ? "border-red-400" : ""
              }`}
            />
            {E("phone")}
          </div>
        </div>
      </Section>

      <Section
        icon={ShieldCheck}
        title="Status and performance"
        description="Availability and quality rating."
      >
        <div className="space-y-1.5">
          <Label className="font-medium text-slate-700">Status</Label>
          <div className="grid grid-cols-3 gap-2">
            {STATUSES.map((s) => (
              <label key={s.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={s.value}
                  defaultChecked={currentStatus === s.value}
                  className="peer sr-only"
                />
                <span
                  className={`block rounded-md border border-slate-200 bg-white px-3 py-2 text-center text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500/40 ${s.cls}`}
                >
                  {s.label}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Only Active contractors can be assigned to projects.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="rating"
              className="flex items-center gap-1.5 font-medium text-slate-700"
            >
              <Star className="h-4 w-4 text-orange-500" />
              Performance rating
            </Label>
            <span className="text-sm font-semibold text-orange-600">
              {rating.toFixed(1)} / 5
            </span>
          </div>
          <input
            id="rating"
            name="rating"
            type="range"
            min={0}
            max={5}
            step={0.1}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-orange-500"
          />
          {E("rating")}
        </div>
      </Section>

      <Card className="border-slate-200 shadow-sm">
        <CardFooter className="flex justify-end gap-3 py-4">
          <Button asChild type="button" variant="outline" disabled={pending}>
            <Link href="/contractors">Cancel</Link>
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
            {pending ? "Saving..." : "Save contractor"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
