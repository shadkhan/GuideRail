// Options page (spec 007): first-run onboarding wizard, then PIN-gated parent
// settings. Never writes storage directly — every mutation goes through the
// worker via the typed message wrappers (R7). Thin DOM shell over pure logic.

import {
  sendSettingsGet,
  sendSettingsUpdate,
  sendPinSet,
  sendPinVerify,
  type SettingsSnapshotResponse,
} from "./messages.js";
import {
  advance,
  initialOnboarding,
  isComplete,
  type OnboardingState,
} from "./settings/onboarding.js";
import { isValidPin } from "./settings/pin.js";
import type { StudySchedule, Weekday } from "./pipeline/study-hours.js";
import { h, errMsg } from "./pages/dom.js";

const app = document.getElementById("app")!;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const RULES_URL = chrome.runtime.getURL("rules.html");

let snap: SettingsSnapshotResponse;

async function refresh(): Promise<void> {
  snap = await sendSettingsGet();
}

// --- reusable schedule editor (onboarding step 3 + settings) ---------------
function scheduleEditor(initial: StudySchedule): { el: HTMLElement; collect: () => StudySchedule } {
  const wrap = h("div");
  const rows: Array<{
    day: number;
    enable: HTMLInputElement;
    start: HTMLInputElement;
    end: HTMLInputElement;
  }> = [];
  for (let d = 0; d < 7; d++) {
    const w = initial[d as Weekday]?.[0] ?? null;
    const enable = h("input", {
      type: "checkbox",
      "aria-label": `Study on ${WEEKDAYS[d]}`,
    }) as HTMLInputElement;
    enable.checked = w !== null;
    const start = h("input", {
      type: "time",
      "aria-label": `${WEEKDAYS[d]} start`,
    }) as HTMLInputElement;
    start.value = w?.start ?? "09:00";
    const end = h("input", {
      type: "time",
      "aria-label": `${WEEKDAYS[d]} end`,
    }) as HTMLInputElement;
    end.value = w?.end ?? "15:00";
    wrap.append(
      h(
        "div",
        { class: "row" },
        h("strong", { style: "width:44px", text: WEEKDAYS[d]! }),
        enable,
        start,
        h("span", { text: "to" }),
        end,
      ),
    );
    rows.push({ day: d, enable, start, end });
  }
  const collect = (): StudySchedule => {
    const s: StudySchedule = {};
    for (const r of rows)
      if (r.enable.checked) s[r.day as Weekday] = [{ start: r.start.value, end: r.end.value }];
    return s;
  };
  return { el: wrap, collect };
}

// --- onboarding wizard ------------------------------------------------------
async function saveAndAdvance(state: OnboardingState): Promise<void> {
  const next = advance(state);
  await sendSettingsUpdate({ op: "onboarding", state: next });
  await refresh();
  route();
}

function stepCard(step: number, title: string, ...kids: Array<Node | string>): HTMLElement {
  return h(
    "div",
    { class: "card" },
    h("p", { class: "steps", text: `Step ${step} of 4` }),
    h("h1", { text: title }),
    ...kids,
  );
}

function renderPinStep(state: OnboardingState): void {
  const pin = h("input", {
    type: "password",
    inputmode: "numeric",
    id: "pin",
    autocomplete: "new-password",
  }) as HTMLInputElement;
  const pin2 = h("input", {
    type: "password",
    inputmode: "numeric",
    id: "pin2",
  }) as HTMLInputElement;
  const err = h("p", { class: "error" });
  const next = h("button", { text: "Set PIN & continue" });
  next.addEventListener("click", async () => {
    err.textContent = "";
    if (!isValidPin(pin.value)) return void (err.textContent = "PIN must be 4–6 digits.");
    if (pin.value !== pin2.value) return void (err.textContent = "The PINs don't match.");
    try {
      await sendPinSet(pin.value);
      await saveAndAdvance(state);
    } catch (e) {
      err.textContent = errMsg(e);
    }
  });
  app.replaceChildren(
    stepCard(
      1,
      "Set a parent PIN",
      h("p", {
        class: "muted",
        text: "4–6 digits, needed to change settings. Honest note: on a home computer this is a speed bump, not a vault — and there's no reset, so if you forget it you'll re-do this quick setup.",
      }),
      h("label", { for: "pin", text: "PIN" }),
      pin,
      h("label", { for: "pin2", text: "Confirm PIN" }),
      pin2,
      err,
      next,
    ),
  );
}

function renderChildStep(state: OnboardingState): void {
  const name = h("input", { type: "text", id: "child", autocomplete: "off" }) as HTMLInputElement;
  name.value = snap.childName ?? "";
  const select = h("select", { id: "pack" }) as HTMLSelectElement;
  for (const p of snap.availablePacks) {
    const opt = h("option", { value: p.id, text: `${p.board} — Class ${p.grade_band}` });
    if (snap.activePack?.id === p.id) opt.setAttribute("selected", "selected");
    select.append(opt);
  }
  const err = h("p", { class: "error" });
  const next = h("button", { text: "Continue" });
  next.addEventListener("click", async () => {
    err.textContent = "";
    if (name.value.trim() === "") return void (err.textContent = "Please enter your child's name.");
    try {
      await sendSettingsUpdate({ op: "child", name: name.value.trim(), packId: select.value });
      await saveAndAdvance(state);
    } catch (e) {
      err.textContent = errMsg(e);
    }
  });
  app.replaceChildren(
    stepCard(
      2,
      "Who is this for?",
      h("p", {
        class: "muted",
        text: "Pick the class and board. Nothing is uploaded — the curriculum is already built in.",
      }),
      h("label", { for: "child", text: "Child's name" }),
      name,
      h("label", { for: "pack", text: "Curriculum" }),
      select,
      err,
      next,
    ),
  );
}

function renderHoursStep(state: OnboardingState): void {
  const editor = scheduleEditor(snap.studyHours);
  const err = h("p", { class: "error" });
  const next = h("button", { text: "Continue" });
  next.addEventListener("click", async () => {
    err.textContent = "";
    try {
      await sendSettingsUpdate({ op: "studyHours", schedule: editor.collect() });
      await saveAndAdvance(state);
    } catch (e) {
      err.textContent = errMsg(e);
    }
  });
  app.replaceChildren(
    stepCard(
      3,
      "When are study hours?",
      h("p", {
        class: "muted",
        text: "Protection is on only during these times. We've pre-filled Mon–Fri 09:00–15:00 — adjust as you like.",
      }),
      editor.el,
      err,
      next,
    ),
  );
}

function renderRulesStep(state: OnboardingState): void {
  const finish = h("button", { text: "Finish setup" });
  finish.addEventListener("click", () => void saveAndAdvance(state));
  app.replaceChildren(
    stepCard(
      4,
      "Show your child their rules",
      h("p", {
        text: "GuideRail believes a child should always be able to see the rules that apply to them. Please open this screen and walk through it together.",
      }),
      h(
        "p",
        {},
        h("a", {
          href: RULES_URL,
          target: "_blank",
          rel: "noopener",
          text: "Open the rules screen ↗",
        }),
      ),
      finish,
    ),
  );
}

// --- PIN gate + settings ----------------------------------------------------
function renderPinGate(): void {
  const pin = h("input", {
    type: "password",
    inputmode: "numeric",
    id: "pin",
    autocomplete: "current-password",
  }) as HTMLInputElement;
  const err = h("p", { class: "error" });
  const unlock = h("button", { text: "Unlock settings" });
  unlock.addEventListener("click", async () => {
    err.textContent = "";
    try {
      const res = await sendPinVerify(pin.value);
      if (res.ok) {
        await refresh();
        renderSettings();
      } else if (res.lockedUntil !== undefined) {
        const at = new Date(res.lockedUntil).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        err.textContent = `Too many attempts. Try again at ${at}.`;
      } else {
        err.textContent = "Wrong PIN.";
      }
    } catch (e) {
      err.textContent = errMsg(e);
    }
  });
  app.replaceChildren(
    h(
      "div",
      { class: "card" },
      h("p", { class: "eyebrow", text: "GuideRail" }),
      h("h1", { text: "Parent settings" }),
      h("label", { for: "pin", text: "Enter your PIN" }),
      pin,
      err,
      unlock,
    ),
  );
}

function settingsCard(title: string, ...kids: Array<Node | string>): HTMLElement {
  return h("div", { class: "card" }, h("h2", { text: title }), ...kids);
}

async function mutate(update: Parameters<typeof sendSettingsUpdate>[0]): Promise<void> {
  await sendSettingsUpdate(update);
  await refresh();
  renderSettings();
}

function renderSettings(): void {
  // Curriculum
  const packSel = h("select", { "aria-label": "Curriculum" }) as HTMLSelectElement;
  for (const p of snap.availablePacks) {
    const opt = h("option", { value: p.id, text: `${p.board} — Class ${p.grade_band}` });
    if (snap.activePack?.id === p.id) opt.setAttribute("selected", "selected");
    packSel.append(opt);
  }
  const savePack = h("button", { class: "ghost", text: "Save curriculum" });
  savePack.addEventListener(
    "click",
    () => void mutate({ op: "child", name: snap.childName ?? "", packId: packSel.value }),
  );

  // Study hours
  const editor = scheduleEditor(snap.studyHours);
  const saveHours = h("button", { class: "ghost", text: "Save hours" });
  saveHours.addEventListener(
    "click",
    () => void mutate({ op: "studyHours", schedule: editor.collect() }),
  );

  // Earned window
  const windowRow = h("div", { class: "row" });
  for (const m of [15, 30, 45]) {
    const b = h("button", {
      class: snap.earnedWindowMinutes === m ? "" : "ghost",
      text: `${m} min`,
    });
    b.addEventListener("click", () => void mutate({ op: "earnedWindow", minutes: m }));
    windowRow.append(b);
  }

  // Gate-list
  const gateWrap = h("div");
  for (const d of [...snap.gateList].sort()) {
    const remove = h("button", { class: "danger", text: "Remove", "aria-label": `Remove ${d}` });
    remove.addEventListener("click", () => void mutate({ op: "gateRemove", domain: d }));
    gateWrap.append(h("div", { class: "list-item" }, h("span", { text: d }), remove));
  }
  const addInput = h("input", {
    type: "text",
    placeholder: "example.com",
    "aria-label": "Domain to gate",
  }) as HTMLInputElement;
  const addBtn = h("button", { class: "ghost", text: "Add site" });
  addBtn.addEventListener("click", () => {
    const d = addInput.value.trim();
    if (d !== "") void mutate({ op: "gateAdd", domain: d });
  });

  // Pause
  const pauseBtn = h("button", {
    class: snap.pausedToday ? "" : "ghost",
    text: snap.pausedToday ? "Protection is paused today" : "Pause protection for today",
  });
  if (!snap.pausedToday)
    pauseBtn.addEventListener("click", () => void mutate({ op: "pauseToday" }));
  else pauseBtn.setAttribute("disabled", "disabled");

  app.replaceChildren(
    h(
      "div",
      { class: "card" },
      h("p", { class: "eyebrow", text: "GuideRail" }),
      h("h1", { text: `Settings — ${snap.childName ?? "your child"}` }),
    ),
    settingsCard("📚 Curriculum", packSel, h("div", {}, savePack)),
    settingsCard("⏰ Study hours", editor.el, h("div", {}, saveHours)),
    settingsCard(
      "⏱️ Earned-time window",
      h("p", { class: "muted", text: "How long a passed quiz unlocks." }),
      windowRow,
    ),
    settingsCard(
      "🎯 Sites that need earning",
      gateWrap,
      h("div", { class: "row" }, addInput, addBtn),
    ),
    settingsCard(
      "⏸️ Pause",
      h("p", { class: "muted", text: "Turns protection off for the rest of today (logged)." }),
      pauseBtn,
    ),
    settingsCard(
      "🧒 Child's rules screen",
      h(
        "p",
        {},
        h("a", {
          href: RULES_URL,
          target: "_blank",
          rel: "noopener",
          text: "Open the rules screen ↗",
        }),
      ),
    ),
    settingsCard(
      "🗑️ Removing GuideRail",
      h("p", {
        class: "muted",
        text: "Remove it from your browser's Extensions page (Manage Extensions → GuideRail → Remove). There is no PIN reset — removing and re-adding starts a fresh setup.",
      }),
    ),
  );
}

// --- router -----------------------------------------------------------------
function route(): void {
  const ob = snap.onboarding;
  if (ob === null || !isComplete(ob)) {
    const state = ob ?? initialOnboarding();
    switch (state.step) {
      case "pin":
        return renderPinStep(state);
      case "child":
        return renderChildStep(state);
      case "hours":
        return renderHoursStep(state);
      case "rules":
        return renderRulesStep(state);
      default:
        break;
    }
  }
  renderPinGate();
}

async function main(): Promise<void> {
  try {
    await refresh();
    route();
  } catch (e) {
    app.replaceChildren(
      h(
        "div",
        { class: "card" },
        h("h1", { text: "Couldn't load settings" }),
        h("p", { class: "muted", text: errMsg(e) }),
      ),
    );
  }
}

void main();
