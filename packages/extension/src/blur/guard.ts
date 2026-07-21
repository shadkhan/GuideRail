// Per-element unblur guard (spec 006 R3/R4/R6). Pure logic: decide whether a
// single media element is safe to reveal, and a chunked runner that keeps the
// per-frame cost bounded. content.ts does the DOM reads/writes around these.
//
// Trust model v1 (origin + dimension only, no image-content ML): reveal an
// element when it is a small decorative icon, OR its source is same-registrable-
// domain / on a small CDN allowlist. Otherwise keep it blurred (fail safe).
// Size uses INTRINSIC dimensions (naturalWidth/videoWidth) so there is no layout
// read in the hot path (R6).

import { hostMatches } from "../pipeline/gate-list.js";
import { registrableDomain } from "../quiz/scope.js";

/** Below this in BOTH dimensions, an element is treated as a decorative icon. */
export const MIN_MEDIA_PX = 64;

/** Generic image CDNs whose media is treated as same-trust as the page. */
export const CDN_ALLOWLIST: readonly string[] = [
  "gstatic.com",
  "googleusercontent.com",
  "cloudfront.net",
  "akamaihd.net",
  "akamaized.net",
  "cloudinary.com",
  "imgix.net",
  "wp.com",
  "fastly.net",
];

export interface MediaLike {
  tag: "img" | "video";
  /** Resolved absolute source URL, or "" when absent. */
  src: string;
  /** Intrinsic width (naturalWidth / videoWidth), 0 when unknown/unloaded. */
  width: number;
  /** Intrinsic height, 0 when unknown/unloaded. */
  height: number;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null; // data:, blob:, or unresolved
  }
}

/**
 * "reveal" → add .gr-safe (unblur); "keep" → leave blurred. Small icons reveal;
 * larger media reveals only from a trusted source; unknown source/size keeps
 * blurred so the failure mode is always "stays blurred".
 */
export function classifyMedia(
  el: MediaLike,
  pageHost: string,
  cdnAllow: readonly string[] = CDN_ALLOWLIST,
): "reveal" | "keep" {
  // Decorative icon (small in both dimensions) — safe to show.
  if (el.width > 0 && el.height > 0 && el.width < MIN_MEDIA_PX && el.height < MIN_MEDIA_PX) {
    return "reveal";
  }

  const srcHost = hostOf(el.src);
  if (srcHost === null) return "keep"; // data:/blob:/unresolved and not a tiny icon

  // Same registrable domain as the page, or an allowlisted CDN.
  if (registrableDomain(srcHost) === registrableDomain(pageHost)) return "reveal";
  if (cdnAllow.some((d) => hostMatches(srcHost, d))) return "reveal";

  return "keep";
}

/** Schedules a chunk of work; requestAnimationFrame in prod, synchronous in tests. */
export type Scheduler = (fn: () => void) => void;

/**
 * Process `items` in fixed-size chunks, one chunk per scheduled frame, so no
 * single frame does unbounded work (R4). Nothing is read from layout here — the
 * caller's `process` only writes a class.
 */
export function runInChunks<T>(
  items: readonly T[],
  chunkSize: number,
  process: (item: T) => void,
  schedule: Scheduler,
): void {
  if (items.length === 0) return;
  let i = 0;
  const step = (): void => {
    const end = Math.min(i + chunkSize, items.length);
    for (; i < end; i++) process(items[i]!);
    if (i < items.length) schedule(step);
  };
  schedule(step);
}
