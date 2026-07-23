// Child rules screen (spec 007 R4). Read-only, not PIN-gated. Plain language,
// ~10-year reading level. Reads the settings snapshot from the worker; never writes.

import { sendSettingsGet } from "./messages.js";
import type { StudySchedule } from "./pipeline/study-hours.js";
import { h, errMsg } from "./pages/dom.js";

const app = document.getElementById("app")!;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function describeHours(schedule: StudySchedule): string {
  const parts: string[] = [];
  for (let d = 0; d < 7; d++) {
    const windows = schedule[d as 0];
    if (windows && windows.length > 0) {
      parts.push(`${WEEKDAYS[d]}: ${windows.map((w) => `${w.start} to ${w.end}`).join(", ")}`);
    }
  }
  return parts.length > 0 ? parts.join(" · ") : "No study hours are set yet.";
}

function card(title: string, ...kids: Array<Node | string>): HTMLElement {
  return h("div", { class: "card" }, h("h2", { text: title }), ...kids);
}

async function render(): Promise<void> {
  const s = await sendSettingsGet();
  app.replaceChildren(
    h(
      "div",
      { class: "card" },
      h("p", { class: "eyebrow", text: "GuideRail" }),
      h("h1", { text: "Here are your rules" }),
      h("p", { class: "muted", text: "This is the honest deal — nothing here is a secret." }),
    ),
    card(
      "⏰ When the rules are on",
      h("p", {
        text: s.pausedToday
          ? "The rules are paused for today, so everything is open right now."
          : describeHours(s.studyHours),
      }),
    ),
    card(
      "✅ What always works",
      h("p", {
        text: s.activePack
          ? `Your schoolwork for ${s.activePack.board} Class ${s.activePack.grade_band} — and study websites — always open, even during study hours.`
          : "Your schoolwork always opens.",
      }),
    ),
    card(
      "🎯 What you can earn",
      h("p", {
        text: "These kinds of sites take a break during study hours. Answer 3 quick questions about what you just read, and you earn free time to use them:",
      }),
      earnableList(s.gateList),
      s.earnedRemainingMinutes > 0
        ? h(
            "p",
            {},
            h("span", {
              class: "pill",
              text: `${s.earnedRemainingMinutes} minutes earned right now`,
            }),
          )
        : h("p", { class: "muted", text: "You have no earned time right now." }),
    ),
    card(
      "🔒 Your privacy",
      h("p", {
        text: "GuideRail checks pages right here on this computer. It never reads your messages, never sees where you are, and nothing about you ever leaves this computer.",
      }),
      h("p", { text: "The only things saved on this computer are:" }),
      h(
        "ul",
        {},
        h("li", { text: "your study hours" }),
        h("li", {
          text: `your class${s.activePack ? ` (${s.activePack.board} Class ${s.activePack.grade_band})` : ""}`,
        }),
        h("li", { text: "which quizzes you passed, and the topics — used to pick your questions" }),
      ),
    ),
  );
}

/** A short list of example earnable (gate-listed) sites, kept friendly. */
function earnableList(gateList: string[]): HTMLElement {
  const examples = [...gateList].sort().slice(0, 8);
  const ul = h("ul");
  for (const d of examples) ul.append(h("li", { text: d }));
  if (gateList.length > examples.length) {
    ul.append(h("li", { class: "muted", text: `…and ${gateList.length - examples.length} more` }));
  }
  return ul;
}

void render().catch((e) => {
  app.replaceChildren(
    h(
      "div",
      { class: "card" },
      h("h1", { text: "Couldn't load your rules" }),
      h("p", { class: "muted", text: errMsg(e) }),
    ),
  );
});
