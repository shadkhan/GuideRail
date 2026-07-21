// YouTube resolution + verdict tests (spec 004A — the A1 matrix).

import { describe, it, expect } from "vitest";
import type { Pack } from "../pack/types.js";
import { isYouTubeHost, resolveYouTube, youtubeVerdict } from "./youtube.js";

const ALLOWED = "UCallowedchannel00000000"; // UC + 22 chars
const OTHER = "UCotherchannelxxxxxxx000"; // UC + 22 chars, not in pack

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
    { channel_id: ALLOWED, handle: "@x", label: "Allowed", subjects: ["math", "science"] },
  ],
  quiz_topics: [],
  updated_at: "2026-07-20T00:00:00Z",
  yt_policy: { shorts: "gate", embeds: "inherit_parent" },
};

describe("isYouTubeHost", () => {
  it("recognizes watch + embed hosts", () => {
    expect(isYouTubeHost("www.youtube.com")).toBe(true);
    expect(isYouTubeHost("m.youtube.com")).toBe(true);
    expect(isYouTubeHost("www.youtube-nocookie.com")).toBe(true);
    expect(isYouTubeHost("khanacademy.org")).toBe(false);
  });
});

describe("resolveYouTube path detection", () => {
  it("classifies watch / shorts / nav / embed", () => {
    expect(resolveYouTube("https://www.youtube.com/watch?v=abc").path).toBe("watch");
    expect(resolveYouTube("https://www.youtube.com/shorts/xyz").path).toBe("shorts");
    expect(resolveYouTube("https://www.youtube.com/").path).toBe("nav");
    expect(resolveYouTube("https://www.youtube.com/results?search_query=q").path).toBe("nav");
    expect(resolveYouTube("https://www.youtube.com/@channel").path).toBe("nav");
    expect(resolveYouTube("https://www.youtube-nocookie.com/embed/abc").isEmbed).toBe(true);
  });
});

describe("youtubeVerdict (004A A1 matrix)", () => {
  const watch = (channelId: string | null) =>
    resolveYouTube("https://www.youtube.com/watch?v=abc", { channelId });

  it("allows an allowlisted channel, tagged with its subjects", () => {
    const d = youtubeVerdict(watch(ALLOWED), PACK);
    expect(d.verdict).toBe("allow");
    expect(d.tags).toEqual(["math", "science"]);
  });
  it("gates a non-allowlisted channel", () => {
    expect(youtubeVerdict(watch(OTHER), PACK).verdict).toBe("quiz_gate");
  });
  it("gates on resolution failure (channelId null) — fail-closed on YouTube (A3)", () => {
    const d = youtubeVerdict(watch(null), PACK);
    expect(d.verdict).toBe("quiz_gate");
    expect(d.reason).toBe("yt-resolution-failure");
  });
  it("gates Shorts by default policy (A2), regardless of channel", () => {
    const d = youtubeVerdict(resolveYouTube("https://www.youtube.com/shorts/x"), PACK);
    expect(d.verdict).toBe("quiz_gate");
  });
  it("allows Shorts when pack yt_policy.shorts = allow", () => {
    const allowShorts: Pack = { ...PACK, yt_policy: { shorts: "allow", embeds: "inherit_parent" } };
    expect(
      youtubeVerdict(resolveYouTube("https://www.youtube.com/shorts/x"), allowShorts).verdict,
    ).toBe("allow");
  });
  it("treats homepage/search as allow_navigation (browsable, not counted)", () => {
    expect(youtubeVerdict(resolveYouTube("https://www.youtube.com/"), PACK).verdict).toBe(
      "allow_navigation",
    );
    expect(
      youtubeVerdict(resolveYouTube("https://www.youtube.com/results?search_query=q"), PACK)
        .verdict,
    ).toBe("allow_navigation");
  });
  it("inherits parent for embeds", () => {
    expect(
      youtubeVerdict(resolveYouTube("https://www.youtube-nocookie.com/embed/abc"), PACK).verdict,
    ).toBe("inherit_parent");
  });
});
