// Curriculum classifier — pure Rust, no wasm_bindgen types.
//
// Uses the aho-corasick crate: a single-pass, multi-pattern string matcher
// based on the Aho-Corasick automaton. Given a set of curriculum keywords
// (hundreds-to-thousands per pack in production), it finds every occurrence in
// a page's text in O(text + matches) time — NOT O(keywords × text) like a
// naive regex-per-keyword loop would. Learning L-004 in docs/LEARNINGS.md
// explains why regex is the wrong tool here.
//
// Scope change from spec 001 → spec 003: the spike hardcoded ONE pack as a
// compile-time constant. Real packs are DATA now — a pack's curriculum
// keywords arrive at runtime (from a validated JSON pack, see spec 003) and
// compile into the automaton once, at load, via `Classifier::from_entries`.
// The built automaton is held by the caller for the worker's life and rebuilt
// only on pack change (spec R2). ADR-0004 records why. ADR = Architecture
// Decision Record.
//
// The distraction → QuizGate keyword set stays a small built-in constant here:
// packs are an ALLOW model (they say what schoolwork IS), so the distraction
// side is not a pack concern. The richer fail-open/fail-closed verdict policy —
// and any pack-driven distraction handling — is spec 004 (filtering engine);
// this constant is deliberate continuity with the 001 spike until then.

use crate::ClassifyResult;
use aho_corasick::AhoCorasick;

#[derive(Debug, thiserror::Error)]
pub enum ClassifierError {
    #[error("failed to build classifier automaton: {0}")]
    Build(String),
}

/// The verdict for a page. The service worker maps this onto an action:
/// `Allow` = on-topic schoolwork, let it through; `QuizGate` = a known
/// distraction, route to the earn-time quiz; `Unknown` = nothing matched,
/// leave the allow/block decision to the profile's fail-open vs fail-closed
/// policy (spec 004).
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Verdict {
    Allow,
    QuizGate,
    Unknown,
}

/// Which side of the ledger a keyword sits on. Curriculum matches pull a
/// page toward `Allow`; distraction matches (in the absence of any
/// curriculum match) pull it toward `QuizGate`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Category {
    Curriculum,
    Distraction,
}

/// Built-in distraction keywords (tag, keyword). Not pack-driven — see the
/// module header. Kept small and stable; spec 004 owns the real policy.
const DISTRACTION_ENTRIES: &[(&str, &str)] = &[
    ("gaming", "fortnite"),
    ("gaming", "roblox"),
    ("social", "tiktok"),
    ("social", "meme"),
    ("video", "livestream"),
];

/// A compiled classifier: one Aho-Corasick automaton plus a side table that
/// maps each pattern index back to its `(tag, category)`. Build once with
/// `from_entries`, then call `classify` as many times as needed — the hot
/// path allocates nothing per keyword.
pub struct Classifier {
    automaton: AhoCorasick,
    /// Parallel to the automaton's pattern ids: `meta[i]` describes pattern i.
    meta: Vec<(String, Category)>,
}

impl Classifier {
    /// Compile a classifier from a pack's curriculum keywords, each a
    /// `(term, tag)` pair. The built-in distraction set is appended after the
    /// curriculum terms so both are found in the same single automaton walk.
    ///
    /// Pattern ids are assigned in insertion order, so `meta` is built in the
    /// same order and stays index-aligned with `automaton`. Case-insensitive
    /// (ASCII) so a page's "Algebra" matches the lowercase keyword without
    /// lowercasing the whole input on every call.
    pub fn from_entries(curriculum: Vec<(String, String)>) -> Result<Self, ClassifierError> {
        let mut patterns: Vec<String> =
            Vec::with_capacity(curriculum.len() + DISTRACTION_ENTRIES.len());
        let mut meta: Vec<(String, Category)> = Vec::with_capacity(patterns.capacity());

        for (term, tag) in curriculum {
            patterns.push(term);
            meta.push((tag, Category::Curriculum));
        }
        for (tag, keyword) in DISTRACTION_ENTRIES {
            patterns.push((*keyword).to_string());
            meta.push(((*tag).to_string(), Category::Distraction));
        }

        // A pack with zero keywords still produces a valid (match-nothing)
        // automaton — but we surface a build failure rather than panic, since
        // the release profile is `panic = "abort"` and a panic would silently
        // kill the WASM instance (PII = Personally Identifiable Information
        // scrubbing shares that instance).
        let automaton = AhoCorasick::builder()
            .ascii_case_insensitive(true)
            .build(&patterns)
            .map_err(|e| ClassifierError::Build(e.to_string()))?;

        Ok(Self { automaton, meta })
    }

    /// Match `text` against this classifier and return the matched tags plus a
    /// verdict. Single automaton walk; no allocation per keyword. Curriculum
    /// beats distraction: a page that mentions both study content and a
    /// distraction is still study content.
    pub fn classify(&self, text: &str) -> ClassifyResult {
        let mut saw_curriculum = false;
        let mut saw_distraction = false;
        // Small tag set; a Vec kept unique via contains() is cheaper than a
        // HashMap for the handful of tags a real pack carries.
        let mut tags: Vec<String> = Vec::new();

        for mat in self.automaton.find_iter(text) {
            let (tag, category) = &self.meta[mat.pattern().as_usize()];
            match category {
                Category::Curriculum => saw_curriculum = true,
                Category::Distraction => saw_distraction = true,
            }
            if !tags.iter().any(|t| t == tag) {
                tags.push(tag.clone());
            }
        }

        // Deterministic output regardless of match order in the text.
        tags.sort();

        let verdict = if saw_curriculum {
            Verdict::Allow
        } else if saw_distraction {
            Verdict::QuizGate
        } else {
            Verdict::Unknown
        };

        ClassifyResult {
            verdict,
            matches: tags,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A stand-in for a loaded pack's curriculum keywords, mirroring the
    /// spike's tag vocabulary so the assertions stay legible.
    fn seed() -> Classifier {
        let curriculum = vec![
            ("algebra", "math"),
            ("fraction", "math"),
            ("equation", "math"),
            ("geometry", "math"),
            ("photosynthesis", "science"),
            ("mitochondria", "science"),
            ("ecosystem", "science"),
            ("velocity", "science"),
            ("grammar", "language"),
            ("paragraph", "language"),
            ("vocabulary", "language"),
            ("revolution", "history"),
            ("civilization", "history"),
        ]
        .into_iter()
        .map(|(t, g)| (t.to_string(), g.to_string()))
        .collect();
        Classifier::from_entries(curriculum).unwrap()
    }

    #[test]
    fn curriculum_text_allows_and_returns_sorted_tags() {
        let r = seed().classify("Today's algebra and photosynthesis homework");
        assert_eq!(r.verdict, Verdict::Allow);
        assert_eq!(r.matches, vec!["math".to_string(), "science".to_string()]);
    }

    #[test]
    fn case_insensitive_match() {
        let r = seed().classify("ALGEBRA basics");
        assert_eq!(r.verdict, Verdict::Allow);
        assert_eq!(r.matches, vec!["math".to_string()]);
    }

    #[test]
    fn distraction_only_routes_to_quiz_gate() {
        let r = seed().classify("watch this fortnite livestream");
        assert_eq!(r.verdict, Verdict::QuizGate);
        assert_eq!(r.matches, vec!["gaming".to_string(), "video".to_string()]);
    }

    #[test]
    fn curriculum_wins_over_distraction() {
        // A page that mentions both study content and a distraction is still
        // study content — Allow takes precedence.
        let r = seed().classify("algebra explained with a fortnite analogy");
        assert_eq!(r.verdict, Verdict::Allow);
    }

    #[test]
    fn no_match_is_unknown_with_empty_tags() {
        let r = seed().classify("just some ordinary sentence");
        assert_eq!(r.verdict, Verdict::Unknown);
        assert!(r.matches.is_empty());
    }

    #[test]
    fn empty_text_is_unknown() {
        let r = seed().classify("");
        assert_eq!(r.verdict, Verdict::Unknown);
    }

    #[test]
    fn tags_are_deduped() {
        // Two math keywords → one "math" tag.
        let r = seed().classify("algebra and geometry and fractions");
        assert_eq!(r.matches, vec!["math".to_string()]);
    }

    #[test]
    fn distraction_set_is_pack_independent() {
        // A pack with a single, unrelated keyword still carries the built-in
        // distraction set (continuity until spec 004).
        let c = Classifier::from_entries(vec![("astronomy".to_string(), "science".to_string())])
            .unwrap();
        let r = c.classify("roblox stream");
        assert_eq!(r.verdict, Verdict::QuizGate);
        assert_eq!(r.matches, vec!["gaming".to_string()]);
    }

    #[test]
    fn empty_pack_builds_and_matches_only_distraction() {
        // Loader rejects empty packs (schema), but the matcher must not panic.
        let c = Classifier::from_entries(vec![]).unwrap();
        assert_eq!(c.classify("algebra").verdict, Verdict::Unknown);
        assert_eq!(c.classify("tiktok").verdict, Verdict::QuizGate);
    }
}
