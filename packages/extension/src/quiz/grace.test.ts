import { describe, it, expect } from "vitest";
import { GRACE_LOCKOUT_MS } from "@guiderail/quiz-engine";
import { clearLockout, lockedUntil, startLockout } from "./grace.js";

describe("grace lockout (spec 005 R3)", () => {
  const now = 1_000_000;

  it("has no lockout initially", async () => {
    expect(await lockedUntil("netflix.com", now)).toBeNull();
  });

  it("locks for the grace window after a fail, then unlocks", async () => {
    const at = await startLockout("netflix.com", now);
    expect(at).toBe(now + GRACE_LOCKOUT_MS);
    expect(await lockedUntil("netflix.com", now + 1000)).toBe(at);
    // After the window, no longer locked.
    expect(await lockedUntil("netflix.com", at + 1)).toBeNull();
  });

  it("clears a lockout on a pass", async () => {
    await startLockout("netflix.com", now);
    await clearLockout("netflix.com");
    expect(await lockedUntil("netflix.com", now + 1000)).toBeNull();
  });
});
