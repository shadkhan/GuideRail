# 0005. Earned time is a storage token revoked by chrome.alarms, graded worker-side, forgeable-by-design on unmanaged devices
Date: 2026-07-20 | Status: Accepted | Supersedes: — | Superseded by: —

<!-- Acronyms (first use): DNR = declarativeNetRequest; MV3 = Manifest V3;
     SW = service worker; PSL = Public Suffix List; ADR = Architecture Decision
     Record; MCQ = multiple-choice question. -->

## Context
Spec 005 is the product's core loop: a gated distraction becomes three questions
from the child's own recent reading, and a pass earns a visible, self-expiring
window (default 30 min; parent-set 15/30/45). The hard constraints: the MV3
service worker is killed after ~30s idle, so no in-memory timer can hold the
countdown; DNR carries a low rule budget and cannot express time-of-day; and the
adversary here is, uncomfortably, a child who may control the device. ADR-0002's
threat model already names client-side tamper as in-scope-but-accepted for the
consumer profile, and the product's stated philosophy is "make bypass
unnecessary, not impossible." This ADR settles how the token is represented,
enforced, revoked, and how the quiz is graded — before the parent dashboard
(Phase 2) and managed hardening (Phase 4) build on it.

## Decision
We will represent earned time as a plain token `{scope, grantedAt, expiresAt}`
in `chrome.storage.local`, where `scope` is the src's registrable domain (the
origin-group). Enforcement splits by how a domain is gated: **gate-list domains**
(DNR redirect, no content script) get a **DNR session allow-rule** with priority
above the redirect; **YouTube and classify-distraction pages** (content-script
driven) are allowed by a pipeline `hasEarnedTime()` check, **except YouTube
Shorts**, which stay gated by format (004A AQ2). Expiry is one `chrome.alarms`
alarm per token; a second 1-minute alarm drives the countdown **badge**; both are
recomputed by an idempotent **reconcile-from-storage** on worker wake, so nothing
depends on the worker having stayed alive (never `setTimeout`). Quizzes are drawn
from a **hand-written MCQ bank** (no LLM in v1, for groundedness) and **graded
worker-side** — the attempt's questions and answer keys live in
`chrome.storage.session` keyed by an `attemptId`; the page receives questions
with the answer key stripped. A fail is never a hard lockout: grace mode names
the topic to revisit and stores a retry-not-before timestamp (10 min).

## Alternatives considered
| Option | Why rejected (one honest sentence) |
|---|---|
| `setTimeout` / module-scope countdown | Both die with the ~30s-killed worker; only `chrome.alarms` + storage survive (L-014). |
| Signed / JWT earned-time token | The signing key would have to live on the same device the child controls, so a signature proves nothing here — it's theatre, not security. |
| Grade in the page (send answer keys down) | Puts the answers in the page DOM where any child can read them; worker-side grading at least keeps the key off the page. |
| LLM-generated questions now | Groundedness and cost risk for v1; a hand-written bank is verifiably on-syllabus, and LLM generation is deferred to Phase 2 (ADR-0009). |
| Gate all of YouTube, unlock via earned time | Punishes the legitimate lecture and trains kids to spend earned time on studying; earned time must unlock *distraction*, not schoolwork. |
| Full PSL for scope grouping | Too heavy for the bundle; a small ccTLD-second-level heuristic covers our domains, with documented edge cases. |

## Consequences
- **Positive:** The whole loop works end-to-end and survives the ephemeral worker
  by reconciling from storage; the countdown is visible (badge + page) and expires
  with zero parental intervention; questions are grounded in the child's own
  reading via the spec-004 reading-history weighting; grace mode avoids the
  1-star-review hard-lockout failure; grading worker-side keeps answer keys off the page.
- **Negative / accepted debt:**
  - **Forgeable on an unmanaged device — stated plainly.** The token is ordinary
    `chrome.storage.local`; a child with DevTools can write themselves a token, or
    inspect `chrome.storage.session` to read an attempt's answer keys before
    submitting. Worker-side grading and the storage indirection raise the effort,
    but nothing here is tamper-proof in a normal Chrome profile. This is the
    documented residual risk (ADR-0002, IQ-007); real enforcement needs the
    managed/force-installed profile of Phase 4. The bet is behavioural: for most
    kids, earning honestly is easier than the bypass.
  - **Scope heuristic is not the PSL.** `registrableDomain` handles `*.gov.in` and
    the common cases but will mis-group exotic multi-label TLDs; acceptable for the
    gate-list + YouTube domains in play, revisit if a mis-grouped site appears.
  - **Badge is global, not per-tab** — it shows the largest remaining window across
    all scopes, so two concurrent tokens share one number. Minor UX imprecision.
  - **DNR allow-rule id is a hash of the scope** (`hash(scope) % 9999`), with no
    collision handling — two simultaneously-earned scopes that hash-collide would
    overwrite each other's session allow-rule (an availability bug, not a security
    one). Extremely unlikely for the handful of gate-list domains in play; a
    scope→id allocation map is the fix if it ever bites.
  - **One shared Class-7 bank across all three seed packs** (they are all Class 7);
    per-board banks are a later refinement, so the questions aren't board-specific yet.
- **Revisit when:** the Phase 4 managed profile lets us harden against local tamper
  (the token model may gain a server-checked component then); OR LLM question
  generation lands (Phase 2 / ADR-0009); OR the bank grows to per-board / per-class banks.

## Interview note
The honest headline is that this is a *behavioural* control, not a cryptographic
one: earned time is a token in local storage, and on a device the child controls,
local storage is editable — a signed token wouldn't help because the signing key
would live on that same device. So I spent the security budget where it actually
buys something: grading happens in the worker with the answer key held in session
storage, never shipped to the page, and the whole timer/revocation runs on
chrome.alarms with reconcile-from-storage so it survives the MV3 worker's 30-second
idle-kill instead of dying with a setTimeout. The residual risk — forgeable on an
unmanaged profile — I'd state up front, because the product's own promise is "make
bypass unnecessary, not impossible," and the real enforcement story is the
managed, force-installed profile in the institutional phase.
