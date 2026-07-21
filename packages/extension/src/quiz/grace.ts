// Grace mode (spec 005 R3). A failed quiz is never a hard lockout: the child is
// told which topic to revisit and can retry after a cool-down. We store a
// retry-not-before timestamp per scope and check it on quiz.start — a stored
// timestamp is more robust across the ephemeral worker than a one-shot alarm
// (and honors "never setTimeout", the concern behind R3's alarm wording).

import * as storage from "../storage.js";
import { GRACE_LOCKOUT_MS } from "@guiderail/quiz-engine";

/** If the scope is in a lockout, the retry-not-before time; else null. */
export async function lockedUntil(scope: string, now = Date.now()): Promise<number | null> {
  const map = (await storage.get("quiz.retryAt")) ?? {};
  const at = map[scope];
  return at !== undefined && at > now ? at : null;
}

/** Begin a grace lockout after a fail; returns the retry-not-before time. */
export async function startLockout(scope: string, now = Date.now()): Promise<number> {
  const map = (await storage.get("quiz.retryAt")) ?? {};
  const at = now + GRACE_LOCKOUT_MS;
  map[scope] = at;
  await storage.set("quiz.retryAt", map);
  return at;
}

/** Clear a scope's lockout (called on a pass). */
export async function clearLockout(scope: string): Promise<void> {
  const map = (await storage.get("quiz.retryAt")) ?? {};
  if (scope in map) {
    delete map[scope];
    await storage.set("quiz.retryAt", map);
  }
}
