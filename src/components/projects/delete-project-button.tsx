"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProject } from "@/actions/project";

export function DeleteProjectButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!confirm("Delete this project?")) return;

    startTransition(async () => {
      const res = await deleteProject(id);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Project deleted successfully");
        router.push("/projects");
        router.refresh();
      }
    });
  };

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={handleDelete}
    >
      {isPending ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="mr-1.5 h-4 w-4" />
      )}
      Delete
    </Button>
  );
}
