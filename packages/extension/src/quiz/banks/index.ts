// Bundled question banks (spec 005 R2). Hand-written MCQs, ≥30 per pack, tagged
// by topic. All three seed packs are Class 7, so for beta they share one curated
// Class-7 bank; per-board banks are a later refinement. esbuild inlines the JSON.

import type { QuestionBank } from "@guiderail/quiz-engine";
import class7Core from "./class7-core.json";

const CLASS7: QuestionBank = class7Core as unknown as QuestionBank;

const BANKS: Record<string, QuestionBank> = {
  "cbse-class7": CLASS7,
  "icse-class7": CLASS7,
  "homeschool-general": CLASS7,
};

/** The question bank for a pack id, or undefined if none is bundled. */
export function bankForPack(packId: string): QuestionBank | undefined {
  return BANKS[packId];
}
