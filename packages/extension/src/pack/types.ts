// Curriculum pack schema — the TypeScript view of a pack (spec 003 R1 + 003A).
//
// A pack is DATA, never code: a single JSON file that tells the extension what
// "schoolwork" means for one child. This interface mirrors, field for field,
// the JSON Schema contract in ./schema.json — the schema is the source of
// truth for validation; this type is the source of truth for callers. The two
// are kept from drifting by the ajv cross-check in validate.test.ts.
//
// Reserved-for-later fields (never trusted or acted on in Phase 1): `signature`
// (Phase 3 signed remote delivery) and `yt_policy` (spec 004 Amendment gives it
// meaning). They exist in the schema now so packs can carry them without a
// schema-version bump later.

/** The current pack schema version the loader understands. */
export const PACK_SCHEMA_VERSION = 1 as const;

/** Max serialized pack size the loader will accept (spec 003 R3). */
export const PACK_MAX_BYTES = 2 * 1024 * 1024;

/** YouTube channel-level allow entry (003A A1). channel_id (UC…) is
 *  authoritative for matching; handle/label are parent-facing display. */
export interface YtChannel {
  /** Authoritative match key: `^UC[A-Za-z0-9_-]{22}$`. */
  channel_id: string;
  /** Display handle, e.g. "@KhanAcademyIndia". */
  handle: string;
  /** Parent-facing name. */
  label: string;
  /** Subjects this channel covers; drawn from the pack's `tags`. */
  subjects: string[];
}

/** Optional YouTube policy overrides (003A A2). Semantics land in spec 004
 *  Amendment; reserved now so packs can set it without schema churn. */
export interface YtPolicy {
  shorts: "gate" | "allow" | "inherit";
  embeds: "inherit_parent";
}

/** Default YouTube policy applied when a pack omits `yt_policy` (003A A2). */
export const DEFAULT_YT_POLICY: YtPolicy = {
  shorts: "gate",
  embeds: "inherit_parent",
};

/** One curriculum keyword. `term` is matched in page text; `tag` is the coarse
 *  subject label (∈ pack `tags`) returned when it fires. */
export interface Keyword {
  term: string;
  tag: string;
}

/** A curriculum pack. Field set is fixed by spec 003 R1 + amendment 003A. */
export interface Pack {
  /** Stable identifier, e.g. "cbse-class7". */
  id: string;
  /** Pack content version, semver (`^\d+\.\d+\.\d+$`). */
  version: string;
  /** BCP-47 locale, e.g. "en-IN". */
  locale: string;
  /** Board, e.g. "CBSE" | "ICSE" | "General". */
  board: string;
  /** Per-class grade band (Q2 decision), e.g. "7". */
  grade_band: string;
  /** Subject vocabulary; every keyword `tag` and channel `subject` draws from here. */
  tags: string[];
  /** Allowlisted domains (plain host strings). */
  allow_domains: string[];
  /** Curriculum keywords compiled into the Aho-Corasick automaton at load. */
  allow_keywords: Keyword[];
  /** Channel-level YouTube allowlist (003A). */
  allow_yt_channels: YtChannel[];
  /** Topics the quiz engine (specs 005/012) may quiz on. NOT distraction keywords. */
  quiz_topics: string[];
  /** ISO-8601 date the pack was last updated. */
  updated_at: string;
  /** Optional YouTube policy overrides; defaults applied when absent. */
  yt_policy?: YtPolicy;
  /** Reserved for Phase 3 signed delivery. Present ⇒ ignored (never verified). */
  signature?: string;
}
