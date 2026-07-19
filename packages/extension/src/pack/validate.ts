// Runtime pack validator (spec 003 R3, amendment 003A A8).
//
// Why hand-written and not ajv: the extension ships with ZERO runtime
// dependencies (see packages/extension/package.json) and a hard bundle-size
// discipline — ajv would be the first runtime dep and the largest. So the
// loader validates with this small, allocation-light checker, and ./schema.json
// stays the contract of record. The ajv cross-check in validate.test.ts (ajv is
// a devDependency) proves this validator never under-rejects relative to the
// schema, so the two cannot silently drift. ADR-0004 records the trade-off.
//
// This mirrors schema.json rule-for-rule, plus two constraints JSON Schema
// draft-07 cannot express and which this validator owns:
//   • per-key channel uniqueness (duplicate channel_id) — 003A A8
//   • serialized size cap (≤ 2MB) — R3
// Success returns a normalized Pack with yt_policy defaults applied (003A A2).

import {
  DEFAULT_YT_POLICY,
  PACK_MAX_BYTES,
  type Pack,
  type YtChannel,
  type Keyword,
} from "./types.js";

export interface ValidationError {
  /** Dotted path to the offending value, e.g. `allow_yt_channels[2].channel_id`. */
  path: string;
  /** Stable, machine-checkable reason code (asserted in tests). */
  code: string;
  /** Human-readable detail. */
  message: string;
}

export type ValidateResult = { ok: true; pack: Pack } | { ok: false; errors: ValidationError[] };

// --- field patterns (identical to schema.json) ------------------------------
const RE_ID = /^[a-z0-9][a-z0-9-]{1,62}$/;
const RE_VERSION = /^\d+\.\d+\.\d+$/;
const RE_LOCALE = /^[a-z]{2}(-[A-Z]{2})?$/;
const RE_DOMAIN = /^([a-z0-9-]+\.)+[a-z]{2,}$/;
const RE_CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;
const RE_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

const TOP_LEVEL_KEYS = new Set([
  "id",
  "version",
  "locale",
  "board",
  "grade_band",
  "tags",
  "allow_domains",
  "allow_keywords",
  "allow_yt_channels",
  "quiz_topics",
  "updated_at",
  "yt_policy",
  "signature",
]);

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === "string";

/**
 * Validate an untrusted parsed pack. Never throws; every failure is collected
 * into `errors`. On success, returns a normalized Pack (yt_policy defaulted).
 */
export function validatePack(raw: unknown): ValidateResult {
  const errors: ValidationError[] = [];
  const err = (path: string, code: string, message: string) => errors.push({ path, code, message });

  // Size cap first — cheap guard against a pathological input (R3). Uses the
  // serialized byte length, matching how the pack is stored.
  try {
    const bytes = new TextEncoder().encode(JSON.stringify(raw)).length;
    if (bytes > PACK_MAX_BYTES) {
      err("", "size_exceeded", `pack is ${bytes} bytes, over the ${PACK_MAX_BYTES} cap`);
    }
  } catch {
    err("", "unserializable", "pack is not JSON-serializable");
  }

  if (!isObject(raw)) {
    err("", "not_object", "pack must be a JSON object");
    return { ok: false, errors };
  }

  for (const k of Object.keys(raw)) {
    if (!TOP_LEVEL_KEYS.has(k)) err(k, "unknown_field", `unknown field: ${k}`);
  }

  const reqString = (key: keyof Pack, re: RegExp | null, min = 1, max = Infinity) => {
    const v = raw[key as string];
    if (!isString(v)) return err(key as string, "type", `${String(key)} must be a string`);
    if (v.length < min || v.length > max)
      return err(key as string, "length", `${String(key)} length out of range`);
    if (re && !re.test(v)) err(key as string, "pattern", `${String(key)} fails ${re}`);
  };

  reqString("id", RE_ID);
  reqString("version", RE_VERSION);
  reqString("locale", RE_LOCALE);
  reqString("board", null, 1, 64);
  reqString("grade_band", null, 1, 16);
  reqString("updated_at", RE_DATETIME);

  // tags: non-empty array of non-empty strings
  const tags = raw.tags;
  if (!Array.isArray(tags) || tags.length < 1) {
    err("tags", "type", "tags must be a non-empty array");
  } else {
    tags.forEach((t, i) => {
      if (!isString(t) || t.length < 1) err(`tags[${i}]`, "type", "tag must be a non-empty string");
    });
  }

  // allow_domains: array of host strings
  const domains = raw.allow_domains;
  if (!Array.isArray(domains)) {
    err("allow_domains", "type", "allow_domains must be an array");
  } else {
    domains.forEach((d, i) => {
      if (!isString(d) || !RE_DOMAIN.test(d))
        err(`allow_domains[${i}]`, "pattern", `not a bare host: ${String(d)}`);
    });
  }

  // allow_keywords: array of { term, tag }
  const keywords = raw.allow_keywords;
  if (!Array.isArray(keywords)) {
    err("allow_keywords", "type", "allow_keywords must be an array");
  } else {
    keywords.forEach((kw, i) => {
      const p = `allow_keywords[${i}]`;
      if (!isObject(kw)) return err(p, "type", "keyword must be an object");
      for (const k of Object.keys(kw))
        if (k !== "term" && k !== "tag") err(`${p}.${k}`, "unknown_field", `unknown field: ${k}`);
      if (!isString(kw.term) || kw.term.length < 1 || kw.term.length > 128)
        err(`${p}.term`, "type", "term must be a 1–128 char string");
      if (!isString(kw.tag) || kw.tag.length < 1)
        err(`${p}.tag`, "type", "tag must be a non-empty string");
    });
  }

  // allow_yt_channels: array of channel objects; channel_id unique (003A A8)
  const channels = raw.allow_yt_channels;
  if (!Array.isArray(channels)) {
    err("allow_yt_channels", "type", "allow_yt_channels must be an array");
  } else {
    const seen = new Set<string>();
    channels.forEach((ch, i) => {
      const p = `allow_yt_channels[${i}]`;
      if (!isObject(ch)) return err(p, "type", "channel must be an object");
      for (const k of Object.keys(ch))
        if (!["channel_id", "handle", "label", "subjects"].includes(k))
          err(`${p}.${k}`, "unknown_field", `unknown field: ${k}`);
      if (!isString(ch.channel_id) || !RE_CHANNEL_ID.test(ch.channel_id)) {
        err(`${p}.channel_id`, "pattern", `channel_id must match ${RE_CHANNEL_ID}`);
      } else if (seen.has(ch.channel_id)) {
        err(`${p}.channel_id`, "duplicate_channel", `duplicate channel_id: ${ch.channel_id}`);
      } else {
        seen.add(ch.channel_id);
      }
      if (!isString(ch.handle) || ch.handle.length < 1)
        err(`${p}.handle`, "type", "handle must be a non-empty string");
      if (!isString(ch.label) || ch.label.length < 1)
        err(`${p}.label`, "type", "label must be a non-empty string");
      if (!Array.isArray(ch.subjects)) {
        err(`${p}.subjects`, "type", "subjects must be an array");
      } else {
        ch.subjects.forEach((s, j) => {
          if (!isString(s) || s.length < 1)
            err(`${p}.subjects[${j}]`, "type", "subject must be a non-empty string");
        });
      }
    });
  }

  // quiz_topics: array of non-empty strings
  const topics = raw.quiz_topics;
  if (!Array.isArray(topics)) {
    err("quiz_topics", "type", "quiz_topics must be an array");
  } else {
    topics.forEach((t, i) => {
      if (!isString(t) || t.length < 1)
        err(`quiz_topics[${i}]`, "type", "topic must be a non-empty string");
    });
  }

  // yt_policy: optional object with enum'd fields
  if (raw.yt_policy !== undefined) {
    const yp = raw.yt_policy;
    if (!isObject(yp)) {
      err("yt_policy", "type", "yt_policy must be an object");
    } else {
      for (const k of Object.keys(yp))
        if (k !== "shorts" && k !== "embeds")
          err(`yt_policy.${k}`, "unknown_field", `unknown field: ${k}`);
      if (!["gate", "allow", "inherit"].includes(yp.shorts as string))
        err("yt_policy.shorts", "enum", "shorts must be gate|allow|inherit");
      if (yp.embeds !== "inherit_parent")
        err("yt_policy.embeds", "enum", "embeds must be inherit_parent");
    }
  }

  // signature: optional, reserved — must be a string if present, never verified
  if (raw.signature !== undefined && !isString(raw.signature))
    err("signature", "type", "signature must be a string");

  if (errors.length > 0) return { ok: false, errors };

  // Normalize: fill yt_policy defaults so downstream code reads one shape.
  const pack: Pack = {
    id: raw.id as string,
    version: raw.version as string,
    locale: raw.locale as string,
    board: raw.board as string,
    grade_band: raw.grade_band as string,
    tags: raw.tags as string[],
    allow_domains: raw.allow_domains as string[],
    allow_keywords: raw.allow_keywords as Keyword[],
    allow_yt_channels: raw.allow_yt_channels as YtChannel[],
    quiz_topics: raw.quiz_topics as string[],
    updated_at: raw.updated_at as string,
    yt_policy: (raw.yt_policy as Pack["yt_policy"]) ?? { ...DEFAULT_YT_POLICY },
    ...(isString(raw.signature) ? { signature: raw.signature } : {}),
  };

  return { ok: true, pack };
}
