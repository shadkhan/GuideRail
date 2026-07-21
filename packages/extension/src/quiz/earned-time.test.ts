// Earned-time engine tests (spec 005 R4/R5). Uses the mocked chrome.* from
// test/setup.ts (storage, declarativeNetRequest, alarms, action badge).

import { describe, it, expect, vi } from "vitest";
import * as storage from "../storage.js";
import {
  grantEarnedTime,
  handleEarnedAlarm,
  hasEarnedTime,
  reconcileEarnedTime,
  revokeEarnedTime,
  updateBadge,
} from "./earned-time.js";
import { mintToken } from "@guiderail/quiz-engine";

const dnr = () =>
  chrome.declarativeNetRequest.updateSessionRules as unknown as ReturnType<typeof vi.fn>;
const badge = () => chrome.action.setBadgeText as unknown as ReturnType<typeof vi.fn>;

describe("grant / hasEarnedTime / revoke", () => {
  const now = 1_000_000;

  it("grants a token that covers the scope and its subdomains", async () => {
    await grantEarnedTime("netflix.com", 30, now);
    expect(await hasEarnedTime("www.netflix.com", now + 1000)).toBe(true);
    expect(await hasEarnedTime("www.netflix.com", now + 31 * 60_000)).toBe(false); // past expiry
    expect(await hasEarnedTime("khanacademy.org", now + 1000)).toBe(false); // different scope
  });

  it("adds a DNR session allow-rule for a gate-list scope", async () => {
    dnr().mockClear();
    await grantEarnedTime("netflix.com", 30, now);
    const call = dnr().mock.calls.at(-1)?.[0] as { addRules?: unknown[] };
    expect(call.addRules?.length).toBe(1); // one allow rule
  });

  it("does NOT touch DNR for YouTube (pipeline enforces it) but still grants the token", async () => {
    dnr().mockClear();
    await grantEarnedTime("youtube.com", 30, now);
    expect(dnr()).not.toHaveBeenCalled(); // no session rule for YouTube
    expect(await hasEarnedTime("m.youtube.com", now + 1000)).toBe(true);
  });

  it("revoke removes the token", async () => {
    await grantEarnedTime("netflix.com", 30, now);
    await revokeEarnedTime("netflix.com", now);
    expect(await hasEarnedTime("netflix.com", now + 1000)).toBe(false);
  });
});

describe("badge + reconcile", () => {
  const now = 1_000_000;

  it("shows remaining minutes on the badge, clears it when empty", async () => {
    badge().mockClear();
    await grantEarnedTime("netflix.com", 30, now);
    await updateBadge(now);
    expect(badge()).toHaveBeenCalledWith({ text: "30" });
    await revokeEarnedTime("netflix.com", now);
    expect(badge()).toHaveBeenCalledWith({ text: "" });
  });

  it("reconcile prunes an already-expired token", async () => {
    // Write an expired token directly, as a stale wake would find.
    await storage.set("earned.tokens", {
      "netflix.com": mintToken("netflix.com", now - 60 * 60_000, 30 * 60_000),
    });
    await reconcileEarnedTime(now);
    expect(await hasEarnedTime("netflix.com", now)).toBe(false);
    expect(await storage.get("earned.tokens")).toEqual({});
  });

  it("reconcile keeps a live token", async () => {
    await grantEarnedTime("netflix.com", 30, now);
    await reconcileEarnedTime(now + 5 * 60_000);
    expect(await hasEarnedTime("netflix.com", now + 5 * 60_000)).toBe(true);
  });

  it("an expiry alarm revokes the token and removes its DNR session rule", async () => {
    dnr().mockClear();
    await grantEarnedTime("netflix.com", 30, now);
    const handled = await handleEarnedAlarm("gr.earned-expiry:netflix.com", now + 31 * 60_000);
    expect(handled).toBe(true);
    expect(await hasEarnedTime("netflix.com", now + 31 * 60_000)).toBe(false);
    const removedRule = dnr().mock.calls.some(
      (c) => ((c[0] as { removeRuleIds?: number[] }).removeRuleIds?.length ?? 0) > 0,
    );
    expect(removedRule).toBe(true);
  });

  it("ignores an unrelated alarm name", async () => {
    expect(await handleEarnedAlarm("gr.study-hours", now)).toBe(false);
  });
});
