import { describe, it, expect } from "vitest";
import { registrableDomain, scopeOf } from "./scope.js";

describe("registrableDomain", () => {
  it("collapses subdomains to the registrable domain", () => {
    expect(registrableDomain("www.youtube.com")).toBe("youtube.com");
    expect(registrableDomain("m.youtube.com")).toBe("youtube.com");
    expect(registrableDomain("netflix.com")).toBe("netflix.com");
  });
  it("keeps three labels under a ccTLD second-level (e.g. gov.in)", () => {
    expect(registrableDomain("diksha.gov.in")).toBe("diksha.gov.in");
    expect(registrableDomain("portal.diksha.gov.in")).toBe("diksha.gov.in");
  });
  it("keeps a plain two-label ccTLD domain", () => {
    expect(registrableDomain("www.mxplayer.in")).toBe("mxplayer.in");
  });
});

describe("scopeOf", () => {
  it("derives the scope from a URL", () => {
    expect(scopeOf("https://www.youtube.com/watch?v=x")).toBe("youtube.com");
  });
  it("returns null for an unparseable URL", () => {
    expect(scopeOf("not a url")).toBeNull();
  });
});
