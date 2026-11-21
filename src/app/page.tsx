import { redirect } from "next/navigation";
import { getSession } from "@/lib/permissions";

export default async function RootPage() {
  const session = await getSession();
  redirect(session?.user ? "/dashboard" : "/login");
}
