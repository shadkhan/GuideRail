// Study-time — THE single source of truth (spec 007 R2).
//
// Every policy path (worker pipeline, DNR reconcile, blur) asks this one function
// "is protection active right now?" instead of re-deriving it from the schedule.
// It folds in pause-for-today (spec 007 R3): a paused day is never study time.

import * as storage from "../storage.js";
import { isWithinWindow, type StudySchedule } from "../pipeline/study-hours.js";

/** Default schedule pre-filled at onboarding: Mon–Fri 09:00–15:00 (spec 007 R2). */
export const DEFAULT_SCHEDULE: StudySchedule = {
  1: [{ start: "09:00", end: "15:00" }],
  2: [{ start: "09:00", end: "15:00" }],
  3: [{ start: "09:00", end: "15:00" }],
  4: [{ start: "09:00", end: "15:00" }],
  5: [{ start: "09:00", end: "15:00" }],
};

/** Local calendar date `YYYY-MM-DD` (used for pause-for-today comparison). */
export function localDateKey(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Is protection active right now? False when paused for today, or outside every
 * study window. This is the ONLY place study-hours state is interpreted (R2).
 */
export async function isStudyTime(now: Date = new Date()): Promise<boolean> {
  const pausedDate = await storage.get("config.pausedDate");
  if (pausedDate === localDateKey(now)) return false;
  const schedule = (await storage.get("config.studyHours")) ?? {};
  return isWithinWindow(schedule, now);
}
