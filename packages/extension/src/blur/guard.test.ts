import { describe, it, expect } from "vitest";
import { classifyMedia, runInChunks, type MediaLike } from "./guard.js";

const img = (over: Partial<MediaLike> = {}): MediaLike => ({
  tag: "img",
  src: "https://example.com/pic.jpg",
  width: 400,
  height: 300,
  ...over,
});

describe("classifyMedia (origin + dimension trust)", () => {
  const PAGE = "www.example.com";

  it("reveals a same-registrable-domain image", () => {
    expect(classifyMedia(img({ src: "https://cdn.example.com/x.jpg" }), PAGE)).toBe("reveal");
  });
  it("keeps a large cross-origin image blurred", () => {
    expect(classifyMedia(img({ src: "https://evil.test/x.jpg" }), PAGE)).toBe("keep");
  });
  it("reveals an allowlisted-CDN image", () => {
    expect(classifyMedia(img({ src: "https://lh3.googleusercontent.com/x" }), PAGE)).toBe("reveal");
  });
  it("reveals a small decorative icon regardless of origin", () => {
    expect(
      classifyMedia(img({ src: "https://evil.test/i.png", width: 16, height: 16 }), PAGE),
    ).toBe("reveal");
  });
  it("keeps a large data: image blurred (unverifiable source)", () => {
    expect(classifyMedia(img({ src: "data:image/png;base64,AAAA" }), PAGE)).toBe("keep");
  });
  it("keeps an unknown-size cross-origin image blurred (fail safe)", () => {
    expect(classifyMedia(img({ src: "https://evil.test/x.jpg", width: 0, height: 0 }), PAGE)).toBe(
      "keep",
    );
  });
});

describe("runInChunks", () => {
  it("processes 500 items in bounded chunks", () => {
    const items = Array.from({ length: 500 }, (_, i) => i);
    let processed = 0;
    let scheduleCalls = 0;
    const maxPerFrame = { n: 0 };

    // Synchronous scheduler that records how many frames were scheduled.
    const schedule = (fn: () => void) => {
      scheduleCalls++;
      fn();
    };

    const chunk = 50;
    let thisFrame = 0;
    let lastProcessed = 0;
    const process = (_i: number) => {
      processed++;
      thisFrame = processed - lastProcessed;
      maxPerFrame.n = Math.max(maxPerFrame.n, thisFrame);
    };
    // Reset per-frame counter each schedule tick.
    const wrappedSchedule = (fn: () => void) => {
      lastProcessed = processed;
      schedule(fn);
    };

    runInChunks(items, chunk, process, wrappedSchedule);

    expect(processed).toBe(500);
    expect(scheduleCalls).toBe(Math.ceil(500 / chunk)); // 10 frames
    expect(maxPerFrame.n).toBeLessThanOrEqual(chunk); // never more than a chunk per frame
  });

  it("does nothing for an empty list", () => {
    let processed = 0;
    runInChunks(
      [],
      50,
      () => processed++,
      (fn) => fn(),
    );
    expect(processed).toBe(0);
  });
});
