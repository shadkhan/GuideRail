import { describe, it, expect } from "vitest";
import { grade } from "./grader.js";
import type { Question } from "./types.js";

const q = (id: string, topic: string, answerIndex: number): Question => ({
  id,
  topic,
  prompt: `q${id}`,
  options: ["a", "b", "c", "d"],
  answerIndex,
});

const QS = [q("1", "math", 0), q("2", "science", 1), q("3", "history", 2)];

describe("grade (threshold 2 of 3)", () => {
  it("passes on 3/3", () => {
    expect(grade(QS, [0, 1, 2], 2)).toMatchObject({
      passed: true,
      correctCount: 3,
      missedTopics: [],
    });
  });
  it("passes on 2/3 and reports the missed topic", () => {
    const r = grade(QS, [0, 1, 0], 2); // history wrong
    expect(r).toMatchObject({ passed: true, correctCount: 2 });
    expect(r.missedTopics).toEqual(["history"]);
  });
  it("fails on 1/3", () => {
    const r = grade(QS, [0, 0, 0], 2);
    expect(r.passed).toBe(false);
    expect(r.correctCount).toBe(1);
    expect(r.missedTopics).toEqual(["science", "history"]);
  });
  it("fails on 0/3", () => {
    expect(grade(QS, [3, 3, 3], 2)).toMatchObject({ passed: false, correctCount: 0 });
  });
  it("honors a strict 3/3 threshold", () => {
    expect(grade(QS, [0, 1, 0], 3).passed).toBe(false);
  });
});
