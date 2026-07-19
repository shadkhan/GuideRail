/* eslint-disable @typescript-eslint/no-explicit-any -- fixtures deliberately
   mutate arbitrary nested fields to build invalid packs; `any` is the point. */
// Pack validation suite (spec 003 R3, amendment 003A A8).
//
// Two jobs:
//   1. Cross-check: the hand-written validatePack() must agree with ajv run
//      against schema.json on every schema-expressible rule, so the runtime
//      validator can't silently drift from the contract (ADR-0004). ajv is a
//      devDependency — it never ships in the extension bundle.
//   2. Owner rules: the two constraints JSON Schema draft-07 cannot express —
//      per-key channel uniqueness and the byte-size cap — are validatePack's
//      alone; they're tested directly, not via the cross-check.

import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import schema from "./schema.json";
import { validatePack } from "./validate.js";
import { DEFAULT_YT_POLICY, PACK_MAX_BYTES } from "./types.js";
import cbse from "./seeds/cbse-class7.json";

const ajv = new Ajv({ allErrors: true });
const ajvValidate = ajv.compile(schema);

/** Deep clone of a known-good pack, to mutate per case. */
const good = (): Record<string, unknown> => structuredClone(cbse) as Record<string, unknown>;

describe("validatePack ≡ schema.json (ajv cross-check)", () => {
  const cases: Array<[string, (p: any) => void]> = [
    ["a valid pack passes", () => {}],
    ["missing required field (id)", (p) => delete p.id],
    ["bad version format", (p) => (p.version = "1.0")],
    ["bad locale format", (p) => (p.locale = "english")],
    ["bad id format (uppercase)", (p) => (p.id = "CBSE_Class7")],
    ["unknown top-level field", (p) => (p.extra = 1)],
    ["empty tags array", (p) => (p.tags = [])],
    ["keyword missing tag", (p) => (p.allow_keywords = [{ term: "algebra" }])],
    ["keyword term wrong type", (p) => (p.allow_keywords = [{ term: 5, tag: "math" }])],
    ["keyword unknown field", (p) => (p.allow_keywords = [{ term: "a", tag: "math", x: 1 }])],
    ["bad channel_id shape", (p) => (p.allow_yt_channels[0].channel_id = "UCnope")],
    ["channel missing subjects", (p) => delete p.allow_yt_channels[0].subjects],
    ["bad domain (has scheme)", (p) => (p.allow_domains = ["https://khanacademy.org"])],
    ["bad updated_at", (p) => (p.updated_at = "yesterday")],
    [
      "yt_policy bad enum",
      (p) => (p.yt_policy = { shorts: "sometimes", embeds: "inherit_parent" }),
    ],
    ["signature wrong type", (p) => (p.signature = 42)],
  ];

  for (const [name, mutate] of cases) {
    it(name, () => {
      const p = good();
      mutate(p);
      const viaAjv = ajvValidate(p) as boolean;
      const viaHand = validatePack(p).ok;
      expect(viaHand).toBe(viaAjv);
    });
  }
});

describe("validatePack owner rules (not expressible in JSON Schema)", () => {
  it("rejects a duplicate channel_id, where ajv (no per-key uniqueness) passes", () => {
    const p = good() as any;
    const dupe = { ...structuredClone(p.allow_yt_channels[0]), label: "Different Label" };
    p.allow_yt_channels.push(dupe); // same channel_id, different object

    expect(ajvValidate(p)).toBe(true); // schema can't catch this
    const r = validatePack(p);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.code === "duplicate_channel")).toBe(true);
  });

  it("rejects an oversized pack, where ajv (no size rule) passes", () => {
    const p = good() as any;
    p.signature = "a".repeat(PACK_MAX_BYTES + 1); // valid string shape, over the cap

    expect(ajvValidate(p)).toBe(true);
    const r = validatePack(p);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.code === "size_exceeded")).toBe(true);
  });
});

describe("validatePack normalization", () => {
  it("applies yt_policy defaults when absent", () => {
    const p = good() as any;
    delete p.yt_policy;
    const r = validatePack(p);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.pack.yt_policy).toEqual(DEFAULT_YT_POLICY);
  });

  it("preserves an explicit yt_policy", () => {
    const p = good() as any;
    p.yt_policy = { shorts: "allow", embeds: "inherit_parent" };
    const r = validatePack(p);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.pack.yt_policy).toEqual({ shorts: "allow", embeds: "inherit_parent" });
  });

  it("rejects a non-object with a typed error", () => {
    expect(validatePack(null).ok).toBe(false);
    expect(validatePack("not a pack").ok).toBe(false);
    const r = validatePack(42);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.code === "not_object")).toBe(true);
  });
});
