// Storage schema (spec 002 R4).
//
// The service worker is ephemeral (~30s idle kill), so nothing durable may live
// in module scope — it must live in chrome.storage.local, which survives worker
// restarts (L-006). This module is the single typed door to that store:
//
//   • Every key is namespaced and version-stamped: `gr.v${VERSION}.<name>`.
//     The version prefix is what makes migrations tractable — a v2 build reads
//     `gr.v1.*`, migrates, and writes `gr.v2.*`, never guessing at bare keys.
//   • get/set/remove are typed against StorageSchemaV1, so a typo'd key or a
//     wrong value type is a compile error, not a silent undefined at runtime.
//   • runMigrations() is called synchronously-registered from the worker's
//     onInstalled at the top level (see service_worker.ts).
//
// Curriculum packs (spec 003 R4) live here too, one per key under the
// `pack.<id>` namespace, with a separate `active.pack` pointer. They use the
// dedicated accessors below rather than the generic typed get/set because their
// key is dynamic (per pack id), not a fixed member of StorageSchemaV1.

import type { Pack } from "./pack/types.js";
import type { StudySchedule } from "./pipeline/study-hours.js";
import type { CachedClassify, Profile, QueueEntry, ReadingEntry } from "./pipeline/types.js";
import type { EarnedToken } from "@guiderail/quiz-engine";
import type { OnboardingState } from "./settings/onboarding.js";

export const STORAGE_VERSION = 1;

// --- spec 007 settings value shapes -----------------------------------------
/** PBKDF2 parent-PIN record (never plaintext) — spec 007 R5, ADR-0012. */
export interface PinRecord {
  hashB64: string;
  saltB64: string;
  iterations: number;
}
/** PIN attempt/lockout state. `until` is an epoch-ms cooldown, 0 when unlocked. */
export interface PinLockout {
  attempts: number;
  until: number;
}
/** Per-family gate-list edits layered over the static base (spec 007 R3). */
export interface GateListOverrides {
  added: string[];
  removed: string[];
}

/** Namespaced, version-stamped key: `gr.v1.<name>`. */
function key(name: string): string {
  return `gr.v${STORAGE_VERSION}.${name}`;
}

/** The shape of everything GuideRail persists at schema v1. */
export interface StorageSchemaV1 {
  /** The schema version last written — drives runMigrations(). */
  "meta.version": number;
  /** Base64 of the compiled WASM module, cached on install (see core.ts / R5). */
  "wasm.bytes": string;
  /** Last core-init timing, for diagnostics; the bench harness reads the console mark, not this. */
  "core.timing": { cold_ms: number; at: string } | undefined;
  /** Id of the currently active pack (spec 003 R4/R6). Undefined until a pack is installed. */
  "active.pack": string | undefined;
  /** Filtering posture (spec 004 R2). Undefined ⇒ treated as "consumer". */
  "config.profile": Profile | undefined;
  /** Per-weekday study-hours schedule (spec 004 R1/Q1). Undefined ⇒ never active. */
  "config.studyHours": StudySchedule | undefined;
  /** Per-origin memoized classify results (spec 004 R3, TTL 24h). */
  "verdict.cache": Record<string, CachedClassify> | undefined;
  /** Local background-classification queue — sanitized metadata (spec 004 R6 stub). */
  "classify.queue": QueueEntry[] | undefined;
  /** Reading-history buffer feeding quiz topic-weighting (spec 004A A3, spec 005). */
  "reading.history": ReadingEntry[] | undefined;
  /** YouTube channel-id resolution failures, persisted for selector maintenance (spec 004A A3). */
  "yt.resolutionFailures": Array<{ url: string; at: string }> | undefined;
  /** Earned-window length in minutes (spec 005 Q2; setter is spec 007). Undefined ⇒ 30. */
  "config.earnedWindowMinutes": number | undefined;
  /** Active earned-time tokens, keyed by scope (registrable domain) — spec 005 R4. */
  "earned.tokens": Record<string, EarnedToken> | undefined;
  /** Per-scope grace-mode retry-not-before timestamps (epoch ms) — spec 005 R3. */
  "quiz.retryAt": Record<string, number> | undefined;
  /** Local-only quiz attempt log for the future digest (spec 005 R7): passed/failed + topics. */
  "quiz.log":
    | Array<{
        at: string;
        scope: string;
        passed: boolean;
        correctCount: number;
        total: number;
        topics: string[];
        missedTopics: string[];
      }>
    | undefined;
  // --- spec 007: onboarding + parent settings ---
  /** Parent PIN record (PBKDF2, never plaintext) — spec 007 R5. */
  "config.pin": PinRecord | undefined;
  /** PIN attempt/lockout state — spec 007 R5. */
  "config.pinLockout": PinLockout | undefined;
  /** Child's display name (local only) — spec 007 R1. */
  "config.childName": string | undefined;
  /** Persisted onboarding progress so an abandoned run resumes (spec 007 R1). */
  "config.onboarding": OnboardingState | undefined;
  /** Local date (YYYY-MM-DD) protection is paused for today (spec 007 R3). */
  "config.pausedDate": string | undefined;
  /** Per-family gate-list add/remove edits over the static base (spec 007 R3). */
  "config.gateListOverrides": GateListOverrides | undefined;
}

type Key = keyof StorageSchemaV1;

export async function get<K extends Key>(name: K): Promise<StorageSchemaV1[K] | undefined> {
  const k = key(name);
  const out = await chrome.storage.local.get(k);
  return out[k] as StorageSchemaV1[K] | undefined;
}

export async function set<K extends Key>(name: K, value: StorageSchemaV1[K]): Promise<void> {
  await chrome.storage.local.set({ [key(name)]: value });
}

export async function remove(name: Key): Promise<void> {
  await chrome.storage.local.remove(key(name));
}

// --- pack storage (spec 003 R4) ---------------------------------------------
// Packs use a dynamic `pack.<id>` key, so they get dedicated accessors instead
// of the fixed-key typed door above. The `active.pack` pointer keeps its own
// `active.` prefix, so it never collides with the `pack.` scan below.

const PACK_PREFIX = "pack.";
const packKey = (id: string): string => key(`${PACK_PREFIX}${id}`);

export async function getPack(id: string): Promise<Pack | undefined> {
  const k = packKey(id);
  const out = await chrome.storage.local.get(k);
  return out[k] as Pack | undefined;
}

/** Store a pack without touching the active pointer (used by seed install). */
export async function setPack(id: string, pack: Pack): Promise<void> {
  await chrome.storage.local.set({ [packKey(id)]: pack });
}

/** List the ids of all installed packs (excludes the active pointer). */
export async function listInstalledPackIds(): Promise<string[]> {
  const all = await chrome.storage.local.get(null);
  const prefix = key(PACK_PREFIX); // e.g. "gr.v1.pack."
  return Object.keys(all)
    .filter((k) => k.startsWith(prefix))
    .map((k) => k.slice(prefix.length));
}

/**
 * Install a pack and make it active in a single atomic write (R4). Both keys
 * land in one chrome.storage.local.set, so a reader never sees the new pointer
 * without the new pack bytes. The caller validates first — an invalid pack
 * never reaches here, so the previously active pack survives (R3).
 */
export async function installAndActivate(id: string, pack: Pack): Promise<void> {
  await chrome.storage.local.set({
    [packKey(id)]: pack,
    [key("active.pack")]: id,
  });
}

/** Point the active pointer at an already-installed pack (R6 set-active). */
export async function setActivePackId(id: string): Promise<void> {
  await set("active.pack", id);
}

export async function getActivePackId(): Promise<string | undefined> {
  return get("active.pack");
}

/**
 * Migration entry point (stub for v1). Reads the stored schema version; when it
 * matches the current version there is nothing to do. Future versions add
 * stepwise `stored < STORAGE_VERSION` migrations here before the version bump.
 */
export async function runMigrations(): Promise<void> {
  const stored = await get("meta.version");
  if (stored === STORAGE_VERSION) return;
  // v1 has no prior schema to migrate from; just stamp the version.
  await set("meta.version", STORAGE_VERSION);
}
