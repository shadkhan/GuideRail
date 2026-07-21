// YouTube channel-aware verdicts (spec 004A, produces ADR-0010).
//
// YouTube is both the largest study venue and the primary distraction, so the
// verdict unit is the CHANNEL (and content format), not the domain. This module
// is pure TS — no core-wasm change (004A A6): the channel decision is a set
// lookup against the active pack's allow_yt_channels, and the format decision
// (Shorts) is a path check. The content script supplies the resolved channel_id
// (a DOM read); this module maps {url, channelId, pack} → verdict.

import type { Pack } from "../pack/types.js";
import { hostMatches } from "./gate-list.js";

/** The content-format bucket a YouTube URL falls into. */
export type YtPath = "watch" | "shorts" | "nav" | "other";

export interface YtResolved {
  /** youtube.com / m.youtube.com / music.youtube.com / www.* */
  isYouTube: boolean;
  /** youtube-nocookie.com — an embed origin. */
  isEmbed: boolean;
  path: YtPath;
  /** Resolved by the content script for /watch; null on resolution failure. */
  channelId: string | null;
}

export type YtVerdict = "allow" | "quiz_gate" | "allow_navigation" | "inherit_parent";

const YT_HOSTS = ["youtube.com", "m.youtube.com", "music.youtube.com"];
const YT_EMBED_HOST = "youtube-nocookie.com";

/** True when a hostname is any YouTube surface (watch host or embed host). */
export function isYouTubeHost(host: string): boolean {
  return YT_HOSTS.some((d) => hostMatches(host, d)) || hostMatches(host, YT_EMBED_HOST);
}

/** Classify a YouTube URL into {surface, format, channelId}. */
export function resolveYouTube(url: string, ytMeta?: { channelId?: string | null }): YtResolved {
  let host = "";
  let pathname = "/";
  try {
    const u = new URL(url);
    host = u.hostname;
    pathname = u.pathname;
  } catch {
    // Malformed URL — treat as a non-watch surface (browsable, never allowed).
    return { isYouTube: false, isEmbed: false, path: "other", channelId: null };
  }

  const isEmbed = hostMatches(host, YT_EMBED_HOST);
  const isYouTube = YT_HOSTS.some((d) => hostMatches(host, d)) || isEmbed;

  let path: YtPath = "other";
  if (pathname === "/watch" || pathname.startsWith("/watch")) path = "watch";
  else if (pathname.startsWith("/shorts/")) path = "shorts";
  else if (
    pathname === "/" ||
    pathname.startsWith("/results") ||
    pathname.startsWith("/feed") ||
    pathname.startsWith("/@") ||
    pathname.startsWith("/channel/") ||
    pathname.startsWith("/c/") ||
    pathname.startsWith("/user/") ||
    pathname.startsWith("/playlist")
  ) {
    path = "nav";
  }

  return { isYouTube, isEmbed, path, channelId: ytMeta?.channelId ?? null };
}

export interface YtDecision {
  verdict: YtVerdict;
  /** Subject tags of the matched channel, for reading-history (allow only). */
  tags: string[];
  reason: string;
}

/** Build the channel_id → subjects map for O(1) allow lookups. */
function channelSubjects(pack: Pack): Map<string, string[]> {
  return new Map(pack.allow_yt_channels.map((c) => [c.channel_id, c.subjects]));
}

/**
 * Decide a verdict for a resolved YouTube URL. Called only WITHIN study hours
 * (the pipeline's hours check runs first), so the resolution-failure fallback is
 * always fail-closed here.
 *
 * - Embed → inherit_parent (the embedding page's verdict governs; 004A A1).
 * - /watch → allow iff channel_id ∈ pack.allow_yt_channels (tagged), else gate.
 *   channel_id null (resolution failure) → gate (fail-closed on YouTube, 004A A3).
 * - /shorts → format-level per pack.yt_policy.shorts (default gate), regardless
 *   of channel or earned time (AQ2: Shorts stay gated even during earned time).
 * - nav (homepage/search/channel pages/playlists) → allow_navigation
 *   (browsable, never counted as reading; 004A A1).
 */
export function youtubeVerdict(r: YtResolved, pack: Pack): YtDecision {
  if (r.isEmbed) return { verdict: "inherit_parent", tags: [], reason: "yt-embed" };

  switch (r.path) {
    case "watch": {
      if (r.channelId === null) {
        return { verdict: "quiz_gate", tags: [], reason: "yt-resolution-failure" };
      }
      const subjects = channelSubjects(pack).get(r.channelId);
      if (subjects) return { verdict: "allow", tags: subjects, reason: "yt-allow-channel" };
      return { verdict: "quiz_gate", tags: [], reason: "yt-nonallowed-channel" };
    }
    case "shorts": {
      const policy = pack.yt_policy?.shorts ?? "gate";
      if (policy === "allow") return { verdict: "allow", tags: [], reason: "yt-shorts-allow" };
      // "gate" and "inherit" both gate for now — channel-level Shorts resolution
      // is deferred; conservative default documented in ADR-0010.
      return { verdict: "quiz_gate", tags: [], reason: "yt-shorts-gate" };
    }
    case "nav":
      return { verdict: "allow_navigation", tags: [], reason: "yt-nav" };
    default:
      // Unknown YouTube surface — browsable but never allowed/counted.
      return { verdict: "allow_navigation", tags: [], reason: "yt-other" };
  }
}
