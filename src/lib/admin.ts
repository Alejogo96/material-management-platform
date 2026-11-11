import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export async function requireAdminPage() {
  const u = await getCurrentUser();
  if (!u) redirect("/entrar");
  return u;
}
