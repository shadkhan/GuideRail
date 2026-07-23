// PIN tests (spec 007 R5). PBKDF2 hash/verify + the attempt lockout logic. Uses a
// low iteration count so the crypto is fast in tests (production uses 150k).

import { describe, it, expect } from "vitest";
import {
  MAX_ATTEMPTS,
  LOCKOUT_MS,
  hashPin,
  isLocked,
  isValidPin,
  registerFailure,
  resetLockout,
  verifyPin,
} from "./pin.js";

describe("isValidPin", () => {
  it("accepts 4–6 digits, rejects everything else", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("123456")).toBe(true);
    expect(isValidPin("123")).toBe(false); // too short
    expect(isValidPin("1234567")).toBe(false); // too long
    expect(isValidPin("12a4")).toBe(false); // non-digit
    expect(isValidPin("")).toBe(false);
  });
});

describe("hashPin / verifyPin (PBKDF2)", () => {
  it("verifies the correct PIN and rejects a wrong one", async () => {
    const record = await hashPin("1234", 1000);
    expect(await verifyPin("1234", record)).toBe(true);
    expect(await verifyPin("4321", record)).toBe(false);
  });
  it("never stores the PIN in plaintext (salted, unique per hash)", async () => {
    const a = await hashPin("1234", 1000);
    const b = await hashPin("1234", 1000);
    expect(a.hashB64).not.toContain("1234");
    expect(a.saltB64).not.toBe(b.saltB64); // random salt each time
    expect(a.hashB64).not.toBe(b.hashB64); // different salt → different hash
  });
});

describe("lockout after 5 failed attempts", () => {
  it("locks on the Nth failure and unlocks after the cooldown", () => {
    const now = 1_000_000;
    let lockout = resetLockout();
    for (let i = 0; i < MAX_ATTEMPTS - 1; i++) {
      lockout = registerFailure(lockout, now);
      expect(isLocked(lockout, now)).toBe(false); // not yet
    }
    lockout = registerFailure(lockout, now); // the 5th failure
    expect(isLocked(lockout, now)).toBe(true);
    expect(isLocked(lockout, now + LOCKOUT_MS - 1)).toBe(true); // still cooling down
    expect(isLocked(lockout, now + LOCKOUT_MS + 1)).toBe(false); // cooldown elapsed
  });
  it("resetLockout clears attempts and cooldown", () => {
    expect(isLocked(resetLockout(), Date.now())).toBe(false);
  });
});
