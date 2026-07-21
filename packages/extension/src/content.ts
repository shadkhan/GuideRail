// Content script (spec 004 R3/R5 · 004A · spec 006 blur blanket).
//
// Runs at document_start (manifest). Two jobs:
//   1. Blur blanket (spec 006): SYNCHRONOUSLY, before first paint, activate the
//      whole-page blur (add `.gr-blur-active` to <html>) unless the origin is
//      statically trusted — so an unsafe thumbnail never flashes. blur.css does
//      the actual blurring; this script only ever REVEALS (whole-page on a
//      trusted verdict, or per-element after the guard validates each image).
//   2. Filtering (spec 004): extract page METADATA only (never full DOM text),
//      message the worker for a verdict, and re-evaluate on YouTube SPA =
//      Single-Page Application navigation.
//
// It stays a thin DOM shell — all policy/trust logic lives in the pure modules
// (pipeline/*, blur/*) so it's unit-tested off the DOM.

import { isYouTubeHost } from "./pipeline/youtube.js";
import { sendPageEval, type PageEvalRequest } from "./messages.js";
import { ACTIVATION_CLASS } from "./blur/activate.js";
import { isTrustedStatic } from "./blur/trusted-static.js";
import { classifyMedia, runInChunks, type MediaLike, type Scheduler } from "./blur/guard.js";

// --- Blur activation: SYNCHRONOUS at document_start, before any img exists -----
// Statically-trusted study origins never activate blur at all (no flash). Every
// other origin blurs by default; the worker's verdict then reveals (see below).
if (!isTrustedStatic(location.hostname)) {
  document.documentElement.classList.add(ACTIVATION_CLASS);
}

const UNBLUR_CHUNK = 50;
const rafSchedule: Scheduler = (fn) => requestAnimationFrame(fn);

function removeWholePageBlur(): void {
  document.documentElement.classList.remove(ACTIVATION_CLASS);
}

function toMediaLike(el: HTMLImageElement | HTMLVideoElement): MediaLike {
  if (el instanceof HTMLVideoElement) {
    return {
      tag: "video",
      src: el.currentSrc || el.src || "",
      width: el.videoWidth,
      height: el.videoHeight,
    };
  }
  return {
    tag: "img",
    src: el.currentSrc || el.src || "",
    width: el.naturalWidth,
    height: el.naturalHeight,
  };
}

/** Add .gr-safe iff the element is safe; retry once on load if size wasn't known yet. */
function revealIfSafe(el: HTMLImageElement | HTMLVideoElement, pageHost: string): void {
  if (classifyMedia(toMediaLike(el), pageHost) === "reveal") {
    el.classList.add("gr-safe");
    return;
  }
  // A cross-origin element whose intrinsic size wasn't known yet (e.g. a small
  // icon not decoded) may become safe once loaded — re-check exactly once.
  if (el instanceof HTMLImageElement && !el.complete) {
    el.addEventListener(
      "load",
      () => {
        if (classifyMedia(toMediaLike(el), pageHost) === "reveal") el.classList.add("gr-safe");
      },
      { once: true },
    );
  }
}

/** Per-element guard for a page that loaded but isn't fully trusted (R3/R4/R5). */
function runPerElementGuard(): void {
  const pageHost = location.hostname;
  const t = performance.now();
  const els = Array.from(
    document.querySelectorAll<HTMLImageElement | HTMLVideoElement>("img, video"),
  );
  runInChunks(els, UNBLUR_CHUNK, (el) => revealIfSafe(el, pageHost), rafSchedule);
  console.log(`[gr-bench] unblur count=${els.length} scan=${(performance.now() - t).toFixed(3)}ms`);

  // Late-added nodes: reveal-only (never blur), so a missed mutation fails safe (R5).
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node instanceof HTMLImageElement || node instanceof HTMLVideoElement) {
          revealIfSafe(node, pageHost);
        } else if (node instanceof Element) {
          node
            .querySelectorAll<HTMLImageElement | HTMLVideoElement>("img, video")
            .forEach((el) => revealIfSafe(el, pageHost));
        }
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

// --- Filtering (spec 004) ----------------------------------------------------
function readDescription(): string {
  return document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
}

/** YouTube exposes the canonical channel on a microdata meta tag (004A). */
function readYtChannelId(): string | null {
  return document.querySelector('meta[itemprop="channelId"]')?.getAttribute("content") ?? null;
}

async function evaluatePage(): Promise<void> {
  const t = performance.now();
  const onYouTube = isYouTubeHost(location.hostname);
  const request: PageEvalRequest = {
    kind: "page.eval",
    url: location.href,
    title: document.title ?? "",
    description: readDescription(),
    ...(onYouTube ? { yt: { channelId: readYtChannelId() } } : {}),
  };
  console.log(`[gr-bench] extract=${(performance.now() - t).toFixed(3)}ms`);

  try {
    const res = await sendPageEval(request);
    // quiz_gate verdicts redirect the tab (worker-side); nothing to do here.
    // Blur (spec 006): a trusted verdict reveals the whole page; a fail-open
    // unknown page keeps the blanket and validates each image individually.
    if (res.action === "gate") return;
    if (res.reveal) removeWholePageBlur();
    else runPerElementGuard();
  } catch {
    // Worker unavailable (asleep/tearing down). Leave the blur as-is: the failure
    // mode is "stays blurred", never a leak.
  }
}

function whenReady(fn: () => void): void {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
}

// Initial evaluation once <head> is parsed (title + meta available).
whenReady(() => void evaluatePage());

// YouTube navigates client-side without a reload, so re-evaluate on each in-page
// hop (spec 004A A2): a watch→watch jump to a non-allowed channel must re-gate.
if (isYouTubeHost(location.hostname)) {
  document.addEventListener("yt-navigate-finish", () => void evaluatePage());
}
