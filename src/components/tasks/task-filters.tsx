"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";

const STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const selectCls = "h-9 rounded-md border border-input bg-white px-3 text-sm";

export function TaskFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.set("page", "1");
    router.replace(`${pathname}?${next.toString()}`);
  };
  const onSearch = useDebouncedCallback((v: string) => update("q", v), 400);

  return (
    <div className="flex flex-col flex-wrap gap-3 sm:flex-row">
      <Input
        placeholder="Search tasks..."
        defaultValue={sp.get("q") ?? ""}
        onChange={(e) => onSearch(e.target.value)}
        className="sm:max-w-xs"
      />
      <select
        defaultValue={sp.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className={selectCls}
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ")}
          </option>
        ))}
      </select>
      <select
        defaultValue={sp.get("priority") ?? ""}
        onChange={(e) => update("priority", e.target.value)}
        className={selectCls}
      >
        <option value="">All priorities</option>
        {PRIORITIES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        defaultValue={sp.get("flag") ?? ""}
        onChange={(e) => update("flag", e.target.value)}
        className={selectCls}
      >
        <option value="">All tasks</option>
        <option value="overdue">Overdue only</option>
      </select>
      <select
        defaultValue={sp.get("sort") ?? "deadline"}
        onChange={(e) => update("sort", e.target.value)}
        className={selectCls}
      >
        <option value="deadline">Deadline (soonest)</option>
        <option value="priority">Priority</option>
        <option value="newest">Newest</option>
      </select>
    </div>
  );
}
