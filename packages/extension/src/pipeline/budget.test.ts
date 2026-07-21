// Pipeline budget evidence (spec 004 R5, 004A A5), committed & run by `pnpm test`.
//
// R5: content-script extraction + a verdict must stay < 4ms p95. A5: YouTube
// channel resolution adds ≤ 1ms. The DOM reads in content.ts are three property
// accesses (negligible); the measurable work is the pure decision path, timed
// here over many iterations with in-memory deps.

import { describe, it, expect } from "vitest";
import type { Pack } from "../pack/types.js";
import { evaluate, type EvalDeps } from "./policy.js";
import { resolveYouTube, youtubeVerdict } from "./youtube.js";
import type { ClassifyVerdict } from "./types.js";

const PACK: Pack = {
  id: "test",
  version: "1.0.0",
  locale: "en-IN",
  board: "CBSE",
  grade_band: "7",
  tags: ["math"],
  allow_domains: ["khanacademy.org"],
  allow_keywords: [{ term: "algebra", tag: "math" }],
  allow_yt_channels: [
    { channel_id: "UCallowedchannel00000000", handle: "@x", label: "X", subjects: ["math"] },
  ],
  quiz_topics: [],
  updated_at: "2026-07-20T00:00:00Z",
  yt_policy: { shorts: "gate", embeds: "inherit_parent" },
};

const NOW = new Date(2026, 6, 20, 17, 0);
const deps: EvalDeps = {
  now: NOW,
  schedule: { [NOW.getDay()]: [{ start: "00:00", end: "23:59" }] },
  profile: "consumer",
  pack: PACK,
  classify: async () => ({ verdict: "allow" as ClassifyVerdict, matches: ["math"] }),
  cacheGet: async () => undefined,
  cachePut: async () => {},
  enqueue: async () => {},
  recordReading: async () => {},
  hasEarnedTime: async () => false,
};

function p95(times: number[]): number {
  const sorted = [...times].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.95)] ?? 0;
}

describe("R5/A5 budgets", () => {
  it("YouTube resolution + verdict stays ≤ 1ms (A5)", () => {
    const N = 20_000;
    const url = "https://www.youtube.com/watch?v=abc";
    const times: number[] = [];
    for (let i = 0; i < N; i++) {
      const t = performance.now();
      youtubeVerdict(resolveYouTube(url, { channelId: "UCallowedchannel00000000" }), PACK);
      times.push(performance.now() - t);
    }
    const budget = p95(times);
    console.log(`[gr-bench] yt-resolve p95=${budget.toFixed(4)}ms over ${N}`);
    expect(budget).toBeLessThanOrEqual(1);
  });

  it("full evaluate() stays under the 4ms content-script budget (R5)", async () => {
    const N = 2_000;
    const times: number[] = [];
    for (let i = 0; i < N; i++) {
      const t = performance.now();
      await evaluate(
        {
          url: "https://www.youtube.com/watch?v=abc",
          title: "Algebra basics",
          description: "",
          ytChannelId: "UCallowedchannel00000000",
        },
        deps,
      );
      times.push(performance.now() - t);
    }
    const budget = p95(times);
    console.log(`[gr-bench] evaluate p95=${budget.toFixed(4)}ms over ${N}`);
    expect(budget).toBeLessThan(4);
  });
});
