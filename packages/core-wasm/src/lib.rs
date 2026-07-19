// core-wasm crate root — the thin boundary between the Rust classifier /
// PII (Personally Identifiable Information) scrubber and the JavaScript
// service worker that hosts them.
//
// Design rule (per wasm-build skill): wasm_bindgen types appear ONLY in
// this file. Business logic lives in classifier.rs and sanitize.rs and
// stays pure Rust — no JsValue, no wasm_bindgen macros — so it remains
// unit-testable via `cargo test` on the host without spinning up a
// WebAssembly runtime.
//
// Also: every public function returns Result. The release profile sets
// panic = "abort" (see Cargo.toml), which in production means a panic
// silently kills the WASM instance with no error surfaced to JS. So
// panics must never happen — we convert every recoverable failure to
// an Err at this boundary and return it as a rejected JsValue.

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

mod classifier;
mod sanitize;

pub use classifier::Verdict;

/// The result returned by classify() — the `verdict` tells the service
/// worker whether to allow the page (`Allow`), send it to the quiz gate
/// (`QuizGate`), or treat it as unclassified per the profile's fail-open
/// vs fail-closed policy (`Unknown`); `matches` is the deduped set of
/// curriculum/distraction tags that fired.
#[derive(Serialize, Deserialize)]
pub struct ClassifyResult {
    pub verdict: Verdict,
    pub matches: Vec<String>,
}

/// One curriculum keyword from a validated pack: `term` is matched in page
/// text, `tag` is the coarse subject label returned when it fires. The TS
/// loader validates the pack (spec 003) and hands us just this list, already
/// parsed — so we deserialize a JsValue via serde-wasm-bindgen and never pull
/// serde_json (and its ~size cost) into the .wasm.
#[derive(Deserialize)]
struct KeywordEntry {
    term: String,
    tag: String,
}

/// A pack-built classifier, held by the service worker for the worker's life
/// and rebuilt only on pack change (spec R2). The Aho-Corasick automaton is
/// compiled once, in `from_keywords`, off the hot path.
#[wasm_bindgen]
pub struct GuideClassifier {
    inner: classifier::Classifier,
}

#[wasm_bindgen]
impl GuideClassifier {
    /// Compile a classifier from a pack's `allow_keywords` — a JS array of
    /// `{ term, tag }`. Returns a rejected JsValue if the array can't be
    /// deserialized or the automaton fails to build; never panics (the
    /// release profile is `panic = "abort"`, so a panic would silently kill
    /// the instance).
    #[wasm_bindgen(js_name = fromKeywords)]
    pub fn from_keywords(keywords: JsValue) -> Result<GuideClassifier, JsValue> {
        let entries: Vec<KeywordEntry> = serde_wasm_bindgen::from_value(keywords)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        let inner = classifier::Classifier::from_entries(
            entries.into_iter().map(|k| (k.term, k.tag)).collect(),
        )
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(GuideClassifier { inner })
    }

    /// Match page text against this pack's automaton. Returns a serialized
    /// ClassifyResult.
    pub fn classify(&self, text: &str) -> Result<JsValue, JsValue> {
        let result = self.inner.classify(text);
        serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

/// Scrub PII (emails, phone numbers, coordinates, curated names) from
/// text before it leaves the client. Every network-egress path in the
/// extension MUST route through sanitize() first — this is the single
/// choke point that upholds "no raw child data crosses the network
/// boundary" from CLAUDE.md.
#[wasm_bindgen]
pub fn sanitize(text: &str) -> Result<String, JsValue> {
    sanitize::scrub(text).map_err(|e| JsValue::from_str(&e.to_string()))
}
