import webpush from "web-push";
import { prisma } from "@/lib/prisma";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  image?: string;
  vibrate?: number[];
  renotify?: boolean;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  data?: Record<string, unknown>;
};

function getVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@leanmode.app";
  if (!publicKey || !privateKey) return null;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return { publicKey, subject };
}

export function webPushConfigured() {
  return !!(process.env.VAPID_PRIVATE_KEY && (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY));
}

export async function sendPushToUser(userId: number, payload: PushPayload) {
  if (!getVapid()) return { ok: false, sent: 0, removed: 0, reason: "vapid_missing" as const };
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return { ok: true, sent: 0, removed: 0, reason: "no_subscriptions" as const };

  // Android-maximized defaults (actual sound/vibe still governed by OS channel/DND)
  const fullPayload: PushPayload = {
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "leanmode-weekly-reminder",
    renotify: false,
    requireInteraction: false,
    silent: false,
    vibrate: [250, 120, 250, 120, 400],
    timestamp: Date.now(),
    actions: [
      { action: "open", title: "Buka Lean Mode" },
      { action: "dismiss", title: "Nanti" },
    ],
    ...payload,
    data: { url: payload.url || "/", ...(payload.data || {}) },
  };

  const body = JSON.stringify(fullPayload);
  let sent = 0;
  let removed = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        body,
        { TTL: 60 * 60 * 24, urgency: "high" }
      );
      sent += 1;
    } catch (err: any) {
      const status = err?.statusCode || err?.status;
      if (status === 404 || status === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        removed += 1;
      } else {
        console.error("webpush send failed", { userId, endpoint: sub.endpoint, status, message: err?.message });
      }
    }
  }

  return { ok: true, sent, removed };
}
