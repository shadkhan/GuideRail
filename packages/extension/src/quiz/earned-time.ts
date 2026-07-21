// Earned-time engine (spec 005 R4/R5, produces ADR-0005).
//
// A pass mints a token {scope, grantedAt, expiresAt} stored in chrome.storage.
// Enforcement is split by how the scope's domain is gated:
//   • gate-list domains (DNR = declarativeNetRequest redirect, no content script
//     runs) → a SESSION allow-rule with priority above the redirect stops it;
//   • YouTube + classify-distraction pages (content-script driven) → the pipeline
//     checks hasEarnedTime() (see pipeline/policy.ts). Shorts stay gated (004A AQ2).
// Expiry runs on chrome.alarms (never setTimeout); the countdown shows as action
// badge text. Everything is reconcile-from-storage so it survives the worker's
// idle-kill (L-014).

import * as storage from "../storage.js";
import { DNR_RANGES, DNR_RULES, earnedTimeAllowRuleId } from "../dnr/registry.js";
import { isGateListed } from "../pipeline/gate-list.js";
import {
  isValid,
  mintToken,
  minutesToMs,
  remainingMinutes,
  type EarnedToken,
} from "@guiderail/quiz-engine";
import { registrableDomain } from "./scope.js";

const EXPIRY_ALARM_PREFIX = "gr.earned-expiry:"; // + scope
const BADGE_ALARM = "gr.earned-badge";
const BADGE_COLOR = "#2E7D4F"; // earned-green

// --- deterministic DNR session-rule id per scope ----------------------------
const SLOTS = DNR_RANGES.SESSION_EARNED_TIME.end - DNR_RANGES.SESSION_EARNED_TIME.start;
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}
function allowRuleId(scope: string): number {
  return earnedTimeAllowRuleId(hash(scope) % SLOTS);
}

function allowRule(scope: string): chrome.declarativeNetRequest.Rule {
  return {
    id: allowRuleId(scope),
    priority: DNR_RULES.EARNED_TIME_ALLOW.priority, // above the redirect
    action: { type: "allow" as chrome.declarativeNetRequest.RuleActionType },
    condition: {
      requestDomains: [scope],
      resourceTypes: ["main_frame" as chrome.declarativeNetRequest.ResourceType],
    },
  };
}

async function tokens(): Promise<Record<string, EarnedToken>> {
  return (await storage.get("earned.tokens")) ?? {};
}

/** True when a live earned-time token covers `host`. Used by the pipeline. */
export async function hasEarnedTime(host: string, now = Date.now()): Promise<boolean> {
  const scope = registrableDomain(host);
  const token = (await tokens())[scope];
  return token !== undefined && isValid(token, now);
}

/**
 * Grant earned time for a scope: store the token, add the gate-list allow-rule
 * (only for gate-list scopes), arm the expiry alarm, and start the badge.
 */
export async function grantEarnedTime(
  scope: string,
  minutes: number,
  now = Date.now(),
): Promise<EarnedToken> {
  const token = mintToken(scope, now, minutesToMs(minutes));
  const all = await tokens();
  all[scope] = token;
  await storage.set("earned.tokens", all);

  if (isGateListed(scope)) {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [allowRuleId(scope)],
      addRules: [allowRule(scope)],
    });
  }
  await chrome.alarms.create(`${EXPIRY_ALARM_PREFIX}${scope}`, { when: token.expiresAt });
  await chrome.alarms.create(BADGE_ALARM, { periodInMinutes: 1 });
  await updateBadge(now);
  return token;
}

/** Revoke a scope's earned time: token, allow-rule, and expiry alarm all go. */
export async function revokeEarnedTime(scope: string, now = Date.now()): Promise<void> {
  const all = await tokens();
  delete all[scope];
  await storage.set("earned.tokens", all);
  await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [allowRuleId(scope)] });
  await chrome.alarms.clear(`${EXPIRY_ALARM_PREFIX}${scope}`);
  await updateBadge(now);
}

/** Set the badge to the largest remaining window; clear it (and stop the badge
 *  alarm) when nothing is active. */
export async function updateBadge(now = Date.now()): Promise<void> {
  const live = Object.values(await tokens()).filter((t) => isValid(t, now));
  if (live.length === 0) {
    await chrome.action.setBadgeText({ text: "" });
    await chrome.alarms.clear(BADGE_ALARM);
    return;
  }
  const mostMinutes = Math.max(...live.map((t) => remainingMinutes(t, now)));
  await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
  await chrome.action.setBadgeText({ text: String(mostMinutes) });
}

/**
 * Reconcile earned-time state from storage — the wake-safe entry point. Prunes
 * expired tokens (revoking their rules/alarms), re-adds live gate-list allow-
 * rules and expiry alarms, and refreshes the badge. Idempotent.
 */
export async function reconcileEarnedTime(now = Date.now()): Promise<void> {
  const all = await tokens();
  for (const [scope, token] of Object.entries(all)) {
    if (!isValid(token, now)) {
      await revokeEarnedTime(scope, now);
      continue;
    }
    if (isGateListed(scope)) {
      await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [allowRuleId(scope)],
        addRules: [allowRule(scope)],
      });
    }
    await chrome.alarms.create(`${EXPIRY_ALARM_PREFIX}${scope}`, { when: token.expiresAt });
  }
  await updateBadge(now);
}

/** Handle an alarm; returns true if it was an earned-time alarm we consumed. */
export async function handleEarnedAlarm(name: string, now = Date.now()): Promise<boolean> {
  if (name === BADGE_ALARM) {
    await updateBadge(now);
    return true;
  }
  if (name.startsWith(EXPIRY_ALARM_PREFIX)) {
    await revokeEarnedTime(name.slice(EXPIRY_ALARM_PREFIX.length), now);
    return true;
  }
  return false;
}
