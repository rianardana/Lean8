import { prisma } from "@/lib/prisma";
import { sendPushToUser, webPushConfigured } from "@/lib/server-push";
import { minutesOfDay, parseHHMM, wibDate, wibHourMinute } from "@/lib/time";

type RunStats = {
  ok: boolean;
  nowWib: string;
  checked: { fastEnd: number; workout: number; sleep: number; weekly: number };
  sent: number;
  skipped: number;
  removedSubs: number;
  errors: number;
  details: Array<Record<string, unknown>>;
};

function inWindow(scheduledMin: number, nowMin: number, windowMinutes = 59) {
  const diff = nowMin - scheduledMin;
  return diff >= 0 && diff <= windowMinutes;
}

async function alreadySent(userId: number, kind: string, refKey: string) {
  const hit = await prisma.notificationLog.findUnique({
    where: { userId_kind_refKey: { userId, kind, refKey } },
    select: { id: true },
  });
  return !!hit;
}

async function markSent(userId: number, kind: string, refKey: string) {
  try {
    await prisma.notificationLog.create({ data: { userId, kind, refKey } });
    return true;
  } catch {
    return false; // duplicate race - treat as sent
  }
}

export async function runScheduledNotifications(options?: { includeWeekly?: boolean }): Promise<RunStats> {
  const includeWeekly = options?.includeWeekly !== false;
  const now = wibHourMinute();
  const nowMin = minutesOfDay(now.hour, now.minute);
  const stats: RunStats = {
    ok: webPushConfigured(),
    nowWib: `${now.date} ${String(now.hour).padStart(2, "0")}:${String(now.minute).padStart(2, "0")}`,
    checked: { fastEnd: 0, workout: 0, sleep: 0, weekly: 0 },
    sent: 0,
    skipped: 0,
    removedSubs: 0,
    errors: 0,
    details: [],
  };

  if (!webPushConfigured()) return stats;

  // 1) Buka puasa: active fast whose planned end is now/passed (and still active)
  const activeFasts = await prisma.fast.findMany({
    where: { endedAt: null, user: { fastReminderEnabled: true, pushSubscriptions: { some: {} } } },
    select: { id: true, userId: true, startedAt: true, planHours: true },
  });
  for (const f of activeFasts) {
    stats.checked.fastEnd += 1;
    try {
      const endAt = new Date(f.startedAt.getTime() + f.planHours * 3600_000);
      if (Date.now() < endAt.getTime()) {
        stats.skipped += 1;
        continue;
      }
      // only nudge within 12h after planned end to avoid blasting very old sessions
      if (Date.now() - endAt.getTime() > 12 * 3600_000) {
        stats.skipped += 1;
        continue;
      }
      const refKey = `fast:${f.id}`;
      if (await alreadySent(f.userId, "fast_end", refKey)) {
        stats.skipped += 1;
        continue;
      }
      const r = await sendPushToUser(f.userId, {
        title: "Waktunya buka puasa",
        body: `Target puasa ${f.planHours} jam sudah tercapai. Buka puasa dengan ringan & terhidrasi ya.`,
        url: "/",
        tag: `leanmode-fast-end-${f.id}`,
        renotify: true,
        requireInteraction: true,
        vibrate: [300, 120, 300, 120, 500],
        actions: [
          { action: "open", title: "Buka Lean Mode" },
          { action: "dismiss", title: "Nanti" },
        ],
        data: { kind: "fast_end", fastId: f.id },
      });
      await markSent(f.userId, "fast_end", refKey);
      stats.sent += r.sent;
      stats.removedSubs += r.removed;
      stats.details.push({ kind: "fast_end", userId: f.userId, fastId: f.id, sent: r.sent });
    } catch (err) {
      console.error("fast_end notify failed", f.id, err);
      stats.errors += 1;
    }
  }

  // 2) Workout reminder (daily at workoutTime, skip if workout already logged today)
  const workoutUsers = await prisma.user.findMany({
    where: { workoutReminderEnabled: true, pushSubscriptions: { some: {} }, workoutTime: { not: null } },
    select: { id: true, workoutTime: true, workoutLogs: { where: { date: now.date }, select: { id: true }, take: 1 } },
  });
  for (const u of workoutUsers) {
    stats.checked.workout += 1;
    try {
      const hm = parseHHMM(u.workoutTime);
      if (!hm) { stats.skipped += 1; continue; }
      if (!inWindow(minutesOfDay(hm.hour, hm.minute), nowMin)) { stats.skipped += 1; continue; }
      if (u.workoutLogs.length > 0) { stats.skipped += 1; continue; } // already worked out today
      const refKey = `workout:${now.date}`;
      if (await alreadySent(u.id, "workout", refKey)) { stats.skipped += 1; continue; }
      const r = await sendPushToUser(u.id, {
        title: "Waktunya workout",
        body: `Jadwal latihanmu ${u.workoutTime} WIB. Mulai ringan juga tetap progres.`,
        url: "/",
        tag: `leanmode-workout-${now.date}`,
        renotify: false,
        requireInteraction: false,
        vibrate: [220, 100, 220],
        actions: [
          { action: "open", title: "Buka Lean Mode" },
          { action: "dismiss", title: "Lewati" },
        ],
        data: { kind: "workout", date: now.date },
      });
      await markSent(u.id, "workout", refKey);
      stats.sent += r.sent;
      stats.removedSubs += r.removed;
      stats.details.push({ kind: "workout", userId: u.id, sent: r.sent });
    } catch (err) {
      console.error("workout notify failed", u.id, err);
      stats.errors += 1;
    }
  }

  // 3) Sleep reminder (daily at sleepTime, skip if sleepCompleted today)
  const sleepUsers = await prisma.user.findMany({
    where: { sleepReminderEnabled: true, pushSubscriptions: { some: {} }, sleepTime: { not: null } },
    select: { id: true, sleepTime: true, dailyLogs: { where: { date: now.date }, select: { sleepCompleted: true }, take: 1 } },
  });
  for (const u of sleepUsers) {
    stats.checked.sleep += 1;
    try {
      const hm = parseHHMM(u.sleepTime);
      if (!hm) { stats.skipped += 1; continue; }
      if (!inWindow(minutesOfDay(hm.hour, hm.minute), nowMin)) { stats.skipped += 1; continue; }
      if (u.dailyLogs[0]?.sleepCompleted) { stats.skipped += 1; continue; }
      const refKey = `sleep:${now.date}`;
      if (await alreadySent(u.id, "sleep", refKey)) { stats.skipped += 1; continue; }
      const r = await sendPushToUser(u.id, {
        title: "Waktunya tidur",
        body: `Jadwal tidurmu ${u.sleepTime} WIB. Recovery bagus bantu progres & energi besok.`,
        url: "/",
        tag: `leanmode-sleep-${now.date}`,
        renotify: false,
        requireInteraction: false,
        vibrate: [180, 80, 180],
        actions: [
          { action: "open", title: "Buka Lean Mode" },
          { action: "dismiss", title: "Nanti" },
        ],
        data: { kind: "sleep", date: now.date },
      });
      await markSent(u.id, "sleep", refKey);
      stats.sent += r.sent;
      stats.removedSubs += r.removed;
      stats.details.push({ kind: "sleep", userId: u.id, sent: r.sent });
    } catch (err) {
      console.error("sleep notify failed", u.id, err);
      stats.errors += 1;
    }
  }

  // 4) Weekly target reminder (optional; deduped daily) — keeps existing behavior alive via same runner
  if (includeWeekly) {
    const { getWeeklyTargetData } = await import("@/lib/weekly-target");
    const weeklyUsers = await prisma.user.findMany({
      where: { weeklyReminderEnabled: true, pushSubscriptions: { some: {} } },
      select: { id: true },
    });
    // Send once/day around 19:00 WIB (window) to avoid depending on old cron time
    const weeklyWindow = inWindow(minutesOfDay(19, 0), nowMin);
    for (const u of weeklyUsers) {
      stats.checked.weekly += 1;
      try {
        if (!weeklyWindow) { stats.skipped += 1; continue; }
        const refKey = `weekly:${now.date}`;
        if (await alreadySent(u.id, "weekly", refKey)) { stats.skipped += 1; continue; }
        const data = await getWeeklyTargetData(u.id);
        const pending = (data.progress ?? []).filter((p) => !p.done);
        if (pending.length === 0) { await markSent(u.id, "weekly", refKey); stats.skipped += 1; continue; }
        const top = pending.slice(0, 3).map((p) => `• ${p.label}: ${p.detail}`).join("\n");
        const more = pending.length > 3 ? `\n+${pending.length - 3} target lainnya` : "";
        const r = await sendPushToUser(u.id, {
          title: "Target minggu ini belum selesai",
          body: `${top}${more}`,
          url: "/",
          tag: `leanmode-weekly-reminder-${now.date}`,
          renotify: false,
          requireInteraction: pending.length >= 2,
          vibrate: [250, 120, 250, 120, 400],
          actions: [
            { action: "open", title: "Cek progres" },
            { action: "dismiss", title: "Nanti" },
          ],
          data: { kind: "weekly", date: now.date, pending: pending.length },
        });
        await markSent(u.id, "weekly", refKey);
        stats.sent += r.sent;
        stats.removedSubs += r.removed;
        stats.details.push({ kind: "weekly", userId: u.id, sent: r.sent, pending: pending.length });
      } catch (err) {
        console.error("weekly notify failed", u.id, err);
        stats.errors += 1;
      }
    }
  }

  return stats;
}
