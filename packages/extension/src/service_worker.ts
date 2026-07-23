// GuideRail MV3 service worker.
//
// MV3 = Manifest V3, Chrome's current extension platform. The critical
// difference from MV2: there's no persistent background page. Instead there's a
// service worker that Chrome starts on demand and kills after ~30 seconds of
// idle time. Practical consequences:
//
//   1. NEVER store durable state in module-scope variables — it evaporates on
//      restart. Use chrome.storage (see storage.ts). The WASM instance is a
//      module-scope PERFORMANCE cache only, rebuilt on wake (see core.ts).
//   2. Register event listeners synchronously at the TOP LEVEL of this file.
//      Listeners registered inside async callbacks are lost when the worker
//      restarts — the runtime never re-runs the callback (Learning L-006).
//   3. Time-based logic must use chrome.alarms (persists across sleep), not
//      setTimeout (dies when the worker dies).
//
// PII = Personally Identifiable Information (scrubbed by core.sanitize()).
// DNR = declarativeNetRequest (the gate-list redirect, see pipeline/dnr.ts).

import {
  isClassifyRequest,
  isPageEvalRequest,
  isQuizStartRequest,
  isQuizSubmitRequest,
  isSettingsGetRequest,
  isSettingsUpdateRequest,
  isPinSetRequest,
  isPinVerifyRequest,
  type ClassifyResponse,
  type ErrorResponse,
  type PageEvalResponse,
  type QuizQuestionsResponse,
  type QuizResultResponse,
  type SettingsSnapshotResponse,
  type SettingsUpdate,
} from "./messages.js";
import { cacheWasmBytes, ensureCore } from "./core.js";
import * as storage from "./storage.js";
import { runMigrations } from "./storage.js";
import {
  classify,
  installSeedPacks,
  getActivePack,
  listPacks,
  setActivePack,
} from "./pack/loader.js";
import { evaluate, type EvalDeps } from "./pipeline/policy.js";
import { getCached, putCached } from "./pipeline/verdict-cache.js";
import { enqueueForClassification } from "./pipeline/queue.js";
import { appendReading } from "./pipeline/reading-history.js";
import { reconcileGateRules } from "./pipeline/dnr.js";
import { nextTransition } from "./pipeline/study-hours.js";
import { recordResolutionFailure } from "./pipeline/yt-diagnostics.js";
import { shouldReveal } from "./blur/activate.js";
import { DEFAULT_SCHEDULE, isStudyTime, localDateKey } from "./settings/study-time.js";
import {
  addGateDomain,
  effectiveGateList,
  isGateListedIn,
  removeGateDomain,
} from "./settings/gate-list-config.js";
import {
  hashPin,
  isValidPin,
  isLocked,
  registerFailure,
  resetLockout,
  verifyPin,
} from "./settings/pin.js";
import { remainingMinutes } from "@guiderail/quiz-engine";
import {
  DEFAULT_EARNED_MINUTES,
  EARNED_WINDOW_CHOICES,
  PASS_THRESHOLD_DEFAULT,
  grade,
  selectQuestions,
  stripAnswer,
  topicWeights,
  type GradeResult,
} from "@guiderail/quiz-engine";
import { bankForPack } from "./quiz/banks/index.js";
import { newAttemptId, putAttempt, takeAttempt } from "./quiz/session.js";
import { clearLockout, lockedUntil, startLockout } from "./quiz/grace.js";
import {
  grantEarnedTime,
  handleEarnedAlarm,
  hasEarnedTime,
  reconcileEarnedTime,
} from "./quiz/earned-time.js";
import { scopeOf } from "./quiz/scope.js";

const STUDY_HOURS_ALARM = "gr.study-hours";

/** Resolve the parent-set earned window, defaulting to 30 (spec 005 Q2). */
async function earnedWindowMinutes(): Promise<number> {
  const m = await storage.get("config.earnedWindowMinutes");
  return m !== undefined && (EARNED_WINDOW_CHOICES as readonly number[]).includes(m)
    ? m
    : DEFAULT_EARNED_MINUTES;
}

/** Append a local-only quiz attempt record for the future digest (spec 005 R7:
 *  passed/failed AND topics — which subjects were quizzed and which were missed). */
async function appendQuizLog(scope: string, result: GradeResult, topics: string[]): Promise<void> {
  const log = (await storage.get("quiz.log")) ?? [];
  log.push({
    at: new Date().toISOString(),
    scope,
    passed: result.passed,
    correctCount: result.correctCount,
    total: result.total,
    topics,
    missedTopics: result.missedTopics,
  });
  await storage.set("quiz.log", log.slice(-500));
}

const errResp = (e: unknown): ErrorResponse => ({
  kind: "error",
  message: e instanceof Error ? e.message : String(e),
});

// --- Settings snapshot + mutations (spec 007 R7) ---------------------------
async function buildSnapshot(): Promise<SettingsSnapshotResponse> {
  const now = new Date();
  const [
    onboarding,
    pinRec,
    childName,
    activePack,
    availablePacks,
    studyHours,
    earnedMin,
    gateList,
    pausedDate,
    tokens,
  ] = await Promise.all([
    storage.get("config.onboarding"),
    storage.get("config.pin"),
    storage.get("config.childName"),
    getActivePack(),
    listPacks(),
    storage.get("config.studyHours"),
    earnedWindowMinutes(),
    effectiveGateList(),
    storage.get("config.pausedDate"),
    storage.get("earned.tokens"),
  ]);
  const remaining = Math.max(
    0,
    ...Object.values(tokens ?? {}).map((t) => remainingMinutes(t, now.getTime())),
  );
  return {
    kind: "settings.snapshot",
    onboarding: onboarding ?? null,
    hasPin: pinRec !== undefined,
    childName: childName ?? null,
    activePack: activePack
      ? { id: activePack.id, board: activePack.board, grade_band: activePack.grade_band }
      : null,
    availablePacks,
    studyHours: studyHours ?? {},
    earnedWindowMinutes: earnedMin,
    gateList,
    pausedToday: pausedDate === localDateKey(now),
    earnedRemainingMinutes: remaining,
  };
}

async function applySettingsUpdate(u: SettingsUpdate): Promise<void> {
  switch (u.op) {
    case "child":
      await storage.set("config.childName", u.name);
      await setActivePack(u.packId);
      break;
    case "studyHours":
      await storage.set("config.studyHours", u.schedule);
      await reconcileStudyHours();
      break;
    case "earnedWindow":
      if ((EARNED_WINDOW_CHOICES as readonly number[]).includes(u.minutes)) {
        await storage.set("config.earnedWindowMinutes", u.minutes);
      }
      break;
    case "gateAdd":
      await addGateDomain(u.domain);
      await reconcileStudyHours(); // refresh the DNR rule with the new effective list
      break;
    case "gateRemove":
      await removeGateDomain(u.domain);
      await reconcileStudyHours();
      break;
    case "pauseToday":
      await storage.set("config.pausedDate", localDateKey(new Date()));
      console.log("[gr] protection paused for the rest of today");
      await reconcileStudyHours(); // lift gating now
      break;
    case "onboarding":
      await storage.set("config.onboarding", u.state);
      break;
  }
}

// --- Study-hours reconciliation (spec 004 R1/Q1) ---------------------------
// Bring the gate-list DNR rule into line with the per-weekday schedule, then arm
// a single alarm for the next window transition. Idempotent — safe to run on
// install, browser startup, and each alarm fire.
async function reconcileStudyHours(): Promise<void> {
  const now = new Date();
  const [active, domains] = await Promise.all([isStudyTime(now), effectiveGateList()]);
  await reconcileGateRules(active, domains);
  const schedule = (await storage.get("config.studyHours")) ?? {};
  const next = nextTransition(schedule, now);
  if (next) {
    await chrome.alarms.create(STUDY_HOURS_ALARM, { when: next.getTime() });
  }
}

// --- Build the pipeline's injected dependencies from live state -------------
async function buildDeps(): Promise<EvalDeps> {
  const [pack, profile, studyActive, gateDomains] = await Promise.all([
    getActivePack(),
    storage.get("config.profile"),
    isStudyTime(new Date()), // the single study-time source (spec 007 R2)
    effectiveGateList(), // base ± parent edits (spec 007 R3)
  ]);
  return {
    studyActive,
    profile: profile ?? "consumer",
    pack,
    classify: (text) => classify(text),
    cacheGet: (origin) => getCached(origin),
    cachePut: (origin, verdict, matches) => putCached(origin, verdict, matches),
    enqueue: (text) => enqueueForClassification(text),
    recordReading: (tags) => appendReading(tags),
    hasEarnedTime: (host) => hasEarnedTime(host),
    isGateListed: (host) => isGateListedIn(host, gateDomains),
  };
}

// --- Top-level listeners (registered synchronously; L-006) ------------------

function openOptionsPage(): void {
  void chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
}

chrome.runtime.onInstalled.addListener((details) => {
  void (async () => {
    await runMigrations();
    await cacheWasmBytes();
    await installSeedPacks();
    // Pre-fill the default study schedule so protection works even pre-onboarding (R2).
    if ((await storage.get("config.studyHours")) === undefined) {
      await storage.set("config.studyHours", DEFAULT_SCHEDULE);
    }
    await reconcileStudyHours();
    await reconcileEarnedTime();
    console.log(`[gr] onInstalled (${details.reason}): setup done`);
    // First install → open the onboarding wizard (spec 007 R1).
    if (details.reason === "install") openOptionsPage();
  })();
});

// Toolbar click → open the parent options/settings page (PIN-gated inside).
chrome.action.onClicked.addListener(() => openOptionsPage());

// Browser restart: the worker wakes with no alarm guaranteed — reconcile both.
chrome.runtime.onStartup.addListener(() => {
  void reconcileStudyHours();
  void reconcileEarnedTime();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  void (async () => {
    // Earned-time expiry/badge alarms first; otherwise the study-hours alarm.
    if (await handleEarnedAlarm(alarm.name)) return;
    if (alarm.name === STUDY_HOURS_ALARM) await reconcileStudyHours();
  })();
});

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  // Trust boundary: a message crossing chrome.runtime is untyped and may come
  // from a compromised page. Validate the shape before acting on it (R3).

  // Page evaluation — the real filtering path (spec 004).
  if (isPageEvalRequest(message)) {
    void (async () => {
      try {
        const t = performance.now();
        const result = await evaluate(
          {
            url: message.url,
            title: message.title,
            description: message.description,
            ytChannelId: message.yt?.channelId,
          },
          await buildDeps(),
        );
        console.log(
          `[gr-bench] eval=${(performance.now() - t).toFixed(3)}ms verdict=${result.verdict} (${result.reason})`,
        );

        // Persist YouTube resolution failures so a broken channelId selector is
        // detectable after the fact, not only in live worker DevTools (004A A3).
        if (result.reason === "yt-resolution-failure") {
          void recordResolutionFailure(message.url);
        }

        // Non-declarative gating (metadata classify + YouTube channel/SPA) is
        // enforced here by redirecting the sender's tab — DNR can't see SPA hops.
        if (result.action === "gate") {
          const tabId = sender.tab?.id;
          if (tabId !== undefined) {
            const dest = `${chrome.runtime.getURL("quiz_gate.html")}?src=${encodeURIComponent(message.url)}`;
            void chrome.tabs.update(tabId, { url: dest });
          }
        }

        const res: PageEvalResponse = {
          kind: "page.eval.result",
          verdict: result.verdict,
          matches: result.matches,
          action: result.action,
          // Blur blanket (spec 006): whole-page unblur unless the page is gated or
          // merely failed open as unknown (loaded but untrusted → per-element guard).
          reveal: shouldReveal({ verdict: result.verdict, reason: result.reason }),
        };
        sendResponse(res);
      } catch (e) {
        const err: ErrorResponse = {
          kind: "error",
          message: e instanceof Error ? e.message : String(e),
        };
        sendResponse(err);
      }
    })();
    return true; // async response
  }

  // Quiz start — select 3 questions for the gated origin (spec 005 R2/R3).
  if (isQuizStartRequest(message)) {
    void (async () => {
      try {
        const scope = scopeOf(message.src);
        if (scope === null) {
          sendResponse({ kind: "error", message: "invalid quiz src" } satisfies ErrorResponse);
          return;
        }
        const locked = await lockedUntil(scope);
        if (locked !== null) {
          sendResponse({ kind: "quiz.locked", retryAtMs: locked });
          return;
        }
        const pack = await getActivePack();
        const bank = pack ? bankForPack(pack.id) : undefined;
        if (!bank || bank.length === 0) {
          sendResponse({
            kind: "error",
            message: "no question bank for active pack",
          } satisfies ErrorResponse);
          return;
        }
        const history = (await storage.get("reading.history")) ?? [];
        const questions = selectQuestions(bank, topicWeights(history, Date.now()));
        const attemptId = newAttemptId();
        await putAttempt(attemptId, {
          questions,
          scope,
          threshold: PASS_THRESHOLD_DEFAULT,
          createdAt: Date.now(),
        });
        const res: QuizQuestionsResponse = {
          kind: "quiz.questions",
          attemptId,
          questions: questions.map(stripAnswer), // answer keys never leave the worker
        };
        sendResponse(res);
      } catch (e) {
        sendResponse({
          kind: "error",
          message: e instanceof Error ? e.message : String(e),
        } satisfies ErrorResponse);
      }
    })();
    return true;
  }

  // Quiz submit — grade server-side; on pass, grant earned time (spec 005 R3/R4).
  if (isQuizSubmitRequest(message)) {
    void (async () => {
      try {
        const attempt = await takeAttempt(message.attemptId);
        if (!attempt) {
          sendResponse({
            kind: "error",
            message: "unknown or expired quiz attempt",
          } satisfies ErrorResponse);
          return;
        }
        const result = grade(attempt.questions, message.answers, attempt.threshold);
        const topics = [...new Set(attempt.questions.map((q) => q.topic))];
        await appendQuizLog(attempt.scope, result, topics);

        if (result.passed) {
          await clearLockout(attempt.scope);
          const minutes = await earnedWindowMinutes();
          await grantEarnedTime(attempt.scope, minutes);
          sendResponse({
            kind: "quiz.result",
            passed: true,
            correctCount: result.correctCount,
            total: result.total,
            missedTopics: result.missedTopics,
            grantedMinutes: minutes,
          } satisfies QuizResultResponse);
        } else {
          const retryAtMs = await startLockout(attempt.scope);
          sendResponse({
            kind: "quiz.result",
            passed: false,
            correctCount: result.correctCount,
            total: result.total,
            missedTopics: result.missedTopics,
            retryAtMs,
          } satisfies QuizResultResponse);
        }
      } catch (e) {
        sendResponse({
          kind: "error",
          message: e instanceof Error ? e.message : String(e),
        } satisfies ErrorResponse);
      }
    })();
    return true;
  }

  // Settings snapshot for the options + rules pages (spec 007 R7).
  if (isSettingsGetRequest(message)) {
    void (async () => {
      try {
        sendResponse(await buildSnapshot());
      } catch (e) {
        sendResponse(errResp(e));
      }
    })();
    return true;
  }

  // Settings mutation — the ONLY write path from UI (spec 007 R7).
  if (isSettingsUpdateRequest(message)) {
    void (async () => {
      try {
        await applySettingsUpdate(message.update);
        sendResponse({ kind: "settings.ok" });
      } catch (e) {
        sendResponse(errResp(e));
      }
    })();
    return true;
  }

  // Set/replace the parent PIN (onboarding or settings) — spec 007 R5.
  if (isPinSetRequest(message)) {
    void (async () => {
      try {
        if (!isValidPin(message.pin)) {
          sendResponse({
            kind: "error",
            message: "PIN must be 4–6 digits",
          } satisfies ErrorResponse);
          return;
        }
        await storage.set("config.pin", await hashPin(message.pin));
        await storage.set("config.pinLockout", resetLockout());
        sendResponse({ kind: "settings.ok" });
      } catch (e) {
        sendResponse(errResp(e));
      }
    })();
    return true;
  }

  // Verify the PIN with lockout enforcement (spec 007 R5).
  if (isPinVerifyRequest(message)) {
    void (async () => {
      try {
        const now = Date.now();
        const lockout = await storage.get("config.pinLockout");
        if (isLocked(lockout, now)) {
          sendResponse({ kind: "pin.result", ok: false, lockedUntil: lockout!.until });
          return;
        }
        const record = await storage.get("config.pin");
        const ok = record !== undefined && (await verifyPin(message.pin, record));
        if (ok) {
          await storage.set("config.pinLockout", resetLockout());
          sendResponse({ kind: "pin.result", ok: true });
        } else {
          const next = registerFailure(lockout, now);
          await storage.set("config.pinLockout", next);
          sendResponse({
            kind: "pin.result",
            ok: false,
            ...(next.until > now ? { lockedUntil: next.until } : {}),
          });
        }
      } catch (e) {
        sendResponse(errResp(e));
      }
    })();
    return true;
  }

  // Raw classify — retained for the dev console / diagnostics.
  if (isClassifyRequest(message)) {
    void (async () => {
      try {
        const result = await classify(message.text, message.packId);
        const res: ClassifyResponse = {
          kind: "classify.result",
          verdict: result.verdict,
          matches: result.matches,
        };
        sendResponse(res);
      } catch (e) {
        const err: ErrorResponse = {
          kind: "error",
          message: e instanceof Error ? e.message : String(e),
        };
        sendResponse(err);
      }
    })();
    return true;
  }

  const err: ErrorResponse = { kind: "error", message: "unrecognized or malformed message" };
  sendResponse(err);
  return false; // responded synchronously
});

// --- Dev affordance -------------------------------------------------------
// Exposes the core on the worker global so you can exercise it directly from
// the service-worker DevTools console during manual testing:
//   await gr.classify("algebra and photosynthesis")            // active pack
//   await gr.sanitize("email me at kid@example.com")
//   await gr.reconcile()                                       // re-apply study-hours
// Uses globalThis (= the worker's `self`) so it also loads harmlessly under the
// Node test runner. Purely a debugging convenience; safe to delete.
(globalThis as unknown as { gr?: unknown }).gr = {
  classify: async (text: string, packId?: string) => classify(text, packId),
  sanitize: async (text: string) => (await ensureCore()).sanitize(text),
  reconcile: async () => reconcileStudyHours(),
};
