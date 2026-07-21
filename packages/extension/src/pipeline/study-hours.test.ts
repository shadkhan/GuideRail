// Study-hours schedule tests (spec 004 R1/Q1).

import { describe, it, expect } from "vitest";
import { isWithinWindow, nextTransition, type StudySchedule } from "./study-hours.js";

// Anchor on a concrete local date; key the schedule by that date's weekday so
// the tests are independent of which day they run on.
const day = new Date(2026, 6, 20, 17, 0, 0); // Jul 20 2026, 17:00 local
const schedule: StudySchedule = { [day.getDay()]: [{ start: "16:00", end: "19:00" }] };

describe("isWithinWindow", () => {
  it("is true inside a window", () => {
    expect(isWithinWindow(schedule, new Date(2026, 6, 20, 17, 0))).toBe(true);
  });
  it("is false before the window", () => {
    expect(isWithinWindow(schedule, new Date(2026, 6, 20, 15, 59))).toBe(false);
  });
  it("is false at the exclusive end", () => {
    expect(isWithinWindow(schedule, new Date(2026, 6, 20, 19, 0))).toBe(false);
  });
  it("is false on a day with no windows", () => {
    // A different weekday than the scheduled one.
    const otherDay = new Date(2026, 6, 21, 17, 0); // next day
    if (otherDay.getDay() !== day.getDay()) {
      expect(isWithinWindow(schedule, otherDay)).toBe(false);
    }
  });
  it("is false for an empty schedule", () => {
    expect(isWithinWindow({}, day)).toBe(false);
  });
});

describe("nextTransition", () => {
  it("returns the window start when before it", () => {
    const next = nextTransition(schedule, new Date(2026, 6, 20, 15, 0));
    expect(next?.getHours()).toBe(16);
    expect(next?.getMinutes()).toBe(0);
  });
  it("returns the window end when inside it", () => {
    const next = nextTransition(schedule, new Date(2026, 6, 20, 17, 0));
    expect(next?.getHours()).toBe(19);
  });
  it("returns null for an empty schedule", () => {
    expect(nextTransition({}, day)).toBeNull();
  });
});
