// Gate-list redirect rules (spec 004 R1 step 3, via declarativeNetRequest = DNR).
//
// The curated entertainment gate-list is enforced declaratively: a SINGLE
// dynamic redirect rule (kept low per the MV3 = Manifest V3 rule budget) sends
// any main-frame request to a gate-list domain to quiz_gate.html, capturing the
// original URL as ?src=. requestDomains matches a domain AND its subdomains, so
// one rule covers the whole list. The worker toggles this rule on study-hours
// boundaries (present iff within a window) — DNR dynamic rules persist across the
// service worker's idle-kill, so gating survives the ephemeral worker.
//
// The rule id comes from the reserved registry range — never a magic literal.

import { DNR_RULES } from "../dnr/registry.js";

const GATE_RULE_ID = DNR_RULES.QUIZ_GATE_REDIRECT.id;

function gateRedirectRule(domains: string[]): chrome.declarativeNetRequest.Rule {
  const target = chrome.runtime.getURL("quiz_gate.html");
  return {
    id: GATE_RULE_ID,
    priority: DNR_RULES.QUIZ_GATE_REDIRECT.priority,
    action: {
      type: "redirect" as chrome.declarativeNetRequest.RuleActionType,
      // Capture the ORIGIN (scheme://host) as ?src — spec R1's "<origin>". DNR's
      // regexSubstitution does NOT url-encode captures, so we must not capture the
      // full URL: a query string with `&` would truncate the src when the gate
      // page parses it. The origin has no `&`, so it round-trips safely.
      redirect: { regexSubstitution: `${target}?src=\\1` },
    },
    condition: {
      requestDomains: domains,
      regexFilter: "^(https?://[^/]+)",
      resourceTypes: ["main_frame" as chrome.declarativeNetRequest.ResourceType],
    },
  };
}

/**
 * Install or remove the gate-list redirect rule so it is present exactly when
 * `active` is true, matching the given EFFECTIVE gate-list `domains` (base ±
 * parent edits, spec 007 R3). Idempotent: the remove-then-add form means calling
 * it repeatedly (worker wake, alarm, install) converges to the right state.
 */
export async function reconcileGateRules(active: boolean, domains: string[]): Promise<void> {
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [GATE_RULE_ID],
    addRules: active && domains.length > 0 ? [gateRedirectRule(domains)] : [],
  });
}
