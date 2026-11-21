"use client";

import { useState, useTransition } from "react";
import { reviewRequest } from "@/actions/material";
import { Button } from "@/components/ui/button";

export function ReviewButtons({ id }: { id: string }) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const run = (d: "approve" | "reject") =>
    start(async () => {
      const r = await reviewRequest(id, d);
      setError(r.ok ? "" : (r.error ?? "Failed"));
    });

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run("approve")}
          className="bg-green-600 hover:bg-green-700"
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run("reject")}
        >
          Reject
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
