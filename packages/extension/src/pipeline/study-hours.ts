// Study-hours schedule (spec 004 R1 step 1, Q1 → per-weekday).
//
// A per-weekday schedule: each weekday carries zero or more time windows during
// which filtering is active. Outside every window the pipeline is a no-op and
// the gate-list DNR (declarativeNetRequest) rules are removed, so the browser is
// completely unrestricted. Times are local wall-clock "HH:MM" (24h). A window
// with `end <= start` SPANS MIDNIGHT — e.g. {start:"22:00", end:"02:00"} is
// active from 22:00 that day until 02:00 the next (spec 007 R2).
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

/** Does `w` cover minute-of-day `m` on the SAME day it starts?
 *  Normal window: [start, end). Midnight-spanning: the evening part [start, 1440). */
function coversSameDay(w: StudyWindow, m: number): boolean {
  const start = hmToMinutes(w.start);
  const end = hmToMinutes(w.end);
  if (start === end) return false; // degenerate/empty window
  if (start < end) return m >= start && m < end; // normal
  return m >= start; // spanning: the part before midnight
}

/** For a midnight-spanning window, does its MORNING spill [0, end) cover `m`? */
function coversNextDaySpill(w: StudyWindow, m: number): boolean {
  const start = hmToMinutes(w.start);
  const end = hmToMinutes(w.end);
  if (start <= end) return false; // not spanning
  return m < end;
}

/** True when `now` falls inside any window — including a spanning window that
 *  started the previous day and spills past midnight into today. */
export function isWithinWindow(schedule: StudySchedule, now: Date): boolean {
  const day = now.getDay() as Weekday;
  const minutes = now.getHours() * 60 + now.getMinutes();

  const today = schedule[day] ?? [];
  if (today.some((w) => coversSameDay(w, minutes))) return true;

  // A spanning window on YESTERDAY may still be active in the early morning.
  const yesterday = schedule[((day + 6) % 7) as Weekday] ?? [];
  return yesterday.some((w) => coversNextDaySpill(w, minutes));
}

/**
 * The next absolute time the within/outside state flips — used to arm a single
 * chrome.alarm. Scans window starts and ends across the next 7 days and returns
 * the earliest boundary strictly after `now`, or null if the schedule is empty
 * (nothing to arm; gating never turns on).
 */
export function nextTransition(schedule: StudySchedule, now: Date): Date | null {
  let best: Date | null = null;
  const consider = (d: Date): void => {
    if (d.getTime() > now.getTime() && (best === null || d < best)) best = d;
  };
  for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
    const day = new Date(now);
    day.setDate(now.getDate() + dayOffset);
    const windows = schedule[day.getDay() as Weekday] ?? [];
    for (const w of windows) {
      if (hmToMinutes(w.start) === hmToMinutes(w.end)) continue; // degenerate
      const startAt = new Date(day);
      startAt.setHours(parseHM(w.start).h, parseHM(w.start).m, 0, 0);
      consider(startAt);

      const endAt = new Date(day);
      endAt.setHours(parseHM(w.end).h, parseHM(w.end).m, 0, 0);
      // A spanning window (end <= start) ends the FOLLOWING day.
      if (hmToMinutes(w.end) <= hmToMinutes(w.start)) endAt.setDate(endAt.getDate() + 1);
      consider(endAt);
    }
  }
  return best;
}
