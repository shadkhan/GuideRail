import { describe, it, expect } from "vitest";
import { isClassifyRequest, isClassifyResponse, isErrorResponse, isMessage } from "./messages.js";

describe("message guards (R3)", () => {
  it("accepts a well-formed ClassifyRequest with or without packId", () => {
    // packId names a specific installed pack (spec 007 preview)...
    expect(isClassifyRequest({ kind: "classify", text: "algebra", packId: "cbse-class7" })).toBe(
      true,
    );
    // ...and is optional — omitted means "the active pack" (R6).
    expect(isClassifyRequest({ kind: "classify", text: "algebra" })).toBe(true);
  });

  it("rejects ad-hoc / malformed payloads", () => {
    expect(isClassifyRequest({ kind: "classify", text: 1, packId: "p" })).toBe(false); // wrong text type
    expect(isClassifyRequest({ kind: "classify", text: "x", packId: 5 })).toBe(false); // packId wrong type
    expect(isClassifyRequest({ kind: "evil", text: "x", packId: "p" })).toBe(false); // wrong kind
    expect(isClassifyRequest("not-an-object")).toBe(false);
    expect(isClassifyRequest(null)).toBe(false);
    expect(isMessage({ foo: "bar" })).toBe(false);
    expect(isMessage(undefined)).toBe(false);
  });

  it("validates response and error shapes", () => {
    expect(
      isClassifyResponse({ kind: "classify.result", verdict: "allow", matches: ["math"] }),
    ).toBe(true);
    expect(isClassifyResponse({ kind: "classify.result", verdict: "bogus", matches: [] })).toBe(
      false,
    );
    expect(isClassifyResponse({ kind: "classify.result", verdict: "allow", matches: [1] })).toBe(
      false,
    );
    expect(isErrorResponse({ kind: "error", message: "boom" })).toBe(true);
    expect(isErrorResponse({ kind: "error" })).toBe(false);
  });
});
