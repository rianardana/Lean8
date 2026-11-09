"use client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function pushSupported() {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function getPushPermissionState(): Promise<NotificationPermission | "unsupported"> {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

async function postSubscription(body: unknown) {
  const { firebaseAuth } = await import("@/lib/firebase");
  const token = await firebaseAuth.currentUser?.getIdToken().catch(() => null);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch("/api/push/subscribe", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

export async function ensurePushSubscription(): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported()) return { ok: false, reason: "unsupported" };
  if (Notification.permission === "denied") return { ok: false, reason: "denied" };

  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: permission };

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    await postSubscription({ subscription: existing.toJSON() }).catch(() => {});
    return { ok: true };
  }

  const keyRes = await fetch("/api/push/vapid", { cache: "no-store" });
  const keyData = (await keyRes.json().catch(() => ({}))) as { publicKey?: string | null; configured?: boolean };
  if (!keyRes.ok || !keyData.publicKey) return { ok: false, reason: "vapid_missing" };

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
  });
  const saveRes = await postSubscription({ subscription: sub.toJSON() });
  if (!saveRes.ok) return { ok: false, reason: "save_failed" };
  return { ok: true };
}

export async function removePushSubscription(): Promise<{ ok: boolean }> {
  if (!pushSupported()) return { ok: true };
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await postSubscription({ endpoint: sub.endpoint, unsubscribe: true }).catch(() => {});
      await sub.unsubscribe().catch(() => {});
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function sendTestPush(): Promise<{ ok: boolean; status?: number; reason?: string }> {
  if (!pushSupported()) return { ok: false, reason: "unsupported" };
  const { firebaseAuth } = await import("@/lib/firebase");
  const token = await firebaseAuth.currentUser?.getIdToken().catch(() => null);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch("/api/push/test", { method: "POST", headers, cache: "no-store" });
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, status: res.status };
}
