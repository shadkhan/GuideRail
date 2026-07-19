/* eslint-disable @typescript-eslint/no-explicit-any -- seed JSON is read as a
   loose shape here; `any` casts keep the fixture reads terse in test code. */
// Seed-pack evidence (spec 003 R5 acceptance, amendment 003A).
//
// Proves each bundled seed (a) validates against the pack schema and clears the
// R5 thresholds, and (b) drives the REAL WASM classifier to the right verdict/
// tags on 20 hand-picked inputs — the acceptance criterion "classify() returns
// correct tags for 20 hand-picked URLs/texts per pack". The WASM instance is
// served from disk exactly as core.test.ts does (L-008: CLI can't load the
// unpacked extension in a browser).

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, it, expect, vi } from "vitest";
import { installPack, classify, __resetClassifiersForTest } from "./loader.js";
import { validatePack } from "./validate.js";
import { PACK_MAX_BYTES } from "./types.js";
import cbse from "./seeds/cbse-class7.json";
import icse from "./seeds/icse-class7.json";
import homeschool from "./seeds/homeschool-general.json";

const HERE = dirname(fileURLToPath(import.meta.url));
const WASM_PATH = resolve(HERE, "..", "..", "..", "core-wasm", "pkg", "guiderail_core_bg.wasm");
const wasmBytes = new Uint8Array(readFileSync(WASM_PATH));

const SEEDS = [cbse, icse, homeschool] as const;

beforeAll(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(wasmBytes, { headers: { "Content-Type": "application/wasm" } })),
  );
});

describe("seed packs pass validation and clear R5 thresholds", () => {
  for (const seed of SEEDS) {
    it(`${(seed as any).id}: valid, ≥300 keywords, ≥50 domains, ≥5 channels`, () => {
      const r = validatePack(seed);
      expect(r.ok).toBe(true);
      expect((seed as any).allow_keywords.length).toBeGreaterThanOrEqual(300);
      expect((seed as any).allow_domains.length).toBeGreaterThanOrEqual(50);
      expect((seed as any).allow_yt_channels.length).toBeGreaterThanOrEqual(5);
      const bytes = new TextEncoder().encode(JSON.stringify(seed)).length;
      expect(bytes).toBeLessThanOrEqual(PACK_MAX_BYTES);
    });
  }
});

// 20 hand-picked inputs. Verdict expectations hold for all three seeds because
// they share the curated keyword vocabulary; tag is checked with toContain so
// incidental extra matches don't make the assertion brittle.
type Case = { text: string; verdict: "allow" | "quiz_gate" | "unknown"; tag?: string };
const CASES: Case[] = [
  // --- curriculum → allow (one per subject tag) ---
  { text: "algebra homework tonight", verdict: "allow", tag: "math" },
  { text: "photosynthesis in green plants", verdict: "allow", tag: "science" },
  { text: "the mughal empire and its architecture", verdict: "allow", tag: "history" },
  { text: "air pressure in the atmosphere", verdict: "allow", tag: "geography" },
  { text: "indian democracy and the constitution", verdict: "allow", tag: "civics" },
  { text: "identify the adjective and the adverb", verdict: "allow", tag: "english" },
  { text: "draw a flowchart for the algorithm", verdict: "allow", tag: "computer" },
  { text: "revision before the examination", verdict: "allow", tag: "study" },
  { text: "simple equations and fractions", verdict: "allow", tag: "math" },
  { text: "learning about acids and bases", verdict: "allow", tag: "science" },
  { text: "reading comprehension practice", verdict: "allow", tag: "english" },
  { text: "the water cycle and evaporation", verdict: "allow", tag: "science" },
  { text: "perimeter and surface area", verdict: "allow", tag: "math" },
  { text: "electric current in a circuit", verdict: "allow", tag: "science" },
  { text: "prepositions and conjunctions", verdict: "allow", tag: "english" },
  // --- built-in distraction → quiz_gate ---
  { text: "watch this fortnite livestream", verdict: "quiz_gate" },
  { text: "roblox gameplay compilation", verdict: "quiz_gate", tag: "gaming" },
  { text: "funny tiktok meme videos", verdict: "quiz_gate", tag: "social" },
  // --- neutral text → unknown ---
  { text: "my grandmother baked cookies yesterday", verdict: "unknown" },
  { text: "planning a weekend birthday party", verdict: "unknown" },
  // --- false-positive guards: ordinary words that used to collide with bare
  //     short keywords under substring matching (exam/base/rock/cell/tense).
  //     After re-curation (ADR-0004) these MUST stay unknown. ---
  { text: "here is an example of good behaviour", verdict: "unknown" },
  { text: "he plays baseball and listens to rock music", verdict: "unknown" },
  { text: "i lost my cellphone in the car", verdict: "unknown" },
  { text: "an intense argument about the news", verdict: "unknown" },
];

describe("each seed pack classifies the 20 inputs correctly", () => {
  for (const seed of SEEDS) {
    const id = (seed as any).id as string;
    it(`${id}`, async () => {
      __resetClassifiersForTest();
      await installPack(structuredClone(seed));

      for (const c of CASES) {
        const r = await classify(c.text, id);
        const where = `[${id}] "${c.text}" → ${r.verdict} ${JSON.stringify(r.matches)}`;
        expect(r.verdict, where).toBe(c.verdict);
        if (c.verdict === "unknown") {
          expect(r.matches, where).toEqual([]);
        } else if (c.tag) {
          expect(r.matches, where).toContain(c.tag);
        }
      }
    });
  }
});
