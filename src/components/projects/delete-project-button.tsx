"use client";

import { deleteProject } from "@/actions/project";
import { Button } from "@/components/ui/button";

export function DeleteProjectButton({ id }: { id: string }) {
  return (
    <form
      action={deleteProject.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm("Delete this project?")) e.preventDefault();
      }}
    >
      <Button type="submit" variant="destructive" size="sm">
        Delete
      </Button>
    </form>
  );
}
