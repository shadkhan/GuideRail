// DNR = declarativeNetRequest. Chrome's Manifest V3 rule-based URL matching
// API — replaces the removed webRequest blocking capability. You register
// integer-ID'd rules ("redirect youtube.com to quiz_gate.html", "allow
// this origin for 30 minutes") and Chrome enforces them at the network
// layer. No JS runs per request → fast, and it works even if the service
// worker is asleep.
//
// Three DNR namespaces exist and IDs must not collide across them:
//   • STATIC rules: bundled in the extension manifest, immutable at install
//   • DYNAMIC rules: added/removed at runtime, persist across restarts
//   • SESSION rules: added at runtime, cleared when the browser closes
//
// This file is the single source of ID allocation. Every rule gets its
// number from here — never a magic literal at the call site — so a new
// rule added in one place can't silently shadow an older rule elsewhere.

export const DNR_RANGES = {
  STATIC: { start: 1, end: 999 },
  DYNAMIC_QUIZ_GATE: { start: 1_000, end: 1_999 },
  SESSION_EARNED_TIME: { start: 10_000, end: 19_999 },
} as const;

export const DNR_RULES = {
  QUIZ_GATE_REDIRECT: {
    id: DNR_RANGES.DYNAMIC_QUIZ_GATE.start,
    priority: 1,
  },
  EARNED_TIME_ALLOW: {
    start: DNR_RANGES.SESSION_EARNED_TIME.start,
    end: DNR_RANGES.SESSION_EARNED_TIME.end,
    priority: 2,
  },
} as const;

export function earnedTimeAllowRuleId(slot: number): number {
  const id = DNR_RULES.EARNED_TIME_ALLOW.start + slot;

  if (!Number.isInteger(slot) || slot < 0 || id > DNR_RULES.EARNED_TIME_ALLOW.end) {
    throw new RangeError(`Earned-time allow rule slot out of range: ${slot}`);
  }

  return id;
}
