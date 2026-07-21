// Earned-time token (spec 005 R4). A token is just {scope, grantedAt, expiresAt};
// the extension persists it and enforces it via storage + chrome.alarms + DNR.
// These helpers are the pure time math.

import type { EarnedToken } from "./types.js";

export function mintToken(scope: string, now: number, windowMs: number): EarnedToken {
  return { scope, grantedAt: now, expiresAt: now + windowMs };
}

export function isValid(token: EarnedToken, now: number): boolean {
  return token.expiresAt > now;
}

export function remainingMs(token: EarnedToken, now: number): number {
  return Math.max(0, token.expiresAt - now);
}

/** Whole minutes remaining, rounded up — what the countdown badge shows. */
export function remainingMinutes(token: EarnedToken, now: number): number {
  return Math.ceil(remainingMs(token, now) / 60000);
}
