"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";

type Select = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

const selectCls = "h-9 rounded-md border border-input bg-white px-3 text-sm";

export function ListFilters({
  placeholder,
  selects = [],
  dates = false,
}: {
  placeholder: string;
  selects?: Select[];
  dates?: boolean;
}) {
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
        placeholder={placeholder}
        defaultValue={sp.get("q") ?? ""}
        onChange={(e) => onSearch(e.target.value)}
        className="sm:max-w-xs"
      />
      {selects.map((s) => (
        <select
          key={s.key}
          defaultValue={sp.get(s.key) ?? ""}
          onChange={(e) => update(s.key, e.target.value)}
          className={selectCls}
        >
          <option value="">{s.label}</option>
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
      {dates && (
        <>
          <Input
            type="date"
            defaultValue={sp.get("from") ?? ""}
            onChange={(e) => update("from", e.target.value)}
            className="sm:w-40"
          />
          <Input
            type="date"
            defaultValue={sp.get("to") ?? ""}
            onChange={(e) => update("to", e.target.value)}
            className="sm:w-40"
          />
        </>
      )}
    </div>
  );
}
