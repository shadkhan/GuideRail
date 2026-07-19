// Content script — stub.
//
// Content scripts run inside the web page's DOM context. This one runs
// at `document_start` — before the HTML parser has processed any content,
// so styles it injects apply BEFORE any images or videos render. Per
// Learning L-002 (docs/LEARNINGS.md), that timing is what makes the
// blur-blanket safe: images blur by CSS the instant the page starts
// loading, then this script REMOVES the blur (adds .gr-safe) only for
// elements the service worker has validated.
//
// Critical invariant: JS never ADDS blur — only removes it. Blur is a
// CSS declaration in the manifest (see static/blur.css). Adding blur
// via JS + MutationObserver creates a race: a fast-loading image can
// paint before the observer fires. Removing blur post-validation is
// safe because the failure mode is "stays blurred" — visible to the
// user, never a leaked unsafe image.

// TODO(spec 006 — blur blanket): extract page metadata (title, meta
// description, URL tokens), send it to the service worker via a typed
// ClassifyRequest message, then on an "allow" verdict, walk the DOM
// and add .gr-safe to img/video elements in requestAnimationFrame-
// batched chunks (< 16.6ms per frame to hit the main-thread budget
// from CLAUDE.md).
