// Quiz + earned-time types (spec 005). Pure data — no chrome.* / DOM here, so
// the engine is unit-tested with plain `vitest` and reused by the extension.

/** A bank question WITH its answer key. Lives worker-side; never sent to a page. */
export interface Question {
  id: string;
  /** Subject topic tag; drawn from the pack's tags / quiz_topics vocabulary. */
  topic: string;
  prompt: string;
  /** Exactly four multiple-choice options. */
  options: [string, string, string, string];
  /** Index (0–3) of the correct option. */
  answerIndex: number;
}

export type QuestionBank = Question[];

/** A question as sent to the quiz page — the answer key is stripped out. */
export interface QuizQuestion {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
}

/** An earned-time grant. `scope` is the unlocked origin-group (registrable domain). */
export interface EarnedToken {
  scope: string;
  grantedAt: number; // epoch ms
  expiresAt: number; // epoch ms
}

export interface GradeResult {
  passed: boolean;
  correctCount: number;
  total: number;
  /** Topics of the questions answered wrong — what to revisit in grace mode. */
  missedTopics: string[];
}

/** Remove the answer key before a question crosses to the page (anti-cheat). */
export function stripAnswer(q: Question): QuizQuestion {
  return { id: q.id, topic: q.topic, prompt: q.prompt, options: [...q.options] };
}
