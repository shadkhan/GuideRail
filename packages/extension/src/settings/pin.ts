// Parent PIN (spec 007 R5, ADR-0012). PBKDF2 + random salt; the PIN is never
// stored in plaintext. A 4–6 digit PIN on an unmanaged device is a speed bump,
// not a vault — the attempt lockout is the real control (documented in ADR-0012).

import type { PinLockout, PinRecord } from "../storage.js";

export const PIN_MIN = 4;
export const PIN_MAX = 6;
export const PIN_ITERATIONS = 150_000;
export const MAX_ATTEMPTS = 5;
export const LOCKOUT_MS = 5 * 60 * 1000; // cooldown after too many failures

const PIN_RE = new RegExp(`^\\d{${PIN_MIN},${PIN_MAX}}$`);
export function isValidPin(pin: string): boolean {
  return PIN_RE.test(pin);
}

// --- base64 <-> bytes -------------------------------------------------------
function toB64(bytes: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s);
}
function fromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function newSalt(): string {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return toB64(salt.buffer);
}

async function derive(pin: string, salt: Uint8Array, iterations: number): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return toB64(bits);
}

export async function hashPin(
  pin: string,
  iterations: number = PIN_ITERATIONS,
): Promise<PinRecord> {
  const saltB64 = newSalt();
  const hashB64 = await derive(pin, fromB64(saltB64), iterations);
  return { hashB64, saltB64, iterations };
}

export async function verifyPin(pin: string, record: PinRecord): Promise<boolean> {
  const hashB64 = await derive(pin, fromB64(record.saltB64), record.iterations);
  return timingSafeEqual(hashB64, record.hashB64);
}

/** Constant-time-ish string compare (avoids leaking match length via early exit). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// --- lockout (pure over the persisted {attempts, until}) --------------------
export function isLocked(lockout: PinLockout | undefined, now: number): boolean {
  return lockout !== undefined && lockout.until > now;
}

/** Record a failed attempt; on the Nth failure, start the cooldown and reset the count. */
export function registerFailure(lockout: PinLockout | undefined, now: number): PinLockout {
  const attempts = (lockout?.attempts ?? 0) + 1;
  if (attempts >= MAX_ATTEMPTS) return { attempts: 0, until: now + LOCKOUT_MS };
  return { attempts, until: lockout?.until ?? 0 };
}

export function resetLockout(): PinLockout {
  return { attempts: 0, until: 0 };
}
