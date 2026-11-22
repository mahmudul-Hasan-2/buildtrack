"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  ImagePlus,
  Loader2,
  Send,
  TrendingUp,
} from "lucide-react";
import { submitProgress, type ProgressState } from "@/actions/progress";
import { Button } from "@/components/ui/button";
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

const MAX_FILES = 4;
const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setProgress(0);
      setFiles([]);
    }
  }, [state]);

  // Object URLs for previews, released when the selection changes
  const previews = useMemo(
    () => files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    [files],
  );
  useEffect(
    () => () => previews.forEach((p) => URL.revokeObjectURL(p.url)),
    [previews],
  );

  const onFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    setFileError("");
    if (picked.length > MAX_FILES) {
      setFileError(`You can upload at most ${MAX_FILES} photos`);
    } else if (picked.some((f) => !ALLOWED.includes(f.type))) {
      setFileError("Only JPG, PNG or WebP images are allowed");
    } else if (picked.some((f) => f.size > MAX_BYTES)) {
      setFileError("Each photo must be 3 MB or smaller");
    } else {
      setFiles(picked);
      return;
    }
    // Invalid selection: clear it so it is never submitted
    if (fileRef.current) fileRef.current.value = "";
    setFiles([]);
  };

  const err = (k: string) => state.fieldErrors?.[k]?.[0];
  const E = (k: string) =>
    err(k) && (
      <p className="flex items-center gap-1 text-sm text-red-600">
        <AlertCircle className="h-3.5 w-3.5" />
        {err(k)}
      </p>
    );

  return (
    <form ref={ref} action={action} className="max-w-3xl space-y-5">
      {state.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          Progress report submitted.
        </div>
      )}

      <Section
        icon={ClipboardList}
        title="Task"
        description="Which task are you reporting on?"
      >
        <div className="space-y-1.5">
          <Label htmlFor="taskId" className="font-medium text-slate-700">
            Task
          </Label>
          <select
            id="taskId"
            name="taskId"
            defaultValue={defaultTaskId ?? ""}
            aria-invalid={!!err("taskId")}
            className={`${selectCls} ${err("taskId") ? "border-red-400" : ""}`}
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
      </Section>

      <Section
        icon={TrendingUp}
        title="Progress and work done"
        description="Current completion and a short description."
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="progress" className="font-medium text-slate-700">
              Progress
            </Label>
            <span className="text-sm font-semibold text-orange-600">
              {progress}%
            </span>
          </div>
          <input
            id="progress"
            name="progress"
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-orange-500"
          />
          {E("progress")}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description" className="font-medium text-slate-700">
            Work description
          </Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            placeholder="What was done today? Any issues or delays?"
            aria-invalid={!!err("description")}
            className={`focus-visible:ring-orange-500/30 ${
              err("description") ? "border-red-400" : ""
            }`}
          />
          {E("description")}
        </div>
      </Section>

      <Section
        icon={ImagePlus}
        title="Photos"
        description="Up to 4 images (JPG, PNG or WebP), 3 MB each."
      >
        <input
          ref={fileRef}
          id="photos"
          name="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => onFiles(e.target.files)}
          className="block w-full cursor-pointer rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-orange-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-orange-600"
        />
        {fileError && (
          <p className="flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />
            {fileError}
          </p>
        )}
        {previews.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {previews.map((p) => (
              <div
                key={p.url}
                className="overflow-hidden rounded-lg border border-slate-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.name}
                  className="h-24 w-full object-cover"
                />
                <p className="truncate px-2 py-1 text-xs text-slate-500">
                  {p.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Card className="border-slate-200 shadow-sm">
        <CardFooter className="flex justify-end gap-3 py-4">
          <Button asChild type="button" variant="outline" disabled={pending}>
            <Link href="/progress">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={pending}
            className="bg-orange-500 font-semibold shadow-md shadow-orange-500/20 hover:bg-orange-600"
          >
            {pending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {pending ? "Submitting..." : "Submit report"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
