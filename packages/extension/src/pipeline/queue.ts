// Background-classification queue (spec 004 R6 stub, R7 choke-point).
//
// In the consumer profile, an `unknown` page fails open (loads) but its metadata
// is queued for later classification. There is NO network in Phase 1 — this is a
// local storage stub. But because this queue is the path data would EVER leave
// on, it enforces the choke-point discipline NOW: metadata is scrubbed through
// sanitize() (the single PII = Personally Identifiable Information exit) before
// it is ever written. When the real backend arrives (Phase 2+) the egress point
// is already clean.

import * as storage from "../storage.js";
import { ensureCore } from "../core.js";

const MAX_ENTRIES = 1000;

export async function enqueueForClassification(text: string, now = new Date()): Promise<void> {
  const core = await ensureCore();
  const scrubbed = core.sanitize(text); // R7: scrub before it can ever egress
  const queue = (await storage.get("classify.queue")) ?? [];
  queue.push({ text: scrubbed, at: now.toISOString() });
  await storage.set("classify.queue", queue.slice(-MAX_ENTRIES));
}
