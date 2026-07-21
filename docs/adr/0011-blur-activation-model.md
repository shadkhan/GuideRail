# 0011. Blur is activated by an <html> class at document_start, gated by a static trusted set, then refined async
Date: 2026-07-21 | Status: Accepted | Supersedes: — | Superseded by: —

<!-- Acronyms (first use): CSS = Cascading Style Sheets; DOM = Document Object
     Model; ML = Machine Learning; CDN = Content Delivery Network; ADR =
     Architecture Decision Record; SW = service worker. -->

## Context
Spec 006 must hide `img`/`video` on unknown pages BEFORE first paint — no unsafe
thumbnail may ever flash — yet NOT blur trusted study pages at all (the filmstrip
acceptance says zero blur on Khan Academy). The bind: the activation decision
needs study-hours and origin-trust, but both live in async `chrome.storage`, which
a content script cannot read synchronously at `document_start`. The performance
budget is the usual < 16.6 ms main-thread per operation, and R6 forbids layout
reads (`getComputedStyle`/`offsetWidth`) in the unblur loop. This decides how the
blanket is activated, revealed, and how each image is judged — implementing the
L-002 inversion (blur by default, JS only reveals).

## Decision
Blur is a CSS rule scoped under an activation class on `<html>`
(`html.gr-blur-active img, video { filter: blur(30px) brightness(0.5) }`), so it
is atomic with the initial paint and the content script never blurs an element
directly (L-002). The content script, running synchronously at `document_start`,
adds `.gr-blur-active` UNLESS the origin is in a small **bundled static trusted
set** (the 003A study base) — so common study origins never activate blur and
never flash. Once the worker's `page.eval` verdict arrives it carries a `reveal`
flag: `reveal = true` (allow-domain, classify-allow, YouTube-allow, earned-time,
outside-hours, navigation) removes the whole-page class; `reveal = false` (only
the consumer `fail-open-unknown` case) keeps the blanket and runs a **per-element
guard**. The guard reveals an element (adds `.gr-safe`) iff it is a small
decorative icon (< 64 px both sides) OR its source is the same registrable domain
/ on a small CDN allowlist — using INTRINSIC size (`naturalWidth`/`videoWidth`,
no layout read, R6), in `requestAnimationFrame` chunks (R4), with a
MutationObserver that can only reveal late-added nodes (R5). Scope is img/video
only; CSS background-images and any image-content ML are out of scope for v1.

## Alternatives considered
| Option | Why rejected (one honest sentence) |
|---|---|
| Per-element `.gr-blur` added by JS after load | Races the image decode — a fast image paints unblurred before the script runs; the ancestor-class-at-document_start design is atomic with paint (L-002). |
| Blur every page, then async-remove if trusted | On a trusted origin the removal races image decode, so Khan Academy could flash blurred — fails the "no blur ever on trusted" acceptance; the static set avoids activating at all. |
| Read allow_domains from chrome.storage at document_start | chrome.storage is async — there is no synchronous read before first paint, so a storage-based decision cannot beat the paint. |
| Dimension heuristic via getComputedStyle/offsetWidth | Forces layout on every candidate image — blows the per-frame budget (R6); intrinsic naturalWidth is free of layout. |
| Image-content ML / NSFW model | Heavy, needs a model in the client and per-image inference; v1 is origin + dimension trust only, ML deferred. |
| Blur CSS background-images too | Detecting them needs computed-style walks (layout reads, R6 violation) for a minority of media; deferred to a later spec. |

## Consequences
- **Positive:** No unsafe thumbnail can paint unblurred on an untrusted page (blur
  is live from document_start); trusted study origins show zero blur because the
  static set means they never activate it; the reveal path is class-toggle only
  (no layout thrash), chunked under the frame budget, and fails safe in every
  direction (worker crash, missed mutation, unknown source, unloaded size → stays blurred).
- **Negative / accepted debt:**
  - **The static trusted set covers pack allow_domains, but NOT verdict-cache
    allows.** The bundled set is the union of the seed packs' allow_domains (kept
    in sync by a drift test), so every active (bundled) pack's allow_domains is
    flash-free. But R2 also names "allow-verdict cached origins" — an origin the
    WASM classifier previously allowed that is NOT in any pack's allow_domains.
    That verdict cache lives in async chrome.storage, unreadable at document_start,
    so such an origin briefly blurs on each visit before the async `reveal:true`
    removes it. A real, if minor, flash on repeat visits to a classify-allowed
    third-party page; inherent to the sync/async gap. A future remote pack's
    domains would have the same one-visit flash until added to the bundled set.
  - **Cross-origin small icons that hadn't decoded at scan time stay blurred** until
    a one-shot `load` re-check (images) fires; a cross-origin video's late size is
    not re-checked. Minor cosmetic blurring of tiny decorative media, never a leak.
  - **Background-images and canvas/WebGL content are unprotected** in v1 (Q2 / spec
    out-of-scope) — an unsafe image set via CSS `background` or drawn to a canvas is
    not blurred. A real gap, deferred deliberately.
  - **Trust is origin + dimension only** — a large unsafe image hosted on the page's
    own domain (or an allowlisted CDN) is revealed; without content ML we trust the source.
- **Revisit when:** background-image/canvas coverage is needed; OR image-content ML
  is added (would change the guard from source-trust to content-trust); OR remote
  packs ship and the static trusted set needs to track the active pack's domains.

## Interview note
The whole problem is a race between the network and a decision that depends on
async state. You cannot read chrome.storage synchronously before first paint, so
you cannot know at document_start whether this origin is trusted — which means the
honest choices are "blur everything then reveal" (flashes trusted pages) or "blur
by default unless a synchronously-knowable static set says otherwise." I took the
second: a small bundled list of the common study origins makes Khan Academy
flash-free, and the worker's async verdict corrects everything else a beat later.
The other half is keeping the reveal cheap — intrinsic image sizes instead of
layout reads, class-toggles batched across frames, and a MutationObserver that can
only ever un-blur, so the failure mode of every path is "stays blurred," never a leak.
