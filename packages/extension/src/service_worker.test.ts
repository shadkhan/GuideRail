// Integration coverage for the service worker itself (spec 002 R3 + R5).
//
// The other suites test messages/storage/core in isolation; this one drives the
// actual registered listeners to prove the wiring and — critically — the
// acceptance criterion "kill the worker, trigger a message, state survives
// (storage, not module scope)".

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, it, expect, vi } from "vitest";
import * as storage from "./storage.js";
import { __resetCoreForTest } from "./core.js";
import { __resetClassifiersForTest, DEFAULT_PACK_ID } from "./pack/loader.js";
import { hasEarnedTime } from "./quiz/earned-time.js";
import type { Question } from "@guiderail/quiz-engine";

const HERE = dirname(fileURLToPath(import.meta.url));
const WASM_PATH = resolve(HERE, "..", "..", "core-wasm", "pkg", "guiderail_core_bg.wasm");
const wasmBytes = new Uint8Array(readFileSync(WASM_PATH));

// Importing the SW module registers its listeners on the mocked chrome.runtime.
// Grab the registered handlers so we can invoke them like Chrome would.
let onMessage: (msg: unknown, sender: unknown, sendResponse: (r: unknown) => void) => boolean;
let onInstalled: (details: { reason: string }) => void;
let fetchCalls = 0;

beforeAll(async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      fetchCalls++;
      return new Response(wasmBytes, { headers: { "Content-Type": "application/wasm" } });
    }),
  );
  await import("./service_worker.js");
  const rt = chrome.runtime as unknown as {
    onMessage: { addListener: { mock: { calls: unknown[][] } } };
    onInstalled: { addListener: { mock: { calls: unknown[][] } } };
  };
  onMessage = rt.onMessage.addListener.mock.calls[0]![0] as typeof onMessage;
  onInstalled = rt.onInstalled.addListener.mock.calls[0]![0] as typeof onInstalled;
});

/** Invoke the async onMessage handler and resolve with the response it sends. */
function send(message: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    onMessage(message, {}, resolve);
  });
}

/** Like send(), but with a message sender (so the worker knows the tab id). */
function sendFrom(message: unknown, sender: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    onMessage(message, sender, resolve);
  });
}

/** Put the current weekday fully inside a study window so the pipeline is active. */
async function enableStudyHours(): Promise<void> {
  const now = new Date();
  await storage.set("config.studyHours", { [now.getDay()]: [{ start: "00:00", end: "23:59" }] });
}

/** Drive onInstalled (caches wasm + installs seed packs) and wait until the
 *  default pack is active. Resets the module-scope classifier cache first so
 *  each test starts cold, as a fresh worker would. */
async function seedActivePack(): Promise<void> {
  __resetClassifiersForTest();
  onInstalled({ reason: "install" });
  await vi.waitFor(async () => {
    expect(await storage.getActivePackId()).toBe(DEFAULT_PACK_ID);
  });
}

describe("service worker wiring (R3/R5)", () => {
  it("registers listeners synchronously at top level", () => {
    expect(typeof onMessage).toBe("function");
    expect(typeof onInstalled).toBe("function");
  });

  it("onInstalled runs migrations + caches wasm bytes + seeds packs", async () => {
    __resetClassifiersForTest();
    onInstalled({ reason: "install" });
    await vi.waitFor(async () => {
      expect(await storage.get("wasm.bytes")).toBeTypeOf("string");
      expect(await storage.get("meta.version")).toBe(storage.STORAGE_VERSION);
      expect(await storage.getActivePackId()).toBe(DEFAULT_PACK_ID);
    });
  });

  it("dispatches a valid classify message against the active seed pack", async () => {
    await seedActivePack();
    // No packId → classify against the active pack (R6).
    const res = await send({ kind: "classify", text: "algebra homework" });
    expect(res).toMatchObject({ kind: "classify.result", verdict: "allow" });
    expect((res as { matches: string[] }).matches).toContain("math");
  });

  it("rejects an ad-hoc / malformed payload with a typed error (R3)", async () => {
    const res = await send({ kind: "evil", foo: 1 });
    expect(res).toEqual({ kind: "error", message: expect.any(String) });
  });

  it("state survives a simulated worker kill (storage, not module scope)", async () => {
    // Seed as onInstalled would, then classify once to warm the core + classifier.
    await seedActivePack();
    await send({ kind: "classify", text: "geometry" });
    expect(await storage.get("wasm.bytes")).toBeTypeOf("string");

    // Kill the worker: module scope evaporates (core + classifier caches gone).
    __resetCoreForTest();
    __resetClassifiersForTest();
    const before = fetchCalls;

    // Trigger a message on the "restarted" worker. It must re-instantiate from
    // the STORAGE-cached bytes and rebuild the classifier from the STORAGE-cached
    // pack (no new fetch), proving durable state lived in chrome.storage and not
    // in a module-scope variable.
    const res = await send({ kind: "classify", text: "photosynthesis" });
    expect(res).toMatchObject({ kind: "classify.result", verdict: "allow" });
    expect(fetchCalls).toBe(before); // re-instantiated from storage, not re-fetched
  });
});

describe("page.eval pipeline wiring (spec 004 / 004A)", () => {
  const tabsUpdate = () => chrome.tabs.update as unknown as ReturnType<typeof vi.fn>;

  it("allows a pack allow_domains page without redirecting", async () => {
    await seedActivePack();
    await enableStudyHours();
    tabsUpdate().mockClear();
    const res = await sendFrom(
      {
        kind: "page.eval",
        url: "https://www.khanacademy.org/math",
        title: "Algebra",
        description: "",
      },
      { tab: { id: 7 } },
    );
    // Trusted allow-domain → whole-page unblur (spec 006).
    expect(res).toMatchObject({
      kind: "page.eval.result",
      verdict: "allow",
      action: "none",
      reveal: true,
    });
    expect(tabsUpdate()).not.toHaveBeenCalled();
  });

  it("tells the content script to KEEP blur on a fail-open unknown page (spec 006)", async () => {
    await seedActivePack();
    await enableStudyHours();
    const res = await sendFrom(
      {
        kind: "page.eval",
        url: "https://some-unknown-blog.example/post",
        title: "random",
        description: "",
      },
      { tab: { id: 8 } },
    );
    // Loaded (consumer fail-open) but untrusted → reveal:false → per-element guard.
    expect(res).toMatchObject({ kind: "page.eval.result", verdict: "allow", reveal: false });
  });

  it("gates an entertainment domain and redirects the tab to the quiz gate", async () => {
    await seedActivePack();
    await enableStudyHours();
    tabsUpdate().mockClear();
    const res = await sendFrom(
      { kind: "page.eval", url: "https://www.instagram.com/reels", title: "", description: "" },
      { tab: { id: 42 } },
    );
    expect(res).toMatchObject({ kind: "page.eval.result", verdict: "quiz_gate", action: "gate" });
    expect(tabsUpdate()).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ url: expect.stringContaining("quiz_gate.html") }),
    );
  });

  it("gates a non-allowlisted YouTube watch (004A)", async () => {
    await seedActivePack();
    await enableStudyHours();
    const res = await sendFrom(
      {
        kind: "page.eval",
        url: "https://www.youtube.com/watch?v=x",
        title: "",
        description: "",
        yt: { channelId: "UCnope0000000000000000x" },
      },
      { tab: { id: 9 } },
    );
    expect(res).toMatchObject({ verdict: "quiz_gate", action: "gate" });
  });

  it("persists a YouTube resolution failure for selector maintenance (004A A3)", async () => {
    await seedActivePack();
    await enableStudyHours();
    const res = await sendFrom(
      {
        kind: "page.eval",
        url: "https://www.youtube.com/watch?v=x",
        title: "",
        description: "",
        yt: { channelId: null }, // resolution failed
      },
      { tab: { id: 3 } },
    );
    expect(res).toMatchObject({ verdict: "quiz_gate", action: "gate" });
    await vi.waitFor(async () => {
      const failures = await storage.get("yt.resolutionFailures");
      expect(failures?.some((f) => f.url.includes("youtube.com/watch"))).toBe(true);
    });
  });

  it("is a no-op outside study hours (no gating)", async () => {
    await seedActivePack();
    await storage.set("config.studyHours", {}); // no windows → always outside
    tabsUpdate().mockClear();
    const res = await sendFrom(
      { kind: "page.eval", url: "https://www.instagram.com/reels", title: "", description: "" },
      { tab: { id: 1 } },
    );
    // Outside study hours: allow, no gating, AND whole-page reveal (no blur, spec 006).
    expect(res).toMatchObject({ verdict: "allow", action: "none", reveal: true });
    expect(tabsUpdate()).not.toHaveBeenCalled();
  });
});

describe("quiz gate + earned time (spec 005)", () => {
  const SRC = "https://www.instagram.com/reels";

  /** Read the worker's stored attempt (with answer keys) so the test can answer. */
  async function storedQuestions(attemptId: string): Promise<Question[]> {
    const k = `gr.attempt.${attemptId}`;
    const out = await chrome.storage.session.get(k);
    return (out[k] as { questions: Question[] }).questions;
  }

  it("quiz.start returns 3 questions with the answer keys stripped", async () => {
    await seedActivePack();
    const res = (await send({ kind: "quiz.start", src: SRC })) as {
      kind: string;
      questions: unknown[];
    };
    expect(res.kind).toBe("quiz.questions");
    expect(res.questions).toHaveLength(3);
    expect(res.questions[0]).not.toHaveProperty("answerIndex");
  });

  it("passing the quiz grants earned time for the scope", async () => {
    await seedActivePack();
    const start = (await send({ kind: "quiz.start", src: SRC })) as { attemptId: string };
    const questions = await storedQuestions(start.attemptId);
    const answers = questions.map((q) => q.answerIndex); // all correct

    const result = await send({ kind: "quiz.submit", attemptId: start.attemptId, answers });
    expect(result).toMatchObject({ kind: "quiz.result", passed: true });
    expect(await hasEarnedTime("instagram.com", Date.now())).toBe(true);

    // R7: the local log records pass/fail AND the quizzed topics for the digest.
    const log = await storage.get("quiz.log");
    expect(log?.at(-1)).toMatchObject({ scope: "instagram.com", passed: true });
    expect(log?.at(-1)?.topics.length ?? 0).toBeGreaterThan(0);
  });

  it("failing starts a grace lockout; the next start is locked", async () => {
    await seedActivePack();
    const start = (await send({ kind: "quiz.start", src: SRC })) as { attemptId: string };
    const questions = await storedQuestions(start.attemptId);
    const wrong = questions.map((q) => (q.answerIndex + 1) % 4); // all wrong

    const result = (await send({
      kind: "quiz.submit",
      attemptId: start.attemptId,
      answers: wrong,
    })) as { passed: boolean; retryAtMs: number };
    expect(result.passed).toBe(false);
    expect(result.retryAtMs).toBeGreaterThan(Date.now());

    const again = (await send({ kind: "quiz.start", src: SRC })) as { kind: string };
    expect(again.kind).toBe("quiz.locked");
  });
});
