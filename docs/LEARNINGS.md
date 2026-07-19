# GuideRail — Learnings

Concepts learned while building, for future study and behind-the-scenes understanding. Maintained by the `knowledge-capture` skill. One concept per entry; honesty over volume.

**Depth scale:** `used-it` (copied a working pattern) → `understand-it` (can explain why) → `could-teach-it` (can derive it and its failure modes).

---

### L-001 · MV3 service workers are ephemeral
**Date:** 2026-07-16 · **Area:** MV3 · **Depth:** understand-it
**What I learned:** Chrome kills the extension service worker after ~30s idle and can kill it mid-task; module-scope state and setTimeout silently vanish. State must live in chrome.storage; timers must be chrome.alarms; event listeners must register synchronously at top level.
**Why it works (behind the scenes):** MV3 treats extensions like web push infrastructure — workers are woken by events, not resident. This is a memory-and-battery decision by Chrome: thousands of installed extensions can't each hold a live process.
**Where it bit us / how discovered:** Design review of the quiz-gate token expiry — the obvious setTimeout revocation would never fire in production.
**Go deeper:** "chrome extension service worker lifecycle", the offscreen documents API (escape hatch for genuinely persistent work).
**Related:** IQ-001, IQ-007

### L-002 · Detect-then-hide always loses the race; default-hidden wins
**Date:** 2026-07-16 · **Area:** Perf/Security · **Depth:** could-teach-it
**What I learned:** Any "observe the DOM, then blur the image" design has a paint window where the content already flashed. Inverting to declarative CSS at document_start (blur everything, then selectively unblur after validation) closes the window structurally, not probabilistically.
**Why it works (behind the scenes):** Manifest-declared CSS at document_start is applied by the style engine before first layout/paint; MutationObserver callbacks run as microtasks after the node exists — after the renderer may have painted it.
**Where it bit us / how discovered:** PRD review — Requirement 2.2 as originally written (MutationObserver injection) was internally inconsistent with its own "before the DOM renderer" goal.
**Go deeper:** Chromium rendering pipeline (style → layout → paint → composite), "flash of unstyled content" literature.
**Related:** IQ-003

### L-003 · declarativeNetRequest budgets shape architecture, not just implementation
**Date:** 2026-07-16 · **Area:** MV3 · **Depth:** understand-it
**What I learned:** ~30k dynamic / ~330k static rule ceilings make cloud-pushed blocklists architecturally impossible on MV3. This isn't a limitation to work around — it's why local semantic classification (WASM) + minimal structural DNR rules is the correct division of labor.
**Why it works (behind the scenes):** DNR rules compile into the browser's network-stack matcher; budgets keep that matcher O(small) for every request the browser makes. Google is trading extension power for guaranteed browser performance.
**Where it bit us / how discovered:** Validating the PRD's "no multi-megabyte cloud lookup blocks" claim — turned a preference into a necessity.
**Go deeper:** DNR API docs (rule priorities, session vs dynamic vs static), how uBlock Origin Lite restructured around this.
**Related:** IQ-004

### L-004 · Aho-Corasick: why multi-pattern matching is one pass, not N passes
**Date:** 2026-07-16 · **Area:** Rust/Algorithms · **Depth:** used-it
**What I learned:** Matching text against thousands of curriculum keywords is O(text + matches) with Aho-Corasick — a single automaton walk — versus O(keywords × text) for naive per-keyword search. The Rust `aho-corasick` crate is the standard tool; regex is the wrong tool for keyword sets.
**Why it works (behind the scenes):** Builds a trie of all patterns with failure links (KMP generalized to many patterns); each input byte advances the automaton exactly once regardless of pattern count.
**Where it bit us / how discovered:** Choosing the matcher for the <5ms classification budget.
**Go deeper:** Derive the failure-link construction by hand once; compare with regex-set implementations (regex crate's RegexSet uses similar ideas).
**Related:** IQ-001, wasm-build skill

### L-005 · Compliance by architecture beats compliance by policy
**Date:** 2026-07-16 · **Area:** Privacy/Product · **Depth:** could-teach-it
**What I learned:** "We never receive children's data" (local classification, client-side PII scrubbing at a single choke point) is a categorically stronger position than "we handle it correctly" — and one design simultaneously satisfies COPPA, GDPR, and India's DPDP. It also collapses infra cost for free users, enabling the freemium model.
**Why it works (behind the scenes):** Regulations scope obligations by what data you *process*; architectural data-minimization moves you out of scope rather than into compliance. Enforcement must be structural (one sanitize() choke point, review-agent greps every network path) because optional scrubbing eventually gets skipped.
**Where it bit us / how discovered:** Noticing the PRD scrubbed telemetry (Req 2.3) but not the teaching-assistant payload (Req 1.3) — the gap was exactly where data was richest.
**Go deeper:** "data minimization by design" (GDPR Art. 25), DPDP Act children's provisions.
**Related:** IQ-006, IQ-004

### L-006 · Hooks are guarantees; CLAUDE.md and skills are requests
**Date:** 2026-07-16 · **Area:** Dev workflow · **Depth:** understand-it
**What I learned:** In Claude Code, instructions in CLAUDE.md/skills are probabilistic — the model can miss or deprioritize them, and over-long CLAUDE.md files get ignored more. Anything that MUST happen (format on write, tests after edit, blocking baseline overwrites) belongs in a deterministic hook on a lifecycle event.
**Why it works (behind the scenes):** Hooks execute as shell commands in the harness, outside the model's discretion; context-window attention is a finite resource that dilutes as instruction volume grows.
**Where it bit us / how discovered:** Redesigning my old PRD→prompt-paste workflow into the starter kit; explains why long "MUST ALWAYS" prompt files kept failing me.
**Go deeper:** Claude Code hooks reference (PreToolUse/PostToolUse/Stop), the settings.json permission model.
**Related:** .claude/settings.json in this repo

### L-007 · regex-lite, not regex, for WASM
**Date:** 2026-07-18 · **Area:** Rust/WASM · **Depth:** used-it
**What I learned:** The full `regex` crate compiled into WASM cost ~250 KB gzipped — the module measured 337 KB, over the 200 KB budget. Swapping to `regex-lite` dropped it to 86.5 KB gzipped (214 KB raw after `wasm-opt -Os`) with zero test changes, because our patterns only use `(?i)`, `\b`, `\d`, `\s`, classes, and alternation.
**Why it works (behind the scenes):** `regex`'s size is dominated by Unicode property tables and its multiple DFA/NFA engines; `regex-lite` ships a single small backtracking engine and no Unicode-by-default tables — the exact features (lookaround, Unicode classes) we don't use.
**Where it bit us / how discovered:** The spec-001 size gate (`gzip -c | wc -c`) failed at 337 KB on the first real `wasm-pack` build; twiggy would have fingered regex, regex-lite fixed it outright.
**Go deeper:** regex-lite crate docs (feature/■size trade-off table); `twiggy top` on the `_bg.wasm`.
**Related:** L-004, ADR-0003, IQ-009

### L-008 · Chrome 2026 blocks CLI-loaded extensions
**Date:** 2026-07-18 · **Area:** MV3 · **Depth:** understand-it
**What I learned:** Puppeteer could not load the unpacked bench fixture as an MV3 extension: current stable Chrome disables the `--load-extension` command-line switch (behind `DisableLoadExtensionCommandLineSwitch`), AND puppeteer injects `--disable-extensions` into its own default args. Even removing both via `ignoreDefaultArgs` + `--disable-features`, no service-worker target appeared. Worked around by measuring in a plain module ServiceWorker served over localhost — the WASM path is engine-identical since the fixture uses zero `chrome.*` APIs.
**Why it works (behind the scenes):** Google progressively locked down CLI extension loading (malware vector); the module-ServiceWorker substrate exercises the same V8 WASM engine, worker scheduling, and fetch→instantiate cold start, differing only in the chrome.runtime messaging layer that sits outside the perf-critical path.
**Where it bit us / how discovered:** The harness timed out 30 s waiting for a `service_worker` target; a probe listing `browser.targets()` showed only `browser` + `about:blank`.
**Go deeper:** Chromium `DisableLoadExtensionCommandLineSwitch` feature; puppeteer default-args source; Chrome WASM code-cache behaviour across SW restarts.
**Related:** L-006, ADR-0003, IQ-009

### L-009 · Cache WASM bytes to survive the SW idle-kill
**Date:** 2026-07-18 · **Area:** MV3 | Rust/WASM · **Depth:** used-it
**What I learned:** The MV3 service worker dies at ~30s idle and its module scope evaporates, so the WASM *instance* can't be a durable singleton. What survives is the compiled *bytes*: cache them in chrome.storage.local on `onInstalled`, then on each cold wake `init({ module_or_path: bytes })` straight from the cache — no fetch on the hot path. A module-scope promise memoizes the instance for the worker's life (warm), and drops to null on the next kill.
**Why it works (behind the scenes):** wasm-pack `--target web`'s init accepts a `BufferSource`, calling `WebAssembly.instantiate` directly; chrome.storage is the only state that outlives the worker, so durable = storage, ephemeral = module scope (L-006). Measured cold instantiate ~4–15ms from cached bytes.
**Where it bit us / how discovered:** Building core.ts (spec 002 R5); the state-survival test proves a re-instantiation after a simulated kill re-reads storage with zero new fetches.
**Go deeper:** wasm-bindgen 0.2.126 init signature (object form; positional InitInput is deprecated); chrome.storage quota vs base64 of a 214KB module.
**Related:** L-006, ADR-0003, IQ-013

### L-010 · web-ext lint is a Firefox linter
**Date:** 2026-07-18 · **Area:** MV3 · **Depth:** understand-it
**What I learned:** `web-ext lint` validates against Firefox/Mozilla's addons-linter — it flags a Chrome MV3 manifest's `background.service_worker` as unsupported and demands a `browser_specific_settings.gecko.id`. There is no Chromium lint mode; `--target chromium` only applies to `web-ext run`, not `lint`. So a valid Chrome-only MV3 manifest can never be "web-ext lint clean" without adding Firefox-only keys.
**Why it works (behind the scenes):** Firefox MV3 uses event pages (`background.scripts`), not service workers, and requires an explicit add-on id; the linter encodes Firefox's schema. Chrome validates the manifest at load time instead, so there's no equivalent Chrome CLI linter.
**Where it bit us / how discovered:** Spec 002 acceptance said "web-ext lint clean"; it returned 2 Firefox-only errors on an otherwise-correct Chrome manifest — logged as a spec defect.
**Go deeper:** addons-linter rule set; Chrome's own `chrome://extensions` load-time validation as the real check.
**Related:** L-008, spec 002 Deviations

---

### L-011 · Pass parsed data across the JS↔WASM boundary as JsValue, not JSON string
**Date:** 2026-07-19 · **Area:** Rust/WASM · **Depth:** could-teach-it
**What I learned:** To build the classifier from a pack's keywords I first planned `from_pack_json(&str)` — but parsing a JSON *string* in Rust needs `serde_json`, which would add size to a .wasm already budgeted at <200KB gzipped. Passing the already-parsed JS array as a `JsValue` and deserializing with `serde_wasm_bindgen::from_value` into `Vec<KeywordEntry>` needs no new crate: the .wasm stayed at 116KB gzipped.
**Why it works (behind the scenes):** wasm-bindgen already links the machinery to reflect over JS values; `serde_wasm_bindgen` walks the live JS object graph field-by-field into Rust structs, so the JSON is parsed once by the JS engine (which you're paying for anyway) rather than a second time by a Rust JSON parser bundled into the binary.
**Where it bit us / how discovered:** Caught at design time via the wasm-build skill's size gate; the TS side already validates the pack, so WASM only needs the keyword list, not to re-parse the whole document.
**Go deeper:** serde-wasm-bindgen vs serde_json size cost; wasm-bindgen `Deserialize` from `JsValue`.
**Related:** L-009, ADR-0003, ADR-0004

### L-012 · Substring keyword matching turns common words into false positives
**Date:** 2026-07-19 · **Area:** Perf · **Depth:** could-teach-it
**What I learned:** Aho-Corasick (ADR-0003) matches **substrings**, case-insensitively, with no word boundaries. In an allow-model where any curriculum hit means "school, allow it", a bare short keyword silently allowlists huge swaths of ordinary text: `exam`⊂`example`, `base`⊂`database`, `cell`⊂`cellphone`, `rock`⊂`rock music`, `wind`⊂`window`, `tense`⊂`intense`, even `noun`⊂`announce`. The fix for a beta is curation, not a matcher rewrite: prefer distinctive terms and multi-word phrases (`examination`, `acids and bases`, `plant cell`).
**Why it works (behind the scenes):** The automaton is a single trie walk that reports every pattern occurrence at any offset — it has no concept of a token, so "match at a word boundary" is not a thing it does; you either post-filter matches or choose patterns that can't appear mid-word.
**Where it bit us / how discovered:** A spec-reviewer pass flagged it; my own "unknown" test fixture `"…by the window"` had already tripped `wind`. Added false-positive guard tests (`example`, `baseball`, `cellphone`, `intense` must stay `unknown`) so re-curation can't regress.
**Go deeper:** word-boundary post-filtering on aho-corasick match spans; `\b` semantics vs raw substring search.
**Related:** L-004, ADR-0003, ADR-0004, IQ-014

---
*Next: L-013 (assigned by knowledge-capture skill)*
