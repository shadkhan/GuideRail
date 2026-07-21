// Pending quiz attempts (spec 005). Between quiz.start and quiz.submit the worker
// must remember the exact questions (WITH answer keys) it served, so it can grade
// server-side without ever sending answers to the page. These live in
// chrome.storage.session — ephemeral (cleared when the browser closes) but,
// unlike module scope, they survive the worker's ~30s idle-kill mid-quiz.

import type { Question } from "@guiderail/quiz-engine";

export interface PendingAttempt {
  questions: Question[];
  scope: string;
  threshold: number;
  createdAt: number;
}

const key = (attemptId: string): string => `gr.attempt.${attemptId}`;

export function newAttemptId(): string {
  return crypto.randomUUID();
}

export async function putAttempt(attemptId: string, attempt: PendingAttempt): Promise<void> {
  await chrome.storage.session.set({ [key(attemptId)]: attempt });
}

/** Read and CONSUME an attempt (one-shot: removed so it can't be re-submitted). */
export async function takeAttempt(attemptId: string): Promise<PendingAttempt | undefined> {
  const k = key(attemptId);
  const out = await chrome.storage.session.get(k);
  const attempt = out[k] as PendingAttempt | undefined;
  if (attempt) await chrome.storage.session.remove(k);
  return attempt;
}
