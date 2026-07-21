// Per-origin verdict cache tests (spec 004 R3). Uses the mocked chrome.storage
// from test/setup.ts (cleared before each test).

import { describe, it, expect } from "vitest";
import { getCached, putCached, CACHE_TTL_MS } from "./verdict-cache.js";

describe("verdict cache (TTL 24h)", () => {
  it("returns a fresh entry within its TTL", async () => {
    const now = 1_000_000;
    await putCached("example.com", "allow", ["math"], now);
    const hit = await getCached("example.com", now + 1000);
    expect(hit).toMatchObject({ verdict: "allow", matches: ["math"] });
  });

  it("misses an expired entry", async () => {
    const now = 1_000_000;
    await putCached("example.com", "allow", ["math"], now);
    expect(await getCached("example.com", now + CACHE_TTL_MS + 1)).toBeUndefined();
  });

  it("misses an unknown origin", async () => {
    expect(await getCached("never-seen.com")).toBeUndefined();
  });

  it("prunes expired entries on write", async () => {
    const now = 1_000_000;
    await putCached("old.com", "allow", [], now);
    // A much later write should evict the now-stale old.com entry.
    await putCached("new.com", "quiz_gate", [], now + CACHE_TTL_MS + 1);
    expect(await getCached("old.com", now + CACHE_TTL_MS + 2)).toBeUndefined();
    expect(await getCached("new.com", now + CACHE_TTL_MS + 2)).toMatchObject({
      verdict: "quiz_gate",
    });
  });
});
