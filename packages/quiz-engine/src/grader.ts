// Grading (spec 005 R3). Pure: compare submitted answers against the questions'
// answer keys and decide pass/fail against a threshold (default 2 of 3).

import type { GradeResult, Question } from "./types.js";

export function grade(questions: Question[], answers: number[], threshold: number): GradeResult {
  let correctCount = 0;
  const missedTopics: string[] = [];

  questions.forEach((q, i) => {
    if (answers[i] === q.answerIndex) {
      correctCount++;
    } else if (!missedTopics.includes(q.topic)) {
      missedTopics.push(q.topic);
    }
  });

  return {
    passed: correctCount >= threshold,
    correctCount,
    total: questions.length,
    missedTopics,
  };
}
