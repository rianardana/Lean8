import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { sendPushToUser, webPushConfigured } from "@/lib/server-push";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const userId = await getSessionUserId();
  if (userId == null) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!webPushConfigured()) return NextResponse.json({ error: "VAPID not configured" }, { status: 503 });

  const result = await sendPushToUser(userId, {
    title: "Lean Mode — Tes Notifikasi",
    body: "Push Android aktif. Getar/notif/suara mengikuti pengaturan perangkat & channel sistem.",
    url: "/",
    tag: "leanmode-test",
    renotify: true,
    requireInteraction: false,
    vibrate: [300, 120, 300, 120, 450],
    actions: [
      { action: "open", title: "Buka Lean Mode" },
      { action: "dismiss", title: "Tutup" },
    ],
  });

  return NextResponse.json(result);
}
