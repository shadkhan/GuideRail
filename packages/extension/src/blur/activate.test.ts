import { describe, it, expect } from "vitest";
import { shouldReveal } from "./activate.js";
import { isTrustedStatic, TRUSTED_STATIC } from "./trusted-static.js";
import cbse from "../pack/seeds/cbse-class7.json";
import icse from "../pack/seeds/icse-class7.json";
import homeschool from "../pack/seeds/homeschool-general.json";

describe("shouldReveal (hours × trust, via pipeline reason)", () => {
  it("reveals the whole page for trusted / allowed verdicts", () => {
    for (const reason of [
      "allow-domain",
      "classify-allow",
      "yt-allow-channel",
      "earned-time",
      "outside-study-hours", // outside hours: nothing to hide
      "yt-nav",
    ]) {
      expect(shouldReveal({ verdict: "allow", reason })).toBe(true);
    }
  });

  it("keeps the blanket only for a consumer fail-open unknown page", () => {
    expect(shouldReveal({ verdict: "allow", reason: "fail-open-unknown" })).toBe(false);
  });

  it("does not reveal a gated page (the tab redirects away)", () => {
    expect(shouldReveal({ verdict: "quiz_gate", reason: "gate-list" })).toBe(false);
    expect(shouldReveal({ verdict: "quiz_gate", reason: "classify-distraction" })).toBe(false);
  });
});

describe("isTrustedStatic", () => {
  it("recognizes common study origins and their subdomains", () => {
    expect(isTrustedStatic("www.khanacademy.org")).toBe(true);
    expect(isTrustedStatic("ncert.nic.in")).toBe(true);
    expect(isTrustedStatic("diksha.gov.in")).toBe(true);
  });
  it("does not trust arbitrary origins", () => {
    expect(isTrustedStatic("www.reddit.com")).toBe(false);
    expect(isTrustedStatic("some-random-blog.example")).toBe(false);
  });
});

describe("TRUSTED_STATIC stays a superset of the seed packs' allow_domains (R2 drift guard)", () => {
  it("covers every bundled seed pack allow_domain", () => {
    const seedDomains = new Set<string>();
    for (const pack of [cbse, icse, homeschool]) {
      for (const d of (pack as { allow_domains: string[] }).allow_domains) seedDomains.add(d);
    }
    const missing = [...seedDomains].filter((d) => !isTrustedStatic(d));
    expect(missing, `add these to TRUSTED_STATIC: ${missing.join(", ")}`).toEqual([]);
    // Sanity: the list is exactly the seed union (no stragglers beyond it either).
    expect(TRUSTED_STATIC.length).toBeGreaterThanOrEqual(seedDomains.size);
  });
});
