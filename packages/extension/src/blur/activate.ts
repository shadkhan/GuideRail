// Blur activation / reveal decision (spec 006 R1). Pure — the DOM class toggling
// lives in content.ts; this is the testable decision the worker and content
// script actually use.
//
// The document_start activation is TRUST-ONLY (isTrustedStatic), because study
// hours can't be read synchronously before first paint (ADR-0011). The full
// hours × trust decision is applied a beat later via `shouldReveal`, computed
// worker-side from the pipeline verdict/reason (which already encodes both):
// outside study hours OR a trusted verdict → reveal the whole page; only a
// consumer page that loaded via fail-open-unknown keeps the blanket.

/** The activation class set on <html>; blur.css blurs media only under it. */
export const ACTIVATION_CLASS = "gr-blur-active";

/** Pipeline reasons meaning "loaded but NOT trusted" — keep the blanket, guard per-element. */
const KEEP_BLUR_REASONS: ReadonlySet<string> = new Set(["fail-open-unknown"]);

export interface RevealInput {
  verdict: string;
  reason: string;
}

/**
 * Whether the content script should unblur the WHOLE page. False only when the
 * page is gated (tab redirects away) or loaded via consumer fail-open on an
 * untrusted origin (then the per-element guard runs). Every trusted verdict and
 * the outside-study-hours no-op reveal.
 */
export function shouldReveal({ verdict, reason }: RevealInput): boolean {
  if (verdict === "quiz_gate") return false;
  return !KEEP_BLUR_REASONS.has(reason);
}
