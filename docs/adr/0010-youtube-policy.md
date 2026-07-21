# 0010. YouTube verdicts are channel-level, Shorts gate by format, and unresolved watches fail closed
Date: 2026-07-20 | Status: Accepted | Supersedes: — | Superseded by: —

<!-- Acronyms (first use): SPA = Single-Page Application; DNR = declarativeNetRequest;
     ADR = Architecture Decision Record; WASM = WebAssembly. -->

## Context
YouTube is simultaneously the largest study venue in India (Physics Wallah, Magnet
Brains, Khan Academy India, LearnoHub) and the largest distraction target. A
domain-level verdict fails in both directions: block youtube.com and you block the
classroom; allow it and you allow the playground. The pack schema already carries
the fix's data — `allow_yt_channels` and `yt_policy` (spec 003A) — so spec 004A
adds one origin-specific resolution step to the filtering pipeline (spec 004). Two
constraints shape it: the content-script budget stays < 4 ms p95 and channel
resolution must add ≤ 1 ms (measured **0.004 ms** p95), and the consumer profile's
default is fail-open (ADR-0001) — which is exactly wrong for YouTube's base rate.

## Decision
We will make the verdict unit on YouTube the **channel** (and content format), not
the domain, resolved in pipeline step 2.5 (after the pack allow_domains fast path,
before the gate-list). On `/watch`, the content script reads the channel_id from
page metadata and the worker does an exact-string set lookup against the active
pack's `allow_yt_channels`: in-set → `allow` (tagged with the channel's subjects);
not-in-set → `quiz_gate`. `/shorts` is a **format-level** decision per
`yt_policy.shorts` (default gate), independent of channel and of earned time.
Homepage/search/channel pages → `allow_navigation` (browsable, never written to
reading-history, never weighted). Embeds (`youtube-nocookie.com`) → `inherit_parent`.
Because YouTube is an SPA, the content script **re-resolves on every in-page hop**
(`yt-navigate-finish`) — DNR cannot see client-side navigations. And we make one
explicit exception to ADR-0001's consumer fail-open default: an **unresolved
`/watch` fails closed** (routes to the gate), because unknown-YouTube is
overwhelmingly entertainment. No core-wasm change — this is pure pipeline logic
plus a pack set lookup (004A A6).

## Alternatives considered
| Option | Why rejected (one honest sentence) |
|---|---|
| Domain-level verdict for youtube.com | Fails in both directions — blocks the classroom or allows the playground; the whole reason 004A exists. |
| DNR rules only (no script step) | DNR cannot read a channel_id and cannot see SPA hops, so it can neither allow a specific channel nor re-gate a watch→watch jump. |
| Classify the video via WASM on its title/description | Title text is manipulable and ambiguous; the channel_id is the authoritative, unforgeable identity, so a set lookup beats classification here. |
| Fail *open* on unresolved YouTube (consistent with ADR-0001) | YouTube's base rate is entertainment, so fail-open there re-opens the exact hole 004A closes; a YouTube-scoped fail-closed exception is the honest call. |
| Gate all of youtube.com during study hours, allow via earned time | Punishes the legitimate use (a Physics Wallah lecture *is* the schoolwork) and trains kids to burn earned time on studying. |

## Consequences
- **Positive:** The classroom-vs-playground problem is solved with the child's real
  study channels playing untouched and everything else gated; channel resolution is
  effectively free (0.004 ms p95, ~250× under the 1 ms budget); no WASM change, so
  the 116 KB core and its benchmarks are unaffected; the full A1 matrix is unit-tested.
- **Negative / accepted debt:**
  - **Resolution depends on YouTube's DOM.** The channel_id comes from a
    `meta[itemprop="channelId"]` read; if YouTube renames or removes it, resolution
    fails and — because we fail closed on YouTube — **every** `/watch` gates until the
    selector is fixed. Fail-closed is the safe direction, but it's a brittle coupling
    to a third party's markup; `resolution_failure` is logged locally for maintenance.
  - **SPA staleness race.** On `yt-navigate-finish` the channel meta may briefly lag
    the new video, so a hop to a non-allowed channel could be allowed for a beat before
    the next resolution. Acceptable for beta; a settling delay or a stronger signal is the fix.
  - **`yt_policy.shorts: "inherit"` is treated as gate** for now (no channel-level Shorts
    resolution yet) — a conservative default, documented so a future value isn't assumed live.
  - **The allowlist is inert until channel_ids are verified.** Seed packs still ship
    placeholder channel_ids (spec 003A A5), so in practice today every `/watch` gates;
    real ids are a human-curation prerequisite before this policy does anything useful.
- **Revisit when:** YouTube changes the channelId metadata surface; OR earned-time
  (spec 005) needs the Shorts-stays-gated exclusion wired into its allow token; OR a
  measured SPA staleness bug demands a stronger navigation signal.

## Interview note
The headline is "filter YouTube without blocking the classroom," and the answer is a
separation-of-identity move: on `/watch` the verdict key is the channel_id — an exact,
unforgeable identifier — matched against the family's curriculum pack, not the video's
title or the domain. The two decisions I'd defend hardest are the two exceptions to our
own defaults: Shorts gate by *format* regardless of channel (a Physics Wallah Short is
still a dopamine slot machine), and unresolved YouTube fails *closed* even though the
consumer profile is fail-open everywhere else — because on YouTube specifically the base
rate is entertainment, so the honest default flips. The cost I'd name upfront is the
brittle coupling to YouTube's DOM: fail-closed keeps a selector break safe, but it means
a markup change can gate the whole site until we ship a new selector.
