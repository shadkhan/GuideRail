// Per-origin classify cache (spec 004 R3). Memoizes the expensive WASM classify
// step so repeat visits to the same origin skip it. TTL 24h; stale and expired
// entries are pruned opportunistically on write.

import * as storage from "../storage.js";
import type { CachedClassify, ClassifyVerdict } from "./types.js";

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function getCached(
  origin: string,
  now = Date.now(),
): Promise<CachedClassify | undefined> {
  const cache = (await storage.get("verdict.cache")) ?? {};
  const entry = cache[origin];
  if (!entry || entry.expiresAt <= now) return undefined;
  return entry;
}

export async function putCached(
  origin: string,
  verdict: ClassifyVerdict,
  matches: string[],
  now = Date.now(),
): Promise<void> {
  const cache = (await storage.get("verdict.cache")) ?? {};
  for (const k of Object.keys(cache)) {
    const entry = cache[k];
    if (entry && entry.expiresAt <= now) delete cache[k]; // prune expired
  }
  cache[origin] = { verdict, matches, expiresAt: now + CACHE_TTL_MS };
  await storage.set("verdict.cache", cache);
}
