import { describe, it, expect } from "vitest";
import { isValid, mintToken, remainingMinutes, remainingMs } from "./token.js";

describe("earned-time token", () => {
  const now = 1_000_000;
  const token = mintToken("youtube.com", now, 30 * 60_000);

  it("mints a token with the right window", () => {
    expect(token).toMatchObject({ scope: "youtube.com", grantedAt: now });
    expect(token.expiresAt).toBe(now + 30 * 60_000);
  });
  it("is valid before expiry, invalid after", () => {
    expect(isValid(token, now + 10 * 60_000)).toBe(true);
    expect(isValid(token, token.expiresAt)).toBe(false);
    expect(isValid(token, token.expiresAt + 1)).toBe(false);
  });
  it("reports remaining time, clamped at zero", () => {
    expect(remainingMs(token, now)).toBe(30 * 60_000);
    expect(remainingMs(token, token.expiresAt + 5000)).toBe(0);
    expect(remainingMinutes(token, now + 29 * 60_000 + 1)).toBe(1); // rounds up
  });
});
