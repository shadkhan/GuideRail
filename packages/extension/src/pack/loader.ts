// Pack loader (spec 003 R2/R3/R4/R6, amendment 003A).
//
// The single door between validated pack DATA and the WASM classifier. Its jobs:
//   • install/activate packs atomically, keeping the previous pack on any
//     invalid update so filtering never bricks (R3/R4);
//   • expose list / get-active / set-active for onboarding (spec 007, R6);
//   • build the Aho-Corasick-backed GuideClassifier from the active pack's
//     keywords ONCE per worker life and cache it, rebuilding only on pack
//     change (R2) — the same ephemeral-worker discipline as core.ts/ensureCore.
//
// YouTube channel matching (003A A6) is a plain TS set lookup and lives here,
// NOT in the automaton: channels are matched by exact channel_id, never fuzzy.

import { ensureCore, type ClassifyResult } from "../core.js";
import * as storage from "../storage.js";
import { validatePack, type ValidationError } from "./validate.js";
import type { Pack } from "./types.js";
import { SEED_PACKS } from "./seeds/index.js";
import { GuideClassifier } from "../../../core-wasm/pkg/guiderail_core.js";

/** The default pack activated on a fresh install when none is chosen yet. */
export const DEFAULT_PACK_ID = "homeschool-general";

export type InstallResult = { ok: true; pack: Pack } | { ok: false; errors: ValidationError[] };

/** Lightweight pack descriptor for onboarding menus (R6 list). */
export interface PackSummary {
  id: string;
  board: string;
  grade_band: string;
}

// Module-scope classifier cache: one promise per pack id, mirroring core.ts's
// corePromise. Null'd per-entry on pack change; the whole map evaporates when
// the worker is killed (state never durably lives in module scope — L-006).
const classifiers = new Map<string, Promise<GuideClassifier>>();

/** Drop a cached classifier and free its WASM memory (best-effort). */
function evict(packId: string): void {
  const pending = classifiers.get(packId);
  classifiers.delete(packId);
  void pending?.then((c) => c.free()).catch(() => {});
}

/**
 * Validate and install a pack, then activate it — atomically (R4). Invalid
 * packs are rejected without touching storage, so the previously active pack
 * survives (R3). Returns the normalized pack or the validation errors.
 */
export async function installPack(raw: unknown): Promise<InstallResult> {
  const result = validatePack(raw);
  if (!result.ok) return result;

  await storage.installAndActivate(result.pack.id, result.pack);
  evict(result.pack.id); // force a rebuild against the new bytes
  return result;
}

/**
 * Install the three bundled seed packs (R5/R7 — bundled only, no network).
 * Idempotent: re-validates and re-writes each. Sets the default active pack
 * only when none is active yet, so a re-install never overrides a parent's
 * choice. Call from the worker's onInstalled.
 */
export async function installSeedPacks(): Promise<void> {
  for (const seed of SEED_PACKS) {
    const result = validatePack(seed);
    if (!result.ok) {
      // A bundled seed failing its own schema is a build-time bug, not a
      // runtime condition — surface loudly but don't crash the worker.
      console.error(`[gr] seed pack ${(seed as Pack).id} failed validation`, result.errors);
      continue;
    }
    await storage.setPack(result.pack.id, result.pack);
    evict(result.pack.id);
  }
  if ((await storage.getActivePackId()) === undefined) {
    await storage.setActivePackId(DEFAULT_PACK_ID);
  }
}

/** List installed packs for onboarding (R6). */
export async function listPacks(): Promise<PackSummary[]> {
  const ids = await storage.listInstalledPackIds();
  const packs = await Promise.all(ids.map((id) => storage.getPack(id)));
  return packs
    .filter((p): p is Pack => p !== undefined)
    .map((p) => ({ id: p.id, board: p.board, grade_band: p.grade_band }));
}

/** Get the active pack object, or undefined if none is active (R6). */
export async function getActivePack(): Promise<Pack | undefined> {
  const id = await storage.getActivePackId();
  return id === undefined ? undefined : storage.getPack(id);
}

/**
 * Point the active pointer at an already-installed pack (R6 set-active).
 * Rejects an unknown id so a typo can't silently deactivate filtering.
 */
export async function setActivePack(id: string): Promise<void> {
  if ((await storage.getPack(id)) === undefined) {
    throw new Error(`cannot activate unknown pack: ${id}`);
  }
  const previous = await storage.getActivePackId();
  await storage.setActivePackId(id);
  if (previous !== undefined && previous !== id) evict(previous);
}

/**
 * Build (once) and return the classifier for `packId`, defaulting to the
 * active pack. Warm calls within the worker's life reuse the cached instance;
 * the first build compiles the automaton from the pack's keywords and logs a
 * `[gr-bench] pack-build …` mark (R2 rebuild-time logging).
 */
export async function ensureClassifier(packId?: string): Promise<GuideClassifier> {
  const id = packId ?? (await storage.getActivePackId());
  if (id === undefined) {
    throw new Error("no active pack; install/activate a pack before classifying");
  }

  const cached = classifiers.get(id);
  if (cached) return cached;

  const building = (async () => {
    await ensureCore(); // WASM must be instantiated before GuideClassifier binds
    const pack = await storage.getPack(id);
    if (pack === undefined) throw new Error(`pack not installed: ${id}`);

    const t0 = performance.now();
    const classifier = GuideClassifier.fromKeywords(pack.allow_keywords);
    const buildMs = performance.now() - t0;
    console.log(
      `[gr-bench] pack-build id=${pack.id} keywords=${pack.allow_keywords.length} build=${buildMs.toFixed(2)}ms`,
    );
    return classifier;
  })();

  classifiers.set(id, building);
  // If the build throws, don't leave a rejected promise cached forever.
  building.catch(() => classifiers.delete(id));
  return building;
}

/** Classify `text` against a pack (default: active). Convenience over ensureClassifier. */
export async function classify(text: string, packId?: string): Promise<ClassifyResult> {
  const classifier = await ensureClassifier(packId);
  return classifier.classify(text) as ClassifyResult;
}

/** Test hook: drop all cached classifiers so the next ensureClassifier() rebuilds. */
export function __resetClassifiersForTest(): void {
  for (const id of [...classifiers.keys()]) evict(id);
}
