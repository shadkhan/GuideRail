// Shared pipeline value types (spec 004 / 004A). No imports — kept dependency-free
// so both the storage layer and the pure pipeline can use them without cycles.

/** Filtering posture. `consumer` fails open on unknown; `institutional` fails closed. */
export type Profile = "consumer" | "institutional";

/** What the WASM classifier returns for a page. */
export type ClassifyVerdict = "allow" | "quiz_gate" | "unknown";

/** The pipeline's final verdict. Adds `allow_navigation` (YouTube browse surfaces). */
export type PolicyVerdict = "allow" | "quiz_gate" | "unknown" | "allow_navigation";

/** A per-origin memoized classify result (spec 004 R3, TTL 24h). */
export interface CachedClassify {
  verdict: ClassifyVerdict;
  matches: string[];
  /** Epoch ms after which this entry is stale. */
  expiresAt: number;
}

/** One entry in the reading-history buffer that feeds quiz topic-weighting (spec 005). */
export interface ReadingEntry {
  tags: string[];
  at: string;
}

/** One entry in the local background-classification queue (spec 004 R6 stub). */
export interface QueueEntry {
  /** Already sanitize()-scrubbed (spec 004 R7 choke-point discipline). */
  text: string;
  at: string;
}
