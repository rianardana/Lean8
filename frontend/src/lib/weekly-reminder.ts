import { WeeklyTargetData } from "@/types";
import { ensurePushSubscription, pushSupported } from "@/lib/push";

const LAST_KEY = "leanmode_weekly_reminder_last";

function canUseNotificationApi() {
  return typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted";
}

export async function maybeShowWeeklyReminder(data: WeeklyTargetData) {
  if (typeof window === "undefined") return;
  if (!data.reminderEnabled) return;

  // Ensure server push subscription is registered when possible (Android PWA path)
  if (pushSupported()) {
    ensurePushSubscription().catch(() => {});
  }

  if (!canUseNotificationApi()) return;

  const pending = (data.progress ?? []).filter((p) => !p.done);
  if (pending.length === 0) return;

  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem(LAST_KEY) === today) return; // max 1x/hari (in-app fallback)

  const body = pending.map((p) => `• ${p.label}: ${p.detail}`).join("\n");
  try {
    if (navigator.serviceWorker?.ready) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification("Target minggu ini belum selesai", {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "weekly-target-reminder-local",
        renotify: false,
        requireInteraction: pending.length >= 2,
        // Android-maximized options (actual sound/vibration follow OS channel + DND)
        vibrate: [250, 120, 250, 120, 400],
        data: { url: "/" },
        actions: [
          { action: "open", title: "Cek progres" },
          { action: "dismiss", title: "Nanti" },
        ],
      } as NotificationOptions);
    } else {
      new Notification("Target minggu ini belum selesai", { body, icon: "/icon-192.png" });
    }
    localStorage.setItem(LAST_KEY, today);
  } catch {
    /* permission/registration issues — ignore silently */
  }
}
