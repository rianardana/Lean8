import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SubBody = {
  subscription?: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  endpoint?: string;
  unsubscribe?: boolean;
};

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (userId == null) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as SubBody;
  const ua = req.headers.get("user-agent") || undefined;

  try {
    if (body.unsubscribe && body.endpoint) {
      await prisma.pushSubscription.deleteMany({ where: { userId, endpoint: body.endpoint } });
      return NextResponse.json({ ok: true, removed: true });
    }

    const sub = body.subscription;
    const endpoint = sub?.endpoint;
    const p256dh = sub?.keys?.p256dh;
    const auth = sub?.keys?.auth;
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    // endpoint is unique globally; upsert by endpoint and bind to current user
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId, p256dh, auth, userAgent: ua },
      create: { userId, endpoint, p256dh, auth, userAgent: ua },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("push subscribe failed:", err);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (userId == null) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const endpoint = req.nextUrl.searchParams.get("endpoint");
  try {
    if (endpoint) {
      await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
    } else {
      await prisma.pushSubscription.deleteMany({ where: { userId } });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("push unsubscribe failed:", err);
    return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
  }
}
