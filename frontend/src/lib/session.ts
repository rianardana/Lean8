import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getSessionUserId(): Promise<number | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return Number(session.user.id);
}
