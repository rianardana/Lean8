import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const userId = await getSessionUserId();
    return NextResponse.json({ ok: true, userId });
  } catch (err) {
    console.error("AUTH DEBUG FAILED:", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined }, { status: 500 });
  }
}
