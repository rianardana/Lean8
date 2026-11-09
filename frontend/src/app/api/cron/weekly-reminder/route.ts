import { NextRequest, NextResponse } from "next/server";
import { runScheduledNotifications } from "@/lib/schedule-notifications";

export const dynamic = "force-dynamic";

// Legacy path kept for compatibility; delegates to unified scheduler (weekly included, deduped).
function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${secret}`) return true;
  const q = req.nextUrl.searchParams.get("secret");
  return !!q && q === secret;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await runScheduledNotifications({ includeWeekly: true }));
  } catch (err) {
    console.error("weekly-reminder cron failed:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
