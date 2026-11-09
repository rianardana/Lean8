import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getWeeklyTargetData, upsertWeeklyTarget } from "@/lib/weekly-target";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (userId == null) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const weekStart = req.nextUrl.searchParams.get("weekStart") || undefined;
  try {
    return NextResponse.json(await getWeeklyTargetData(userId, weekStart));
  } catch (err) {
    console.error("weekly-target GET failed:", err);
    return NextResponse.json({ error: "Failed to load weekly target" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (userId == null) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const input = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    if (typeof input.reminderEnabled === "boolean") {
      await prisma.user.update({ where: { id: userId }, data: { weeklyReminderEnabled: input.reminderEnabled } });
    }
    const touchedTarget = ["workoutSessions", "fastSessions", "fastMinHours", "activeDays", "weekStart"].some(
      (k) => k in input
    );
    if (touchedTarget) {
      await upsertWeeklyTarget(userId, input);
    }
    return NextResponse.json(await getWeeklyTargetData(userId, typeof input.weekStart === "string" ? input.weekStart : undefined));
  } catch (err) {
    console.error("weekly-target POST failed:", err);
    return NextResponse.json({ error: "Failed to save weekly target" }, { status: 500 });
  }
}
