// Policy pipeline tests (spec 004 R1/R2 + 004A). Drives evaluate() with injected
// fake dependencies — all four stages × in/out of study hours, the fail-open vs
// fail-closed branch, the per-origin cache, and the YouTube matrix end-to-end.

import { describe, it, expect, vi } from "vitest";
import type { Pack } from "../pack/types.js";
import { evaluate, type EvalDeps, type EvalInput } from "./policy.js";
import type { ClassifyVerdict } from "./types.js";

const ALLOWED_CH = "UCallowedchannel00000000";

const PACK: Pack = {
  id: "test",
  version: "1.0.0",
  locale: "en-IN",
  board: "CBSE",
  grade_band: "7",
  tags: ["math", "science"],
  allow_domains: ["khanacademy.org"],
  allow_keywords: [{ term: "algebra", tag: "math" }],
  allow_yt_channels: [
    { channel_id: ALLOWED_CH, handle: "@x", label: "Allowed", subjects: ["math"] },
  ],
  quiz_topics: [],
  updated_at: "2026-07-20T00:00:00Z",
  yt_policy: { shorts: "gate", embeds: "inherit_parent" },
};

const NOW = new Date(2026, 6, 20, 17, 0);
// A schedule that is "always within" for NOW's weekday.
const ALWAYS = { [NOW.getDay()]: [{ start: "00:00", end: "23:59" }] };

function makeDeps(over: Partial<EvalDeps> = {}): EvalDeps {
  return {
    now: over.now ?? NOW,
    schedule: over.schedule ?? ALWAYS,
    profile: over.profile ?? "consumer",
    pack: "pack" in over ? over.pack : PACK,
    classify:
      over.classify ?? vi.fn(async () => ({ verdict: "unknown" as ClassifyVerdict, matches: [] })),
    cacheGet: over.cacheGet ?? vi.fn(async () => undefined),
    cachePut: over.cachePut ?? vi.fn(async () => {}),
    enqueue: over.enqueue ?? vi.fn(async () => {}),
    recordReading: over.recordReading ?? vi.fn(async () => {}),
    hasEarnedTime: over.hasEarnedTime ?? vi.fn(async () => false),
  };
}

const input = (over: Partial<EvalInput> = {}): EvalInput => ({
  url: "https://blog.example.com/post",
  title: "",
  description: "",
  ...over,
});

describe("pipeline stages", () => {
  it("outside study hours is a no-op allow (classify not called)", async () => {
    const classify = vi.fn(async () => ({ verdict: "quiz_gate" as ClassifyVerdict, matches: [] }));
    const r = await evaluate(
      input({ url: "https://netflix.com" }),
      makeDeps({ schedule: {}, classify }),
    );
    expect(r).toMatchObject({ verdict: "allow", reason: "outside-study-hours" });
    expect(classify).not.toHaveBeenCalled();
  });

  it("pack allow_domains loads clean without classifying", async () => {
    const classify = vi.fn();
    const r = await evaluate(
      input({ url: "https://www.khanacademy.org/math" }),
      makeDeps({ classify }),
    );
    expect(r).toMatchObject({ verdict: "allow", reason: "allow-domain" });
    expect(classify).not.toHaveBeenCalled();
  });

  it("curated gate-list routes to the quiz gate", async () => {
    const r = await evaluate(input({ url: "https://www.instagram.com/x" }), makeDeps());
    expect(r).toMatchObject({ verdict: "quiz_gate", action: "gate", reason: "gate-list" });
  });

  it("classify allow records reading-history tags", async () => {
    const recordReading = vi.fn(async () => {});
    const classify = vi.fn(async () => ({
      verdict: "allow" as ClassifyVerdict,
      matches: ["math"],
    }));
    const r = await evaluate(input(), makeDeps({ classify, recordReading }));
    expect(r).toMatchObject({ verdict: "allow", reason: "classify-allow", matches: ["math"] });
    expect(recordReading).toHaveBeenCalledWith(["math"]);
  });

  it("classify distraction gates", async () => {
    const classify = vi.fn(async () => ({
      verdict: "quiz_gate" as ClassifyVerdict,
      matches: ["gaming"],
    }));
    const r = await evaluate(input(), makeDeps({ classify }));
    expect(r).toMatchObject({
      verdict: "quiz_gate",
      action: "gate",
      reason: "classify-distraction",
    });
  });

  it("consumer unknown fails open and enqueues for background classification", async () => {
    const enqueue = vi.fn(async () => {});
    const r = await evaluate(input(), makeDeps({ profile: "consumer", enqueue }));
    expect(r).toMatchObject({ verdict: "allow", reason: "fail-open-unknown" });
    expect(enqueue).toHaveBeenCalledOnce();
  });

  it("institutional unknown fails closed and does NOT enqueue", async () => {
    const enqueue = vi.fn(async () => {});
    const r = await evaluate(input(), makeDeps({ profile: "institutional", enqueue }));
    expect(r).toMatchObject({
      verdict: "quiz_gate",
      action: "gate",
      reason: "fail-closed-unknown",
    });
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("uses the per-origin cache instead of re-classifying", async () => {
    const classify = vi.fn();
    const cacheGet = vi.fn(async () => ({
      verdict: "allow" as ClassifyVerdict,
      matches: ["science"],
      expiresAt: Number.MAX_SAFE_INTEGER,
    }));
    const r = await evaluate(input(), makeDeps({ classify, cacheGet }));
    expect(r).toMatchObject({ verdict: "allow", reason: "classify-allow", matches: ["science"] });
    expect(classify).not.toHaveBeenCalled();
  });
});

describe("YouTube stage (004A)", () => {
  it("allows an allowlisted channel and records its subjects", async () => {
    const recordReading = vi.fn(async () => {});
    const r = await evaluate(
      {
        url: "https://www.youtube.com/watch?v=abc",
        title: "",
        description: "",
        ytChannelId: ALLOWED_CH,
      },
      makeDeps({ recordReading }),
    );
    expect(r).toMatchObject({ verdict: "allow", reason: "yt-allow-channel", matches: ["math"] });
    expect(recordReading).toHaveBeenCalledWith(["math"]);
  });

  it("gates a non-allowlisted watch", async () => {
    const r = await evaluate(
      {
        url: "https://www.youtube.com/watch?v=abc",
        title: "",
        description: "",
        ytChannelId: "UCnope0000000000000000x",
      },
      makeDeps(),
    );
    expect(r).toMatchObject({ verdict: "quiz_gate", action: "gate" });
  });

  it("gates a watch with unresolved channel (fail-closed on YouTube)", async () => {
    const r = await evaluate(
      { url: "https://www.youtube.com/watch?v=abc", title: "", description: "", ytChannelId: null },
      makeDeps(),
    );
    expect(r).toMatchObject({ verdict: "quiz_gate", reason: "yt-resolution-failure" });
  });

  it("gates Shorts by default", async () => {
    const r = await evaluate(
      { url: "https://www.youtube.com/shorts/x", title: "", description: "" },
      makeDeps(),
    );
    expect(r).toMatchObject({ verdict: "quiz_gate" });
  });

  it("treats homepage/search as allow_navigation (no reading recorded)", async () => {
    const recordReading = vi.fn(async () => {});
    const r = await evaluate(
      { url: "https://www.youtube.com/", title: "", description: "" },
      makeDeps({ recordReading }),
    );
    expect(r).toMatchObject({ verdict: "allow_navigation", action: "none" });
    expect(recordReading).not.toHaveBeenCalled();
  });
});

describe("earned-time override (spec 005)", () => {
  it("allows a gate-listed domain while earned time is active", async () => {
    const r = await evaluate(
      input({ url: "https://www.instagram.com/x" }),
      makeDeps({ hasEarnedTime: async () => true }),
    );
    expect(r).toMatchObject({ verdict: "allow", reason: "earned-time" });
  });

  it("allows a non-allowlisted YouTube watch while earned", async () => {
    const r = await evaluate(
      {
        url: "https://www.youtube.com/watch?v=x",
        title: "",
        description: "",
        ytChannelId: "UCnope0000000000000000x",
      },
      makeDeps({ hasEarnedTime: async () => true }),
    );
    expect(r).toMatchObject({ verdict: "allow", reason: "earned-time" });
  });

  it("STILL gates YouTube Shorts even with earned time (004A AQ2)", async () => {
    const r = await evaluate(
      { url: "https://www.youtube.com/shorts/x", title: "", description: "" },
      makeDeps({ hasEarnedTime: async () => true }),
    );
    expect(r).toMatchObject({ verdict: "quiz_gate" });
  });
});
