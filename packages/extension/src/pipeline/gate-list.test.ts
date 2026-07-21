// Gate-list tests (spec 004 R4).

import { describe, it, expect } from "vitest";
import { hostInList, hostMatches, isGateListed } from "./gate-list.js";

describe("hostMatches", () => {
  it("matches exact and subdomains, not unrelated hosts", () => {
    expect(hostMatches("netflix.com", "netflix.com")).toBe(true);
    expect(hostMatches("www.netflix.com", "netflix.com")).toBe(true);
    expect(hostMatches("evilnetflix.com", "netflix.com")).toBe(false);
    expect(hostMatches("khanacademy.org", "netflix.com")).toBe(false);
  });
});

describe("isGateListed", () => {
  it("gates curated entertainment domains", () => {
    expect(isGateListed("www.instagram.com")).toBe(true);
    expect(isGateListed("roblox.com")).toBe(true);
  });
  it("does NOT gate YouTube (handled channel-by-channel in 004A)", () => {
    expect(isGateListed("www.youtube.com")).toBe(false);
    expect(isGateListed("m.youtube.com")).toBe(false);
  });
  it("does not gate study sites", () => {
    expect(isGateListed("khanacademy.org")).toBe(false);
  });
});

describe("hostInList", () => {
  it("matches a pack allow_domains entry and its subdomains", () => {
    const list = ["khanacademy.org", "ncert.nic.in"];
    expect(hostInList("www.khanacademy.org", list)).toBe(true);
    expect(hostInList("ncert.nic.in", list)).toBe(true);
    expect(hostInList("example.com", list)).toBe(false);
  });
});
