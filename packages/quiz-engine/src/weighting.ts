// Topic weighting from reading-history (spec 005 R2).
//
// The gate's questions are drawn preferentially from what the child actually
// read recently. The input is the spec-004 reading-history buffer — origin
// SUBJECT TAGS only, never page text (privacy). This tallies how often each
// topic appeared in the last 24h; the selector turns those counts into weights.

import { WEIGHTING_WINDOW_MS } from "./constants.js";

/** One reading-history entry (mirrors the extension's ReadingEntry shape). */
export interface ReadingRecord {
  tags: string[];
  at: string; // ISO-8601
}

/** Map of topic → recent read count, within `windowMs` of `now`. */
export function topicWeights(
  history: ReadingRecord[],
  now: number,
  windowMs: number = WEIGHTING_WINDOW_MS,
): Map<string, number> {
  const weights = new Map<string, number>();
  for (const entry of history) {
    const t = Date.parse(entry.at);
    if (Number.isNaN(t) || now - t > windowMs || t > now) continue;
    for (const tag of entry.tags) {
      weights.set(tag, (weights.get(tag) ?? 0) + 1);
    }
  }
  return weights;
}
