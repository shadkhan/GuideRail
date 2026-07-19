import { describe, it, expect } from "vitest";
import { DNR_RANGES, DNR_RULES, earnedTimeAllowRuleId } from "./registry.js";

describe("DNR rule registry (R7)", () => {
  it("allocates earned-time IDs from the session range", () => {
    expect(earnedTimeAllowRuleId(0)).toBe(DNR_RANGES.SESSION_EARNED_TIME.start);
    expect(earnedTimeAllowRuleId(5)).toBe(DNR_RANGES.SESSION_EARNED_TIME.start + 5);
    expect(earnedTimeAllowRuleId(DNR_RULES.EARNED_TIME_ALLOW.end - DNR_RULES.EARNED_TIME_ALLOW.start)).toBe(
      DNR_RANGES.SESSION_EARNED_TIME.end,
    );
  });

  it("rejects invalid or out-of-range slots", () => {
    expect(() => earnedTimeAllowRuleId(-1)).toThrow(RangeError);
    expect(() => earnedTimeAllowRuleId(1.5)).toThrow(RangeError);
    expect(() => earnedTimeAllowRuleId(1_000_000)).toThrow(RangeError);
  });

  it("keeps the three ID ranges non-overlapping", () => {
    expect(DNR_RANGES.STATIC.end).toBeLessThan(DNR_RANGES.DYNAMIC_QUIZ_GATE.start);
    expect(DNR_RANGES.DYNAMIC_QUIZ_GATE.end).toBeLessThan(DNR_RANGES.SESSION_EARNED_TIME.start);
  });
});
