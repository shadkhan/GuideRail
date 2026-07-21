// Quiz gate page script (spec 005). Renders the earn-time quiz, submits answers,
// and shows the pass countdown or the grace-mode retry. It NEVER sees answer
// keys — the worker grades. All state lives in the page for its lifetime only.

import {
  sendQuizStart,
  sendQuizSubmit,
  type QuizQuestionsResponse,
  type QuizResultResponse,
} from "./messages.js";

const app = document.getElementById("app")!;
const src = new URLSearchParams(location.search).get("src") ?? "";

// --- tiny DOM helper --------------------------------------------------------
type Props = Record<string, string> & { text?: string };
function h(tag: string, props: Props = {}, ...kids: (Node | string)[]): HTMLElement {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") e.className = v;
    else if (k === "text") e.textContent = v;
    else e.setAttribute(k, v);
  }
  for (const kid of kids) e.append(kid);
  return e;
}
function clear(): void {
  app.replaceChildren();
}
function header(title: string, lede?: string): void {
  app.append(h("p", { class: "eyebrow", text: "GuideRail" }), h("h1", { text: title }));
  if (lede) app.append(h("p", { class: "lede", text: lede }));
}
function rulesFooter(): HTMLElement {
  // R6: child transparency — link to the rules screen (spec 007).
  const a = h("a", { href: "#rules", text: "Why am I seeing this? See my rules." });
  return h("footer", {}, a);
}
function siteLabel(): string {
  try {
    return new URL(src).hostname || "your page";
  } catch {
    return "your page";
  }
}

// --- states -----------------------------------------------------------------
function renderError(message: string): void {
  clear();
  header("Something went wrong", message);
  app.append(rulesFooter());
}

function renderLocked(retryAtMs: number): void {
  clear();
  const at = new Date(retryAtMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  header(
    "Take a short break",
    `You can try again at ${at}. Revisit today's reading in the meantime.`,
  );
  app.append(h("p", { class: "badge-grace", text: `Retry unlocks at ${at}.` }), rulesFooter());
}

function renderQuiz(resp: QuizQuestionsResponse): void {
  clear();
  header(
    "Earn your time",
    `Answer these three questions from your recent reading to unlock ${siteLabel()}.`,
  );

  const form = h("form");
  resp.questions.forEach((q, qi) => {
    const fs = h("fieldset");
    fs.append(h("legend", { text: `${qi + 1}. ${q.prompt}` }));
    q.options.forEach((opt, oi) => {
      const id = `q${qi}_o${oi}`;
      const input = h("input", { type: "radio", name: `q${qi}`, id, value: String(oi) });
      const label = h("label", { class: "opt", for: id }, input, opt);
      fs.append(label);
    });
    form.append(fs);
  });

  const submit = h("button", { type: "submit", text: "Check my answers" }) as HTMLButtonElement;
  form.append(submit);
  app.append(form, rulesFooter());

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const answers: number[] = resp.questions.map((_, qi) => {
      const checked = form.querySelector<HTMLInputElement>(`input[name="q${qi}"]:checked`);
      return checked ? Number(checked.value) : -1;
    });
    if (answers.includes(-1)) return; // require an answer for each
    submit.disabled = true;
    submit.textContent = "Checking…";
    void submitAnswers(resp.attemptId, answers);
  });
}

async function submitAnswers(attemptId: string, answers: number[]): Promise<void> {
  try {
    const result = await sendQuizSubmit({ kind: "quiz.submit", attemptId, answers });
    if (result.passed) renderPass(result);
    else renderFail(result);
  } catch (e) {
    renderError(e instanceof Error ? e.message : String(e));
  }
}

function renderPass(result: QuizResultResponse): void {
  clear();
  const minutes = result.grantedMinutes ?? 30;
  header(
    "Nice — you earned it.",
    `${result.correctCount}/${result.total} correct. ${siteLabel()} is unlocked.`,
  );

  const timer = h("div", { class: "timer", text: `${minutes}:00` });
  app.append(h("p", { class: "badge-pass", text: `${minutes} minutes earned` }), timer);

  const back = h("button", { text: `Back to ${siteLabel()}` });
  back.addEventListener("click", () => {
    if (src) location.href = src;
  });
  app.append(back, rulesFooter());

  // Cosmetic countdown; the worker's alarm + badge are the source of truth.
  let remaining = minutes * 60;
  const tick = () => {
    remaining -= 1;
    if (remaining <= 0) {
      timer.textContent = "0:00 — time's up";
      window.clearInterval(id);
      return;
    }
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    timer.textContent = `${m}:${String(s).padStart(2, "0")}`;
  };
  const id = window.setInterval(tick, 1000);
}

function renderFail(result: QuizResultResponse): void {
  clear();
  header(
    "Not quite — let's revisit.",
    `${result.correctCount}/${result.total} correct. No lockout forever — just a short break.`,
  );
  if (result.missedTopics.length > 0) {
    app.append(h("div", { class: "revisit", text: `Revisit: ${result.missedTopics.join(", ")}` }));
  }
  if (result.retryAtMs !== undefined) {
    const at = new Date(result.retryAtMs).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    app.append(h("p", { class: "badge-grace", text: `Try again at ${at}.` }));
  }
  app.append(rulesFooter());
}

// --- boot -------------------------------------------------------------------
async function start(): Promise<void> {
  if (!src) {
    renderError("No source page was provided.");
    return;
  }
  try {
    const resp = await sendQuizStart({ kind: "quiz.start", src });
    if (resp.kind === "quiz.locked") renderLocked(resp.retryAtMs);
    else renderQuiz(resp);
  } catch (e) {
    renderError(e instanceof Error ? e.message : String(e));
  }
}

void start();
