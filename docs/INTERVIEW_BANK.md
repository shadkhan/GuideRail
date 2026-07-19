# GuideRail — Interview Bank

Interview-ready Q&A harvested from real decisions in this project. Maintained by the `knowledge-capture` skill — entries are appended as development produces them. Read aloud before interviews; every answer is written in spoken voice.

**How to use:** pick 5 entries the night before, say the 60-second answers out loud twice, and have the Evidence file open in a tab during the interview.

---

### IQ-001 · Walk me through how you'd run content classification in an MV3 extension without janking the page.

| Area | Source |
| --- | --- |
| MV3/Perf | PRD Req 2.1, ADR-0003 (planned) |

- **60-second answer:** The main constraint is that everything user-visible shares one thread, and my budget is one frame — 16.6 milliseconds. So classification never runs on the main thread at all. The content script only extracts and forwards; matching happens in a Rust module compiled to WebAssembly inside the service worker. Rust gives me Aho-Corasick multi-pattern matching, so checking a page against thousands of curriculum keywords is a single pass over the text — my warm-path budget is under 5 milliseconds at p95. The subtlety in MV3 is that the service worker is ephemeral — Chrome kills it after about 30 seconds idle — so I cache the compiled WASM bytes and lazy-instantiate, and I benchmark the cold-start path separately from the warm path because they're different numbers and pretending otherwise is how extensions ship jank.
- **The follow-up they'll ask:** "What's your cold-start number?" — Have the bench/results history open. If not yet measured, the honest answer: "Budgeted 50ms, measured on a $200 Chromebook, and I'll show you the harness."
- **Evidence I can show:** packages/core-wasm, bench/results/history.csv, ADR-0003.

### IQ-002 · Your extension fails open on unclassified sites. Defend that.

| Area | Source |
| --- | --- |
| Security/Product | ADR-0001 fail-open vs fail-closed |

- **60-second answer:** I wouldn't defend it universally — I made it a configuration axis, not a philosophy. For the consumer profile, a homeschool parent supervising in the same room, fail-open with async background classification is right: zero perceived latency, and the parent is the compensating control. For the institutional profile it flips to fail-closed with an interstitial, because at district scale there's no compensating adult per screen and the liability calculus inverts. The trade-off is real — fail-open means one unclassified bad page renders once — so I wrote it as an ADR with the negative consequences stated instead of hidden. The design principle I'd generalize: when a safety trade-off depends on deployment context, it belongs in config with both sides documented, never hardcoded into the product's worldview.
- **The follow-up they'll ask:** "How does the interstitial avoid destroying UX in the fail-closed profile?" — Pre-cache classifications for the district's top domains and make the interstitial resolve in under a second for the long tail; the p95 wait, not the policy, is what users actually feel.
- **Evidence I can show:** docs/adr/0001, the profile config schema.

### IQ-003 · How do you stop explicit thumbnails flashing before your filter reacts?

| Area | Source |
| --- | --- |
| MV3/Perf | PRD Req 2.2, blur-blanket redesign |

- **60-second answer:** The naive approach — MutationObserver spots the img and injects a blur — loses the race by design: the observer callback runs after the element exists, so on a fast connection the pixels can paint first. I inverted it: a stylesheet declared in the manifest at document_start blurs all img and video by default, before the renderer paints anything, and my script's job is to REMOVE the blur per element after local validation passes. Fail-closed on visuals, fail-open on the unblur path. It's also cheaper — declarative CSS costs nothing on the main thread, and the validation work batches through the same WASM pipeline. The general lesson: when the requirement is "X must never appear," the default state must be X-hidden, because any detect-then-hide design has a window where you've already lost.
- **The follow-up they'll ask:** "Doesn't blurring everything harm legitimate pages?" — Trusted-domain fast path unblurs in the same frame via a precomputed allowlist check; the visible blur only survives on unknown origins.
- **Evidence I can show:** manifest content_scripts block, the unblur validation path.

### IQ-004 · Why local-first policy evaluation instead of cloud lookups like most filtering vendors?

| Area | Source |
| --- | --- |
| Architecture | PRD Req 1.1, DNR rule-budget analysis |

- **60-second answer:** Three constraints pushed the same direction. First, declarativeNetRequest gives me roughly 30 thousand dynamic rules — you cannot express a modern blocklist in that budget, so cloud-scale rule-pushing is architecturally dead on MV3 anyway. Second, my latency budget is single-digit milliseconds, and a network round trip can't promise that on school Wi-Fi. Third — privacy: local evaluation means the child's browsing never leaves the device, which turns COPPA compliance from a policy promise into an architectural property. So DNR handles only the cheap structural stuff — redirects and session rules — while semantic classification runs in local WASM against curriculum-tagged packs. The bonus I didn't design for: free-tier users cost me nearly nothing in cloud spend, which is what makes the freemium model work.
- **The follow-up they'll ask:** "How do curriculum packs update?" — Signed pack files pulled on a chrome.alarms schedule, verified client-side, swapped atomically in storage — pull-based, so no server ever needs to know who's asking.
- **Evidence I can show:** the pack schema, DNR registry with rule counts.

### IQ-005 · You cite a CERT disclosure against Securly's own extension. What did you learn from threat-modeling it?

| Area | Source |
| --- | --- |
| Security | VU#595768 threat-model ADR |

- **60-second answer:** The disclosure matters less for the specific bug than for the class of bug: filtering extensions concentrate an unusual amount of trust — broad host permissions, native messaging, managed deployment — so their attack surface is the trust boundary between the extension and everything that can talk to it. My threat model worked STRIDE across each boundary: content script to service worker, extension to backend, policy channel to browser. The design consequences in my build: a single typed message schema so the worker never trusts ad-hoc payloads, no remote code paths at all, and telemetry that's PII-scrubbed client-side so even a compromised backend receives nothing sensitive. The honest part I'd emphasize: I document residual bypass surface — guest profiles, alternate browsers — because in this domain overclaiming "un-bypassable" is itself a security failure; it misleads the adults doing the risk assessment.
- **The follow-up they'll ask:** "Which boundary worries you most?" — The managed-policy channel: whoever controls ExtensionInstallForcelist controls the fleet, so the deployment docs treat admin-console compromise as in-scope, not somebody-else's-problem.
- **Evidence I can show:** docs/adr/0002-threat-model.md.

### IQ-006 · How does your PII scrubbing actually work, and why client-side?

| Area | Source |
| --- | --- |
| Privacy/Rust | PRD Req 2.3 |

- **60-second answer:** Client-side because it changes the compliance question from "do you handle children's data correctly" to "you never receive it" — a much stronger position under COPPA, GDPR, and India's DPDP simultaneously, one design satisfying all three. Mechanically, any payload leaving the browser passes through one choke point: a sanitize function in the Rust-WASM module — pre-compiled regex pipelines for emails, phone formats, coordinates, plus a name heuristic — ordered longest-match-first, returning a tokenized string. The enforcement matters more than the algorithm: it's a repo-level rule that no network call bypasses sanitize(), checked in code review by an agent that greps every network path. Scrubbing that's optional per call-site is scrubbing that will eventually be skipped.
- **The follow-up they'll ask:** "Regex-based name detection is weak — false negatives?" — Agreed, names are the weak class; that's why telemetry is also data-minimized upstream — we send category metadata, not page text, so the scrubber is defense-in-depth, not the only wall.
- **Evidence I can show:** core-wasm sanitize module + its test corpus.

### IQ-007 · Your quiz gate stores an unlock token in chrome.storage. Why can't a student just forge it?

| Area | Source |
| --- | --- |
| Security/MV3 | quiz-gate design |

- **60-second answer:** On an unmanaged family device, honestly, a sufficiently determined teenager can — extension storage is inspectable if you can open extension DevTools. The design accepts that and layers: on managed deployments, DeveloperToolsAvailability and extension-access policies close the inspection path, so the token's integrity rides on the management layer, and I say that explicitly instead of pretending storage is a vault. The token itself is minimal — expiry timestamp plus scope — enforced by a chrome.alarms revocation, because setTimeout dies with the ephemeral worker. And the product design does the heaviest lifting: the earn-time deal is genuinely better than sneaking, so the rational move for the kid is to take the quiz. Security that aligns incentives beats security that only raises walls.
- **The follow-up they'll ask:** "Why not sign the token?" — HMAC with a key held... where? Same client. Signing adds ceremony, not security, when attacker and key share a device — the honest control is the management policy layer.
- **Evidence I can show:** token schema, the alarms revocation code, managed-policy docs.

### IQ-008 · How would this architecture change at 30 million students?

| Area | Source |
| --- | --- |
| Scale | Module B design intent |

- **60-second answer:** The elegant part is what doesn't change: classification is client-local, so the per-user serving cost is flat — 30 million devices each doing their own sub-5ms matching. What changes is everything around the edges. Pack distribution becomes a CDN problem with signed artifacts and staged rollout, because pushing a bad pack to 30 million endpoints is the new worst-case. Telemetry becomes an ingestion problem — batched, sampled, ClickHouse-backed, since nobody queries 30 million raw event streams. And the unclassified-domain backlog becomes the real backend: a classification service with human-review queues, because at that scale the long tail of new domains is millions per day. I'd also flip the default profile to fail-closed — the compensating-adult assumption from the consumer profile doesn't survive contact with district scale.
- **The follow-up they'll ask:** "Where's your first bottleneck in practice?" — The LLM-backed features, around 10k families — which is why they're caps-and-cache from day one and gate the paid tier.
- **Evidence I can show:** the scale-risk table in the validation report, profile config.

### IQ-009 · Walk me through how you proved the classifier meets its latency budget.

| Area | Source |
| --- | --- |
| Perf/WASM | ADR-0003, L-007, L-008 |

- **60-second answer:** I refused to trust Node numbers — V8 in Node flatters WASM by around 30% versus a real service worker — so I built a Puppeteer harness that drives the classifier inside an actual Chrome service worker and measured three things against hard budgets. Warm-path classify came in at 0.1 ms p95, roughly 50× under the 5 ms budget and far under the 16.6 ms frame budget, so during active browsing classification is essentially free. Cold-start — worker wake, WASM instantiate, first classify — was 42.8 ms p50 against a 50 ms budget, and that's the honest watch-item because it's compile-bound and this was a 2013 laptop. Size was 86.5 KB gzipped against 200 KB, but only after I swapped the full regex crate for regex-lite, which alone was blowing the budget at 337 KB. The number I'd lead with is 0.1 ms: that single measurement de-risks the whole "Rust only where a frame budget is load-bearing" bet.
- **The follow-up they'll ask:** "Why is cold-start so close to budget, and does it matter?" — It's dominated by compiling a ~200 KB WASM module, which the warm path never pays; production benefits from Chrome's WASM code cache on the same URL, which my harness models by keeping the module URL constant across worker restarts. Warm-path dominates real sessions, so it's a watch-item, not a blocker.
- **Evidence I can show:** bench/results/history.csv (the row), bench/harness/puppeteer.mjs, ADR-0003's measurement table.

### IQ-010 · Your ideal test environment wasn't available — an MV3 extension service worker. How did you still get a number you'd stand behind?

| Area | Source |
| --- | --- |
| Perf/Testing methodology | L-008, ADR-0003 |

- **60-second answer:** Current stable Chrome blocks the `--load-extension` command-line switch, and puppeteer also injects `--disable-extensions` by default, so I couldn't drive the classifier inside a real MV3 extension worker no matter how I set the flags — I proved that with a probe that listed every Chrome target and saw only the browser and a blank page. Instead of faking it in Node, which flatters WASM by around 30%, I ran the classifier in a real Chrome *module* ServiceWorker served over localhost. The key judgment call: my fixture worker uses zero `chrome.*` APIs, so the thing I'm measuring — V8 compiling and instantiating the WASM, worker-thread scheduling, the fetch-then-instantiate cold path — is byte-for-byte the same code path as an extension worker; the only difference is the chrome.runtime messaging layer, which sits outside the perf-critical path. So I documented it as an accepted deviation in the ADR with a follow-up to re-run on a real extension worker, rather than either blocking the spike or quietly pretending the substrate didn't change.
- **The follow-up they'll ask:** "How do you know the ServiceWorker substrate isn't hiding a real difference?" — The classifier is pure WASM with no extension APIs on its hot path, so the only MV3-specific variable is the 30-second idle-kill lifecycle, which I model by restarting the worker and measuring its first classify; the compute is identical because it's the same V8 engine instantiating the same module URL.
- **Evidence I can show:** bench/harness/puppeteer.mjs (the substrate + code-cache handling), the ADR-0003 deviation section, L-008.

### IQ-011 · How do you keep a Rust-WASM module small enough to ship, and what did you trade away?

| Area | Source |
| --- | --- |
| Rust/WASM/Perf | L-007, ADR-0003 |

- **60-second answer:** My first honest `wasm-pack --release` build came in at 337 KB gzipped against a 200 KB budget, and the offender was obvious: the full `regex` crate drags in Unicode property tables and multiple regex engines. I swapped it for `regex-lite`, which ships one small backtracking engine and no Unicode-by-default tables, and the module dropped to 86.5 KB gzipped with zero test changes — because all my PII patterns only use ASCII-class stuff: case-insensitive flags, word boundaries, digit and whitespace classes, and alternation. Then `wasm-opt -Os` took the raw size from 346 KB to 214 KB on top of that. What I gave up is real but irrelevant here: `regex-lite` has no lookaround, no backreferences, and no Unicode character classes — none of which a phone/email/coordinate scrubber needs. I recorded it in the ADR because adding or swapping a core-wasm dependency is exactly the kind of decision that shouldn't be silent.
- **The follow-up they'll ask:** "What if you later need a Unicode-aware pattern — say, non-Latin names?" — Then I'd reach for on-device NER rather than a heavier regex, because the weak class in my scrubber is names, not scripts, and bloating the WASM back over budget to chase names regex can't reliably catch anyway would be the wrong trade.
- **Evidence I can show:** Cargo.toml dependency comments, ADR-0003's alternatives table, the 337→86.5 KB delta in L-007.

### IQ-012 · How does your design map to CIPA requirements?

| Area | Source |
| --- | --- |
| Compliance/Product | Phase 4 design intent, ADR-0001 |

- **60-second answer:** CIPA binds E-Rate-funded schools, not vendors — so my job is making a district's compliance easy to demonstrate. Three of the four pillars fall out of the existing architecture: the filtering engine is the technology protection measure; the fail-closed institutional profile from ADR-0001 gives districts the posture their auditors expect; and managed deployment via Forcelist covers the "all student devices" requirement. The one deliberate addition is a baseline blocking layer — CIPA's categories are harmful-content-block, while my curriculum packs are study-allow, so the institutional profile layers category blocking beneath the packs; that's pack content, not new architecture. The interesting part is monitoring: CIPA expects it, my privacy stance forbids surveillance — I resolve that with aggregate monitoring, topic-level and class-level reporting with no per-child URL logs. Districts increasingly prefer that posture, and it's defensible in an audit because CIPA requires monitoring, not logging.
- **The follow-up they'll ask:** "Has aggregate-only monitoring actually passed E-Rate audits?" — Honest answer: that's a Phase 4 validation item with a district partner and their counsel; I designed the stricter-logging fallback as a config flag so the answer never blocks a deal.
- **Evidence I can show:** ADR-0001, the project map Phase 4 section, the profile config schema.

### IQ-013 · Your classifier is WASM inside an MV3 service worker that Chrome kills every 30 seconds. How do you keep it fast to wake?

| Area | Source |
| --- | --- |
| MV3/WASM/Perf | L-009, spec 002 |

- **60-second answer:** The trap in MV3 is treating the service worker like a persistent process — it isn't; Chrome kills it after about 30 seconds idle and wipes its memory, so anything you cached in a module-scope variable is gone on the next wake. So I split durable from ephemeral deliberately: the compiled WASM *bytes* are durable, cached into chrome.storage.local on install, and the *instance* is ephemeral, re-created on each cold wake by calling init straight from those cached bytes — no network, no disk re-read on the hot path. Within a single worker life I memoize the instance in a module-scope promise so warm calls skip instantiation entirely. The numbers back the design: cold instantiate from cached bytes is a few milliseconds and a warm classify is about 0.1 ms. I proved the survival property with a test that simulates a kill — it clears the in-memory instance, fires a classify, and asserts the core re-instantiates from storage with zero new fetches.
- **The follow-up they'll ask:** "Why not just keep the worker alive with a keepalive port or an alarm?" — Fighting the lifecycle is an anti-pattern Google actively discourages and it drains battery on a kid's Chromebook; the byte-cache makes cold wake cheap enough that you don't need to, which is the whole point of designing *with* the ephemeral model instead of against it.
- **Evidence I can show:** packages/extension/src/core.ts (ensureCore), the service_worker.test.ts state-survival test, the `[gr-bench] core-init` / `classify warm` console marks.

---

### IQ-014 · How would you update classification policy across millions of devices without shipping new code to each one?

| Area | Source |
| --- | --- |
| Scaling/Product/Security | ADR-0004, L-011, L-012 |

- **60-second answer:** The key move is separating classification *logic* from classification *policy*. The logic — the Aho-Corasick matcher and the PII scrubber — lives in a signed, reviewed WASM binary that changes rarely and goes through store review. The policy — which keywords, domains, and YouTube channels count as schoolwork — is just data: a JSON "curriculum pack" that loads at runtime and compiles into the automaton in about 80ms for a 10k-keyword pack, well under my 100ms budget, cached per worker life and rebuilt only when the pack changes. So a curriculum update becomes a content drop, not a code release. For the private beta the packs are bundled in the extension with no network fetch, but I reserved a `signature` field in the schema so remote signed delivery drops in later without a schema migration. The same split is also the privacy story: policy data flows separately and never has to carry anything about the child.
- **The follow-up they'll ask:** "If packs are just data, what stops a malicious or malformed pack from breaking filtering?" — Two things: a hand-written validator (zero runtime deps, cross-checked against a JSON Schema by ajv in tests) rejects a bad pack *before* activation, and activation is an atomic storage swap, so an invalid update leaves the previously-active pack in place — filtering never bricks. The gap I'm honest about is that the reserved `signature` is not yet verified, so today a pack is trusted purely because it shipped inside the extension; that check is what the Phase 3 trust-model ADR bolts onto the same validation choke point.
- **Evidence I can show:** docs/adr/0004-pack-format-and-trust.md, packages/extension/src/pack/{validate.ts,loader.ts}, the build-budget.test.ts 10k=83ms number, and the atomic-swap-survives-failed-update test.

---
*Next: IQ-015 (assigned by knowledge-capture skill)*
