// Tunables for the quiz gate (spec 005). Kept in the engine so the extension and
// tests share one source of truth.

/** Questions asked per gate (spec 005 R2). */
export const QUESTIONS_PER_QUIZ = 3;

/** Default pass threshold: 2 of 3 correct (Q1 decision — forgiving). */
export const PASS_THRESHOLD_DEFAULT = 2;

/** Allowed earned-window lengths in minutes (Q2 — parent-set 15/30/45). */
export const EARNED_WINDOW_CHOICES = [15, 30, 45] as const;

/** Default earned window until the settings screen (spec 007) lets a parent change it. */
export const DEFAULT_EARNED_MINUTES = 30;

/** Grace-mode lockout after a fail before a retry is offered (spec 005 R3). */
export const GRACE_LOCKOUT_MS = 10 * 60 * 1000;

/** How much a question's relative pick-weight grows per recent read of its topic. */
export const TOPIC_WEIGHT_BOOST = 3;

/** Reading-history lookback for topic weighting (spec 005 R2). */
export const WEIGHTING_WINDOW_MS = 24 * 60 * 60 * 1000;

export const minutesToMs = (m: number): number => m * 60 * 1000;
