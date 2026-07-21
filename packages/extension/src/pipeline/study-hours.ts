// Study-hours schedule (spec 004 R1 step 1, Q1 → per-weekday).
//
// A per-weekday schedule: each weekday carries zero or more time windows during
// which filtering is active. Outside every window the pipeline is a no-op and
// the gate-list DNR (declarativeNetRequest) rules are removed, so the browser is
// completely unrestricted. Times are local wall-clock "HH:MM" (24h); windows are
// same-day with start < end.
//
// This module is pure (no chrome.* / storage) so the window math is unit-tested
// directly. The service worker owns the storage read and the chrome.alarms that
// fire on the transitions this module computes.

/** "HH:MM", 24-hour local time. */
export type TimeHM = string;

/** A same-day active window; `end` is exclusive. */
export interface StudyWindow {
  start: TimeHM;
  end: TimeHM;
}

/** JS `Date.getDay()` value: 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Windows per weekday. A missing/empty weekday means "never active that day". */
export type StudySchedule = Partial<Record<Weekday, StudyWindow[]>>;

function parseHM(hm: TimeHM): { h: number; m: number } {
  const parts = hm.split(":");
  return {
    h: Number.parseInt(parts[0] ?? "0", 10),
    m: Number.parseInt(parts[1] ?? "0", 10),
  };
}

function hmToMinutes(hm: TimeHM): number {
  const { h, m } = parseHM(hm);
  return h * 60 + m;
}

/** True when `now` falls inside any window for its weekday. */
export function isWithinWindow(schedule: StudySchedule, now: Date): boolean {
  const windows = schedule[now.getDay() as Weekday] ?? [];
  const minutes = now.getHours() * 60 + now.getMinutes();
  return windows.some((w) => {
    const start = hmToMinutes(w.start);
    const end = hmToMinutes(w.end);
    return minutes >= start && minutes < end;
  });
}

/**
 * The next absolute time the within/outside state flips — used to arm a single
 * chrome.alarm. Scans window starts and ends across the next 7 days and returns
 * the earliest boundary strictly after `now`, or null if the schedule is empty
 * (nothing to arm; gating never turns on).
 */
export function nextTransition(schedule: StudySchedule, now: Date): Date | null {
  let best: Date | null = null;
  for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
    const day = new Date(now);
    day.setDate(now.getDate() + dayOffset);
    const windows = schedule[day.getDay() as Weekday] ?? [];
    for (const w of windows) {
      for (const hm of [w.start, w.end]) {
        const { h, m } = parseHM(hm);
        const boundary = new Date(day);
        boundary.setHours(h, m, 0, 0);
        if (boundary.getTime() > now.getTime() && (best === null || boundary < best)) {
          best = boundary;
        }
      }
    }
  }
  return best;
}
