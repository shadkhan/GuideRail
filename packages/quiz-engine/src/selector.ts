// Question selection (spec 005 R2). Picks N questions weighted toward the topics
// the child read recently, with a uniform fallback when there's no history.
// Weighted sampling WITHOUT replacement; the rng is injectable so tests are
// deterministic.

import { QUESTIONS_PER_QUIZ, TOPIC_WEIGHT_BOOST } from "./constants.js";
import type { Question, QuestionBank } from "./types.js";

/** Random source in [0, 1). Defaults to Math.random; injected in tests. */
export type Rng = () => number;

/**
 * Choose `count` distinct questions from `bank`. A question's pick-weight is
 * `1 + TOPIC_WEIGHT_BOOST × (recent reads of its topic)`, so a child who read
 * three science pages is far more likely to be quizzed on science — but every
 * question keeps a nonzero base weight, so a small bank still fills the quiz.
 */
export function selectQuestions(
  bank: QuestionBank,
  weights: Map<string, number>,
  count: number = QUESTIONS_PER_QUIZ,
  rng: Rng = Math.random,
): Question[] {
  if (bank.length <= count) return [...bank];

  const pool = bank.map((q) => ({ q, w: 1 + TOPIC_WEIGHT_BOOST * (weights.get(q.topic) ?? 0) }));
  const chosen: Question[] = [];

  for (let picked = 0; picked < count && pool.length > 0; picked++) {
    const total = pool.reduce((sum, item) => sum + item.w, 0);
    let r = rng() * total;
    let idx = 0;
    for (; idx < pool.length - 1; idx++) {
      r -= pool[idx]!.w;
      if (r <= 0) break;
    }
    chosen.push(pool[idx]!.q);
    pool.splice(idx, 1); // without replacement
  }

  return chosen;
}
