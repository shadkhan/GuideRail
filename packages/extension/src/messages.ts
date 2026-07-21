// Typed message schema — the single source of truth for extension IPC
// (Inter-Process Communication between the service worker, content scripts,
// and any extension pages like quiz_gate.html).
//
// Per ADR-0002 (Architecture Decision Record 0002 — pending; STRIDE threat
// model per CERT vulnerability VU#595768): every cross-boundary payload MUST
// use this discriminated union. Ad-hoc payloads are forbidden — they're the
// single biggest source of extension-hijack bugs in the wild. "STRIDE" is
// the six threat categories we model against: Spoofing, Tampering,
// Repudiation, Info-disclosure, Denial-of-service, Elevation-of-privilege.
//
// TypeScript's discriminated union on `kind` gives us exhaustive switch
// checks at compile time — if a new message kind is added, every switch
// that doesn't handle it becomes a type error.

export type ClassifyRequest = {
  kind: "classify";
  text: string;
  // Optional curriculum-pack id, e.g. "cbse-class7". Omitted ⇒ classify against
  // the currently active pack (spec 003 R6). Present ⇒ target a specific
  // installed pack (used by onboarding preview, spec 007).
  packId?: string;
};

export type ClassifyResponse = {
  kind: "classify.result";
  verdict: "allow" | "quiz_gate" | "unknown";
  matches: string[]; // matched curriculum tags, empty on "unknown"
};

// Page evaluation (spec 004): the content script sends a page's metadata (never
// full DOM text) and the worker replies with the pipeline verdict + the action
// the content script/worker should take. `yt` is present only on YouTube, where
// the content script has already resolved the channel_id (null on failure).
export type PageEvalRequest = {
  kind: "page.eval";
  url: string;
  title: string;
  description: string;
  yt?: { channelId: string | null };
};

export type PageEvalResponse = {
  kind: "page.eval.result";
  verdict: "allow" | "quiz_gate" | "unknown" | "allow_navigation";
  matches: string[];
  action: "none" | "gate";
  /** Blur blanket (spec 006): true ⇒ whole-page unblur; false ⇒ per-element guard. */
  reveal: boolean;
};

// Quiz gate (spec 005). The quiz_gate.html page asks the worker to start a quiz
// for the gated origin; the worker selects questions and replies WITHOUT answer
// keys (graded worker-side). On submit the worker grades and, on a pass, grants
// earned time. `QuizQuestion` (answer-key-stripped) comes from the quiz-engine.
import type { QuizQuestion } from "@guiderail/quiz-engine";

export type QuizStartRequest = {
  kind: "quiz.start";
  /** The gated origin the child hit (the ?src on quiz_gate.html). */
  src: string;
};

export type QuizQuestionsResponse = {
  kind: "quiz.questions";
  attemptId: string;
  questions: QuizQuestion[];
};

/** Sent instead of questions when the origin is in a post-fail grace lockout. */
export type QuizLockedResponse = {
  kind: "quiz.locked";
  retryAtMs: number;
};

export type QuizSubmitRequest = {
  kind: "quiz.submit";
  attemptId: string;
  answers: number[];
};

export type QuizResultResponse = {
  kind: "quiz.result";
  passed: boolean;
  correctCount: number;
  total: number;
  missedTopics: string[];
  /** Set on a pass — how many minutes were granted. */
  grantedMinutes?: number;
  /** Set on a fail — when a retry becomes available. */
  retryAtMs?: number;
};

// Returned when a handler receives an unrecognized / malformed payload, or when
// classification itself fails. Keeps the channel typed even on the error path.
export type ErrorResponse = {
  kind: "error";
  message: string;
};

export type Message =
  | ClassifyRequest
  | ClassifyResponse
  | PageEvalRequest
  | PageEvalResponse
  | QuizStartRequest
  | QuizQuestionsResponse
  | QuizLockedResponse
  | QuizSubmitRequest
  | QuizResultResponse
  | ErrorResponse;

export type MessageKind = Message["kind"];

// --- Runtime guards (spec 002 R3) ------------------------------------------
// The discriminated union protects us at compile time, but a message crossing
// chrome.runtime is `any` at runtime and may come from a compromised page.
// These guards are the runtime wall: the service worker validates every inbound
// payload and rejects ad-hoc objects instead of trusting their shape.

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export function isClassifyRequest(x: unknown): x is ClassifyRequest {
  return (
    isRecord(x) &&
    x.kind === "classify" &&
    typeof x.text === "string" &&
    // packId is optional; if present it must be a string.
    (x.packId === undefined || typeof x.packId === "string")
  );
}

export function isClassifyResponse(x: unknown): x is ClassifyResponse {
  return (
    isRecord(x) &&
    x.kind === "classify.result" &&
    (x.verdict === "allow" || x.verdict === "quiz_gate" || x.verdict === "unknown") &&
    Array.isArray(x.matches) &&
    x.matches.every((m) => typeof m === "string")
  );
}

export function isPageEvalRequest(x: unknown): x is PageEvalRequest {
  if (
    !isRecord(x) ||
    x.kind !== "page.eval" ||
    typeof x.url !== "string" ||
    typeof x.title !== "string" ||
    typeof x.description !== "string"
  ) {
    return false;
  }
  // yt is optional; if present it must be { channelId: string | null }.
  if (x.yt === undefined) return true;
  return isRecord(x.yt) && (x.yt.channelId === null || typeof x.yt.channelId === "string");
}

export function isPageEvalResponse(x: unknown): x is PageEvalResponse {
  return (
    isRecord(x) &&
    x.kind === "page.eval.result" &&
    (x.verdict === "allow" ||
      x.verdict === "quiz_gate" ||
      x.verdict === "unknown" ||
      x.verdict === "allow_navigation") &&
    (x.action === "none" || x.action === "gate") &&
    typeof x.reveal === "boolean" &&
    Array.isArray(x.matches) &&
    x.matches.every((m) => typeof m === "string")
  );
}

export function isQuizStartRequest(x: unknown): x is QuizStartRequest {
  return isRecord(x) && x.kind === "quiz.start" && typeof x.src === "string";
}

export function isQuizSubmitRequest(x: unknown): x is QuizSubmitRequest {
  return (
    isRecord(x) &&
    x.kind === "quiz.submit" &&
    typeof x.attemptId === "string" &&
    Array.isArray(x.answers) &&
    x.answers.every((a) => typeof a === "number")
  );
}

export function isQuizQuestionsResponse(x: unknown): x is QuizQuestionsResponse {
  return (
    isRecord(x) &&
    x.kind === "quiz.questions" &&
    typeof x.attemptId === "string" &&
    Array.isArray(x.questions)
  );
}

export function isQuizLockedResponse(x: unknown): x is QuizLockedResponse {
  return isRecord(x) && x.kind === "quiz.locked" && typeof x.retryAtMs === "number";
}

export function isQuizResultResponse(x: unknown): x is QuizResultResponse {
  return (
    isRecord(x) &&
    x.kind === "quiz.result" &&
    typeof x.passed === "boolean" &&
    typeof x.correctCount === "number" &&
    typeof x.total === "number" &&
    Array.isArray(x.missedTopics)
  );
}

export function isErrorResponse(x: unknown): x is ErrorResponse {
  return isRecord(x) && x.kind === "error" && typeof x.message === "string";
}

export function isMessage(x: unknown): x is Message {
  return (
    isClassifyRequest(x) ||
    isClassifyResponse(x) ||
    isPageEvalRequest(x) ||
    isPageEvalResponse(x) ||
    isQuizStartRequest(x) ||
    isQuizQuestionsResponse(x) ||
    isQuizLockedResponse(x) ||
    isQuizSubmitRequest(x) ||
    isQuizResultResponse(x) ||
    isErrorResponse(x)
  );
}

// --- Typed send wrappers for the quiz page (spec 005) -----------------------
export async function sendQuizStart(
  req: QuizStartRequest,
): Promise<QuizQuestionsResponse | QuizLockedResponse> {
  const res: unknown = await chrome.runtime.sendMessage(req);
  if (isQuizQuestionsResponse(res) || isQuizLockedResponse(res)) return res;
  if (isErrorResponse(res)) throw new Error(`quiz.start failed: ${res.message}`);
  throw new Error("quiz.start: unexpected response shape");
}

export async function sendQuizSubmit(req: QuizSubmitRequest): Promise<QuizResultResponse> {
  const res: unknown = await chrome.runtime.sendMessage(req);
  if (isQuizResultResponse(res)) return res;
  if (isErrorResponse(res)) throw new Error(`quiz.submit failed: ${res.message}`);
  throw new Error("quiz.submit: unexpected response shape");
}

// --- Typed send wrapper for page evaluation (spec 004) ----------------------
export async function sendPageEval(req: PageEvalRequest): Promise<PageEvalResponse> {
  const res: unknown = await chrome.runtime.sendMessage(req);
  if (isPageEvalResponse(res)) return res;
  if (isErrorResponse(res)) throw new Error(`page.eval failed: ${res.message}`);
  throw new Error("page.eval: unexpected response shape");
}

// --- Typed send wrapper -----------------------------------------------------
// Callers use this instead of a raw chrome.runtime.sendMessage so both the
// request and the response are typed, and a malformed reply throws rather than
// silently flowing on as `any`.
export async function sendClassify(req: ClassifyRequest): Promise<ClassifyResponse> {
  const res: unknown = await chrome.runtime.sendMessage(req);
  if (isClassifyResponse(res)) return res;
  if (isErrorResponse(res)) throw new Error(`classify failed: ${res.message}`);
  throw new Error("classify: unexpected response shape");
}
