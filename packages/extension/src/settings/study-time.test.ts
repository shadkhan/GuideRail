// isStudyTime source-of-truth tests (spec 007 R2). Uses the mocked chrome.storage.

import { describe, it, expect } from "vitest";
import * as storage from "../storage.js";
import { DEFAULT_SCHEDULE, isStudyTime, localDateKey } from "./study-time.js";

// A Monday inside the default 09:00–15:00 window, and outside it.
const monInHours = new Date(2026, 6, 20, 10, 0); // Jul 20 2026 (Mon) 10:00
const monOutHours = new Date(2026, 6, 20, 16, 0); // Mon 16:00
const sunday = new Date(2026, 6, 19, 10, 0); // Sun 10:00 (no default window)

describe("isStudyTime (single source of truth)", () => {
  it("is true inside the default schedule window", async () => {
    await storage.set("config.studyHours", DEFAULT_SCHEDULE);
    expect(await isStudyTime(monInHours)).toBe(true);
  });
  it("is false outside the window", async () => {
    await storage.set("config.studyHours", DEFAULT_SCHEDULE);
    expect(await isStudyTime(monOutHours)).toBe(false);
  });
  it("is false on a weekend (no default window)", async () => {
    await storage.set("config.studyHours", DEFAULT_SCHEDULE);
    expect(await isStudyTime(sunday)).toBe(false);
  });
  it("is false when paused for today, even inside a window", async () => {
    await storage.set("config.studyHours", DEFAULT_SCHEDULE);
    await storage.set("config.pausedDate", localDateKey(monInHours));
    expect(await isStudyTime(monInHours)).toBe(false);
  });
  it("resumes the next day after a pause (pause is date-scoped)", async () => {
    await storage.set("config.studyHours", DEFAULT_SCHEDULE);
    await storage.set("config.pausedDate", localDateKey(monInHours));
    const nextDayInHours = new Date(2026, 6, 21, 10, 0); // Tue 10:00
    expect(await isStudyTime(nextDayInHours)).toBe(true);
  });
  it("is false when no schedule is set", async () => {
    expect(await isStudyTime(monInHours)).toBe(false);
  });
});
