// Gate-list DNR rule tests (spec 004 R1 / spec 005 interplay). Uses the mocked
// chrome.declarativeNetRequest from test/setup.ts.

import { describe, it, expect, vi } from "vitest";
import { reconcileGateRules } from "./dnr.js";

const dnr = () =>
  chrome.declarativeNetRequest.updateDynamicRules as unknown as ReturnType<typeof vi.fn>;

describe("reconcileGateRules", () => {
  it("adds one redirect rule that captures the ORIGIN as ?src (no full-URL truncation)", async () => {
    dnr().mockClear();
    await reconcileGateRules(true);
    const arg = dnr().mock.calls.at(-1)?.[0] as {
      addRules: Array<{
        action: { redirect: { regexSubstitution: string } };
        condition: { regexFilter: string };
      }>;
    };
    expect(arg.addRules).toHaveLength(1);
    const rule = arg.addRules[0]!;
    // Captures scheme://host only, and substitutes capture group 1 — so a query
    // string with `&` can never truncate the src.
    expect(rule.condition.regexFilter).toBe("^(https?://[^/]+)");
    expect(rule.action.redirect.regexSubstitution).toContain("src=\\1");
    expect(rule.action.redirect.regexSubstitution).toContain("quiz_gate.html");
  });

  it("removes the rule (adds none) when outside study hours", async () => {
    dnr().mockClear();
    await reconcileGateRules(false);
    const arg = dnr().mock.calls.at(-1)?.[0] as { addRules: unknown[]; removeRuleIds: number[] };
    expect(arg.addRules).toEqual([]);
    expect(arg.removeRuleIds.length).toBeGreaterThan(0);
  });
});
