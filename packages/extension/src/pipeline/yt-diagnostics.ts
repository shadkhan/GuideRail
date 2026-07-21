// YouTube resolution diagnostics (spec 004A A3).
//
// When the content script can't read a /watch page's channel_id (YouTube changed
// its markup, or the page hasn't hydrated), the pipeline fails closed — but A3
// also requires the failure be "logged locally for pack/selector maintenance".
// A worker console line dies with the ephemeral service worker, so the signal is
// persisted here: a maintainer can later read this buffer to detect that the
// channelId selector has broken (a spike of failures) rather than discovering it
// only from user reports. Capped so it never grows unbounded.

import * as storage from "../storage.js";

const MAX_ENTRIES = 200;

export async function recordResolutionFailure(url: string, now = new Date()): Promise<void> {
  const list = (await storage.get("yt.resolutionFailures")) ?? [];
  list.push({ url, at: now.toISOString() });
  await storage.set("yt.resolutionFailures", list.slice(-MAX_ENTRIES));
}

export async function getResolutionFailures(): Promise<Array<{ url: string; at: string }>> {
  return (await storage.get("yt.resolutionFailures")) ?? [];
}
