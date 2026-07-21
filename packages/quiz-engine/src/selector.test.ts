import { describe, it, expect } from "vitest";
import { selectQuestions } from "./selector.js";
import type { Question, QuestionBank } from "./types.js";

const q = (id: string, topic: string): Question => ({
  id,
  topic,
  prompt: `q${id}`,
  options: ["a", "b", "c", "d"],
  answerIndex: 0,
});

const BANK: QuestionBank = [
  q("m1", "math"),
  q("m2", "math"),
  q("s1", "science"),
  q("s2", "science"),
  q("h1", "history"),
  q("h2", "history"),
];

describe("selectQuestions", () => {
  it("returns the whole bank when it is not larger than count", () => {
    const small = BANK.slice(0, 3);
    expect(
      selectQuestions(small, new Map(), 3)
        .map((x) => x.id)
        .sort(),
    ).toEqual(["m1", "m2", "s1"]);
  });

  it("always returns `count` distinct questions", () => {
    for (let i = 0; i < 200; i++) {
      const chosen = selectQuestions(BANK, new Map(), 3);
      expect(chosen).toHaveLength(3);
      expect(new Set(chosen.map((c) => c.id)).size).toBe(3); // no repeats
    }
  });

  it("favors topics the child read recently", () => {
    const weights = new Map([["science", 10]]); // heavy recent science reading
    let sciencePicks = 0;
    let historyPicks = 0;
    const RUNS = 3000;
    for (let i = 0; i < RUNS; i++) {
      for (const c of selectQuestions(BANK, weights, 3)) {
        if (c.topic === "science") sciencePicks++;
        if (c.topic === "history") historyPicks++;
      }
    }
    // With a 31:1 weight ratio, science must dominate history by a wide margin.
    expect(sciencePicks).toBeGreaterThan(historyPicks * 2);
  });

  it("falls back to a fair spread when there is no reading history", () => {
    const counts = new Map<string, number>();
    const RUNS = 3000;
    for (let i = 0; i < RUNS; i++) {
      for (const c of selectQuestions(BANK, new Map(), 3)) {
        counts.set(c.topic, (counts.get(c.topic) ?? 0) + 1);
      }
    }
    // No topic should be starved under uniform weighting.
    for (const topic of ["math", "science", "history"]) {
      expect(counts.get(topic) ?? 0).toBeGreaterThan(0);
    }
  });
});
