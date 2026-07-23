// Policy pipeline (spec 004 R1/R2, amendment 004A). The single decision function
// the service worker calls per navigation (and per YouTube SPA = Single-Page
// Application hop). It is PURE — every side-effecting dependency (WASM classify,
// storage cache, queue, reading-history, the clock) is injected — so the whole
// four-stage flow and the fail-open/closed branch are unit-tested without Chrome.
//
// Stage order (R1): study-hours → pack allow_domains → YouTube (004A) →
// gate-list → WASM classify → consumer fail-open / institutional fail-closed.

import type { Pack } from "../pack/types.js";
import { hostInList } from "./gate-list.js";
import { isYouTubeHost, resolveYouTube, youtubeVerdict } from "./youtube.js";
import type { CachedClassify, ClassifyVerdict, PolicyVerdict, Profile } from "./types.js";

export interface EvalInput {
  url: string;
  title: string;
  description: string;
  /** channel_id resolved by the content script for YouTube /watch (else null). */
  ytChannelId?: string | null;
}

export interface EvalDeps {
  /** Is protection active now? The single isStudyTime() source (spec 007 R2). */
  studyActive: boolean;
  profile: Profile;
  pack: Pack | undefined;
  classify: (text: string) => Promise<{ verdict: ClassifyVerdict; matches: string[] }>;
  cacheGet: (origin: string) => Promise<CachedClassify | undefined>;
  cachePut: (origin: string, verdict: ClassifyVerdict, matches: string[]) => Promise<void>;
  /** Sanitize + enqueue unknown-page metadata (consumer fail-open background stub). */
  enqueue: (text: string) => Promise<void>;
  /** Append subject tags to the reading-history buffer (allowed reading pages). */
  recordReading: (tags: string[]) => Promise<void>;
  /** True when a valid earned-time token covers this host (spec 005). */
  hasEarnedTime: (host: string) => Promise<boolean>;
  /** True when host is on the EFFECTIVE gate-list (base ± parent edits, spec 007 R3). */
  isGateListed: (host: string) => boolean;
}

export interface EvalResult {
  verdict: PolicyVerdict;
  matches: string[];
  /** What the worker should do next: nothing, or redirect the tab to the quiz gate. */
  action: "none" | "gate";
  reason: string;
}

const allow = (matches: string[], reason: string): EvalResult => ({
  verdict: "allow",
  matches,
  action: "none",
  reason,
});
const gate = (reason: string, matches: string[] = []): EvalResult => ({
  verdict: "quiz_gate",
  matches,
  action: "gate",
  reason,
});
const nav = (reason: string): EvalResult => ({
  verdict: "allow_navigation",
  matches: [],
  action: "none",
  reason,
});

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/** Metadata → the text handed to the classifier (title + description + URL tokens). */
export function classifyText(input: EvalInput): string {
  let host = "";
  let path = "";
  try {
    const u = new URL(input.url);
    host = u.hostname;
    path = u.pathname;
  } catch {
    // leave host/path empty
  }
  const urlTokens = `${host} ${path}`.replace(/[^a-zA-Z0-9]+/g, " ");
  return [input.title, input.description, urlTokens].filter(Boolean).join(" ").trim();
}

export async function evaluate(input: EvalInput, deps: EvalDeps): Promise<EvalResult> {
  // 1. Study-time gate — when protection is off the pipeline is a no-op (R2).
  if (!deps.studyActive) return allow([], "outside-study-hours");

  const host = hostOf(input.url);
  if (host === null) return allow([], "unparseable-url");

  // 1.5 Earned-time override — a valid token unlocks this origin-group (spec 005),
  // EXCEPT YouTube Shorts, which stay gated by format even during earned time
  // (004A AQ2). Runs before gating so a paid-for window actually lets pages through.
  if (await deps.hasEarnedTime(host)) {
    const isYtShorts = isYouTubeHost(host) && resolveYouTube(input.url).path === "shorts";
    if (!isYtShorts) return allow([], "earned-time");
  }

  // 2. Active pack allow_domains fast path (schoolwork sites load untouched).
  if (deps.pack && hostInList(host, deps.pack.allow_domains)) return allow([], "allow-domain");

  // 2.5 YouTube channel-aware resolution (spec 004A) — before the gate-list.
  if (isYouTubeHost(host) && deps.pack) {
    const resolved = resolveYouTube(input.url, { channelId: input.ytChannelId ?? null });
    const yt = youtubeVerdict(resolved, deps.pack);
    switch (yt.verdict) {
      case "allow":
        await deps.recordReading(yt.tags); // full weight (AQ1)
        return allow(yt.tags, yt.reason);
      case "quiz_gate":
        return gate(yt.reason);
      case "allow_navigation":
      case "inherit_parent":
        // A top-level embed navigation has no parent to inherit — treat as browse.
        return nav(yt.reason);
    }
  }

  // 3. Effective gate-list (curated base ± parent edits, spec 007 R3).
  if (deps.isGateListed(host)) return gate("gate-list");

  // 4. WASM classify (memoized per-origin, R3). No active pack ⇒ can't classify.
  if (!deps.pack) {
    return deps.profile === "institutional" ? gate("no-active-pack") : allow([], "no-active-pack");
  }

  const text = classifyText(input);
  let cached = await deps.cacheGet(host);
  if (!cached) {
    const r = await deps.classify(text);
    await deps.cachePut(host, r.verdict, r.matches);
    cached = { verdict: r.verdict, matches: r.matches, expiresAt: 0 };
  }

  switch (cached.verdict) {
    case "allow":
      await deps.recordReading(cached.matches);
      return allow(cached.matches, "classify-allow");
    case "quiz_gate":
      return gate("classify-distraction", cached.matches);
    case "unknown":
      // Consumer fails open (load + enqueue for background classification);
      // institutional fails closed (route to the gate). ADR-0001.
      if (deps.profile === "institutional") return gate("fail-closed-unknown");
      await deps.enqueue(text);
      return allow([], "fail-open-unknown");
  }
}
