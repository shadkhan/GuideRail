// Editable gate-list tests (spec 007 R3). Uses the mocked chrome.storage.

import { describe, it, expect } from "vitest";
import { GATE_LIST } from "../pipeline/gate-list.js";
import {
  addGateDomain,
  effectiveGateList,
  isGateListedIn,
  removeGateDomain,
} from "./gate-list-config.js";

describe("effectiveGateList (base ∪ added − removed)", () => {
  it("is the static base when there are no overrides", async () => {
    expect((await effectiveGateList()).sort()).toEqual([...GATE_LIST].sort());
  });

  it("adds a parent-supplied domain", async () => {
    await addGateDomain("Example-Games.com");
    const list = await effectiveGateList();
    expect(list).toContain("example-games.com"); // normalized lowercase
  });

  it("removes a base domain", async () => {
    expect(GATE_LIST).toContain("netflix.com");
    await removeGateDomain("netflix.com");
    expect(await effectiveGateList()).not.toContain("netflix.com");
  });

  it("re-adding a removed base domain restores it", async () => {
    await removeGateDomain("netflix.com");
    await addGateDomain("netflix.com");
    expect(await effectiveGateList()).toContain("netflix.com");
  });

  it("removing a user-added domain just drops it (no base marker)", async () => {
    await addGateDomain("foo.example");
    await removeGateDomain("foo.example");
    expect(await effectiveGateList()).not.toContain("foo.example");
  });
});

describe("isGateListedIn", () => {
  it("matches a domain and its subdomains within a list", () => {
    expect(isGateListedIn("www.netflix.com", ["netflix.com"])).toBe(true);
    expect(isGateListedIn("khanacademy.org", ["netflix.com"])).toBe(false);
  });
});
