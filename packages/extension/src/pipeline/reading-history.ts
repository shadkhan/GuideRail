// Reading-history buffer (spec 004A A3, feeds spec 005 quiz topic-weighting).
//
// Allowed reading pages and allowed YouTube channel views append their subject
// tags here at FULL weight (AQ1). Navigation surfaces (YouTube homepage/search)
// deliberately never call this — browsing is not studying. Capped so the buffer
// stays small; weekly weighting only needs recent entries.

import * as storage from "../storage.js";

const MAX_ENTRIES = 500;

export async function appendReading(tags: string[], now = new Date()): Promise<void> {
  if (tags.length === 0) return; // nothing to weight (e.g. allow_domains with no tags)
  const history = (await storage.get("reading.history")) ?? [];
  history.push({ tags, at: now.toISOString() });
  await storage.set("reading.history", history.slice(-MAX_ENTRIES));
}
