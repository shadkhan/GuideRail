import { describe, it, expect } from "vitest";
import { topicWeights, type ReadingRecord } from "./weighting.js";

const now = Date.parse("2026-07-20T12:00:00Z");
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

describe("topicWeights", () => {
  it("counts tags within the 24h window", () => {
    const history: ReadingRecord[] = [
      { tags: ["math"], at: iso(60_000) },
      { tags: ["math", "science"], at: iso(120_000) },
    ];
    const w = topicWeights(history, now);
    expect(w.get("math")).toBe(2);
    expect(w.get("science")).toBe(1);
  });

  it("excludes entries older than the window and future entries", () => {
    const history: ReadingRecord[] = [
      { tags: ["math"], at: iso(25 * 60 * 60 * 1000) }, // 25h ago — stale
      { tags: ["science"], at: iso(-60_000) }, // in the future — ignored
      { tags: ["history"], at: iso(60_000) }, // recent — counted
    ];
    const w = topicWeights(history, now);
    expect(w.has("math")).toBe(false);
    expect(w.has("science")).toBe(false);
    expect(w.get("history")).toBe(1);
  });

  it("returns an empty map for empty history", () => {
    expect(topicWeights([], now).size).toBe(0);
  });
});
