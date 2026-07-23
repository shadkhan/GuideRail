import { describe, it, expect } from "vitest";
import { advance, back, initialOnboarding, isComplete } from "./onboarding.js";

describe("onboarding state machine (spec 007 R1)", () => {
  it("starts at the PIN step, not complete", () => {
    const s = initialOnboarding();
    expect(s.step).toBe("pin");
    expect(isComplete(s)).toBe(false);
  });

  it("advances through all steps to done", () => {
    let s = initialOnboarding();
    s = advance(s); // pin → child
    expect(s.step).toBe("child");
    s = advance(s); // child → hours
    s = advance(s); // hours → rules
    expect(s.step).toBe("rules");
    s = advance(s); // rules → done
    expect(isComplete(s)).toBe(true);
    expect(s.completed).toEqual(["pin", "child", "hours", "rules"]);
  });

  it("resumes from an abandoned mid-run state", () => {
    // Simulate storage returning a half-finished onboarding.
    const abandoned = { step: "hours" as const, completed: ["pin", "child"] as const };
    const s = advance({ ...abandoned, completed: [...abandoned.completed] });
    expect(s.step).toBe("rules");
    expect(s.completed).toContain("hours");
  });

  it("can step back but never before the first step", () => {
    let s = advance(initialOnboarding()); // at child
    s = back(s);
    expect(s.step).toBe("pin");
    expect(back(s).step).toBe("pin"); // no-op at the first step
  });

  it("advance is a no-op at done", () => {
    const done = { step: "done" as const, completed: [] };
    expect(advance(done)).toEqual(done);
  });
});
