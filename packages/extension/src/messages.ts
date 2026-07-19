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

// Returned when a handler receives an unrecognized / malformed payload, or when
// classification itself fails. Keeps the channel typed even on the error path.
export type ErrorResponse = {
  kind: "error";
  message: string;
};

export type Message = ClassifyRequest | ClassifyResponse | ErrorResponse;

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

export function isErrorResponse(x: unknown): x is ErrorResponse {
  return isRecord(x) && x.kind === "error" && typeof x.message === "string";
}

export function isMessage(x: unknown): x is Message {
  return isClassifyRequest(x) || isClassifyResponse(x) || isErrorResponse(x);
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
