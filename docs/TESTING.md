# GuideRail — Testing & Manual Verification

How to build, load, and exercise the extension by hand, plus the automated
command reference. Current as of spec 002 (extension scaffold).

---

## 1. Automated checks (no browser needed)

Run from the repo root unless noted.

| What | Command |
|---|---|
| Extension unit tests (vitest, 18 tests) | `pnpm --filter @guiderail/extension test` |
| Type-check the extension | `pnpm --filter @guiderail/extension type-check` |
| Lint the extension | `pnpm --filter @guiderail/extension lint` |
| Build the extension → `dist/` | `pnpm --filter @guiderail/extension build` |
| Rust core tests | `cargo test --manifest-path packages/core-wasm/Cargo.toml` |
| Rebuild the WASM | `wasm-pack build packages/core-wasm --target web --release` |
| WASM benchmark (real Chrome) | `pnpm bench:wasm` |
| Everything (turbo) | `pnpm build` · `pnpm test` |

> On this Windows machine, if `cargo`/`wasm-pack` hit an SSL "revocation" error,
> prefix with `CARGO_HTTP_CHECK_REVOKE=false`. `wasm-pack` lives in
> `~/.cargo/bin` — add it to `PATH` if "command not found".

---

## 2. Load the extension in Chrome

1. Build it: `pnpm --filter @guiderail/extension build` → produces
   `packages/extension/dist/`.
2. Open `chrome://extensions`.
3. Toggle **Developer mode** (top-right).
4. **Load unpacked** → select the **`dist`** folder
   (`…/packages/extension/dist`).
5. The **GuideRail** card appears. Its **ID** and a **"service worker"** link
   are on the card.

**After every rebuild:** click **Reload (↻)** on the card to pick up the new
`dist/`.

> `pnpm ext:dev` (auto hot-reload via web-ext) may fail to launch on current
> Chrome because it relies on the disabled `--load-extension` CLI switch
> (see docs/LEARNINGS.md L-008). Manual **Load unpacked** + **Reload** is the
> reliable path here.

---

## 3. Exercise the classifier — service-worker console (recommended)

This is the most reliable way; it needs no page.

1. On the GuideRail card in `chrome://extensions`, click **"service worker"** →
   opens the service-worker DevTools console.
2. Run:

```js
// on-topic study text → allow
await gr.classify("today's algebra and photosynthesis homework", "core-study-v1")
// → { verdict: "allow", matches: ["math", "science"] }

// known distraction → quiz gate
await gr.classify("watch this fortnite livestream", "core-study-v1")
// → { verdict: "quiz_gate", matches: ["gaming", "video"] }

// nothing matched → unknown
await gr.classify("just an ordinary sentence", "core-study-v1")
// → { verdict: "unknown", matches: [] }

// PII scrubber (the single network-egress choke point)
await gr.sanitize("email kid@example.com or call +91 98765 43210, ask Priya")
// → "email [EMAIL] or call [PHONE], ask [NAME]"
```

You'll also see timing marks print in the console:

```
[gr-bench] core-init cold=…ms bytes=213999     ← first call (WASM instantiate)
[gr-bench] classify warm=0.1…ms verdict=allow  ← every classify
```

### What is `gr`?
`gr` is a **debug hook** GuideRail attaches to the service-worker global
(`globalThis.gr`, defined at the bottom of `packages/extension/src/service_worker.ts`).
It exposes `classify(text, packId)` and `sanitize(text)` from the WASM core so
you can test without wiring up messages. It exists **only in the service-worker
console** and is a dev convenience — not a Chrome API, safe to remove.

### The spike test pack (`core-study-v1`)
Spec 001 ships one hardcoded pack. Words that trigger each verdict:

- **allow** (curriculum): `algebra, fraction, equation, geometry` (math) ·
  `photosynthesis, mitochondria, ecosystem, velocity` (science) ·
  `grammar, paragraph, vocabulary` (language) · `revolution, civilization` (history)
- **quiz_gate** (distraction): `fortnite, roblox` (gaming) · `tiktok, meme`
  (social) · `livestream` (video)
- anything else → **unknown**. Any curriculum match wins over a distraction match.
- An unknown `packId` throws (only `"core-study-v1"` exists in the spike).

---

## 4. Verify the ephemeral-worker survival (spec 002 R5)

Proves durable state lives in `chrome.storage`, not module scope.

1. On the card, click **"service worker"**, then **Stop** it (or use
   `chrome://serviceworker-internals` → Stop).
2. Run `await gr.classify("algebra", "core-study-v1")` again. The worker wakes,
   re-instantiates the WASM **from the storage-cached bytes** (you'll see a fresh
   `core-init` mark), and still answers — state survived the kill.

The same property is covered automatically by
`packages/extension/src/service_worker.test.ts` ("state survives a simulated
worker kill").

---

## 5. Message round-trip (optional / advanced)

The service worker also answers typed `chrome.runtime.sendMessage` calls from an
**extension page**. Note: directly opening
`chrome-extension://<id>/quiz_gate.html` in the address bar is **blocked by
Chrome** (it bounces to `chrome://extensions`) — web-accessible resources are
meant to be opened by the extension, not navigated to. So prefer the
service-worker console in §3. If you do have a valid extension page open, its
console can run:

```js
chrome.runtime.sendMessage(
  { kind: "classify", text: "algebra", packId: "core-study-v1" },
  console.log
);
// valid   → { kind: "classify.result", verdict: "allow", matches: ["math"] }
// ad-hoc  → { kind: "error", message: "unrecognized or malformed message" }
```

`chrome.runtime.sendMessage is not a function` means you're on a normal web page
or a `chrome://` page — those contexts don't have the extension messaging API.

---

## Known caveats
- **`pnpm ext:dev` / web-ext**: blocked by Chrome's `--load-extension`
  restriction (L-008). Use Load unpacked + Reload.
- **`web-ext lint`**: reports 2 Firefox-only errors on a valid Chrome MV3
  manifest — `web-ext` is a Firefox linter with no Chromium mode (L-010). Not a
  real defect.
- **No UI / auto-classification yet**: content script and popup are later specs
  (004 / 007), so visiting normal web pages does nothing automatically. You're
  testing the service-worker classification pipeline.
