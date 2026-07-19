// PII scrubber — pure Rust, no wasm_bindgen types.
//
// PII = Personally Identifiable Information: emails, phone numbers
// (Indian/US/UK formats — +91 mobile, 10-digit local, grouped US, etc.),
// geographic coordinates, and a curated list of first names.
//
// Each pattern is compiled exactly once via lazy_static (regex compilation
// is expensive — never per call). Replacements run in a fixed order,
// longest / most-specific match first, so that a substring already claimed
// by one pattern (an email's local part, a coordinate's digits) can't be
// re-claimed by a later, looser one (a name, a phone).
//
// Every replaced span becomes a placeholder token ([EMAIL], [PHONE],
// [COORD], [NAME]) so downstream text stays readable / groundable by the
// LLM proxy without leaking the original value. This is the single choke
// point per CLAUDE.md's "no PII ever leaves the client" rule — every
// network-egress path routes through here first.
//
// Known weakness (documented in ADR-0003): name detection is a curated
// seed list, so names not on the list pass through. Phone heuristics can
// also over/under-match exotic formats. Accepted for the spike; the fix is
// a bigger list + NER, out of scope for spec 001.

use lazy_static::lazy_static;
// regex-lite (not the full regex crate) to keep the .wasm under the 200KB
// gzipped budget — see ADR-0003 and Cargo.toml. API-compatible for our use.
use regex_lite::Regex;

#[derive(Debug, thiserror::Error)]
pub enum SanitizeError {
    // Reserved: scrub() is currently infallible, but the boundary contract
    // (lib.rs) and CLAUDE.md require a Result so future patterns that can
    // fail (e.g. a loaded, non-constant name list) don't change the API.
    #[allow(dead_code)]
    #[error("scrub failed: {0}")]
    Failed(String),
}

// Curated seed list of first names (Q1 decision, spec 001). Kept small and
// case-insensitive. A production list would be far larger and loaded, not
// compiled in.
const SEED_NAMES: &[&str] = &[
    "Aarav", "Priya", "Rohan", "Ananya", "Vikram", "Meera", "Arjun", "Diya", "Kabir", "Ishaan",
    "Saanvi", "Aditya", "John", "Emma", "Michael", "Sarah", "David", "Sophia", "Olivia", "Liam",
];

lazy_static! {
    // Email: local@domain.tld. Runs first — an email's local part must not
    // survive to be matched as a name.
    static ref EMAIL: Regex =
        Regex::new(r"(?i)\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b").unwrap();

    // Decimal-degree coordinate pair: "37.7749, -122.4194". Runs before the
    // phone patterns so a coordinate's digit runs aren't eaten as a phone.
    static ref COORD: Regex =
        Regex::new(r"[-+]?\d{1,3}\.\d{3,},\s*[-+]?\d{1,3}\.\d{3,}").unwrap();

    // Phone patterns, most-specific first. Applied in sequence; once a span
    // becomes [PHONE] the looser patterns can't re-match it.
    //   1. International with a + country code (+91, +44, +1, ...).
    static ref PHONE_INTL: Regex =
        Regex::new(r"\+\d{1,3}[-\s]?\(?\d{2,5}\)?[-\s]?\d{3,4}[-\s]?\d{3,4}").unwrap();
    //   2a. Leading-0 number split into space/hyphen groups (UK landline
    //       "0161 496 0000", IN STD "022-2758-9400"). Separators required so
    //       this doesn't swallow bare numbers handled below.
    static ref PHONE_LEADING0_GROUPED: Regex =
        Regex::new(r"\b0\d{2,4}[-.\s]\d{3,4}[-.\s]\d{3,4}\b").unwrap();
    //   2b. Local number with a leading 0, contiguous: 10–11 digits.
    static ref PHONE_LEADING0: Regex =
        Regex::new(r"\b0\d{9,10}\b").unwrap();
    //   3. US grouped 10-digit, optional parens/separators.
    static ref PHONE_US: Regex =
        Regex::new(r"\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b").unwrap();
    //   4. Bare Indian mobile: 10 digits starting 6–9, no separators.
    static ref PHONE_BARE_IN: Regex =
        Regex::new(r"\b[6-9]\d{9}\b").unwrap();

    // Curated names, word-bounded and case-insensitive. Runs last.
    static ref NAME: Regex = {
        let alternation = SEED_NAMES.join("|");
        Regex::new(&format!(r"(?i)\b(?:{alternation})\b")).unwrap()
    };
}

/// Scrub PII from `text`, returning tokenized text. Infallible today (see
/// SanitizeError) but Result-typed to hold the boundary contract.
pub fn scrub(text: &str) -> Result<String, SanitizeError> {
    // Ordered pipeline: each stage replaces its matches with a token, and
    // later stages see the tokenized text, never the raw span.
    let s = EMAIL.replace_all(text, "[EMAIL]");
    let s = COORD.replace_all(&s, "[COORD]");
    let s = PHONE_INTL.replace_all(&s, "[PHONE]");
    let s = PHONE_LEADING0_GROUPED.replace_all(&s, "[PHONE]");
    let s = PHONE_LEADING0.replace_all(&s, "[PHONE]");
    let s = PHONE_US.replace_all(&s, "[PHONE]");
    let s = PHONE_BARE_IN.replace_all(&s, "[PHONE]");
    let s = NAME.replace_all(&s, "[NAME]");
    Ok(s.into_owned())
}

#[cfg(test)]
mod tests {
    use super::*;

    // The ≥30-case PII corpus (spec 001 acceptance). Each row: (input,
    // must-contain token, must-NOT-contain raw fragment).
    struct Case {
        input: &'static str,
        expect_token: &'static str,
        forbid: &'static str,
    }

    const CORPUS: &[Case] = &[
        // --- Emails (8) ---
        Case {
            input: "reach me at aarav@example.com please",
            expect_token: "[EMAIL]",
            forbid: "aarav@example.com",
        },
        Case {
            input: "PRIYA.SHARMA@school.edu.in",
            expect_token: "[EMAIL]",
            forbid: "@school",
        },
        Case {
            input: "teacher+math@gmail.com",
            expect_token: "[EMAIL]",
            forbid: "gmail.com",
        },
        Case {
            input: "a_b.c-d@sub.domain.co.uk",
            expect_token: "[EMAIL]",
            forbid: "domain.co.uk",
        },
        Case {
            input: "no-reply@guiderail.app sent this",
            expect_token: "[EMAIL]",
            forbid: "guiderail.app",
        },
        Case {
            input: "contact: rohan99@yahoo.com.",
            expect_token: "[EMAIL]",
            forbid: "rohan99",
        },
        Case {
            input: "MiXeD.Case@Example.COM",
            expect_token: "[EMAIL]",
            forbid: "MiXeD.Case@",
        },
        Case {
            input: "student123@nic.in for records",
            expect_token: "[EMAIL]",
            forbid: "nic.in",
        },
        // --- Indian phones (7) ---
        Case {
            input: "call +91 98765 43210 now",
            expect_token: "[PHONE]",
            forbid: "98765",
        },
        Case {
            input: "+91-98765-43210",
            expect_token: "[PHONE]",
            forbid: "43210",
        },
        Case {
            input: "mobile 9876543210 ok",
            expect_token: "[PHONE]",
            forbid: "9876543210",
        },
        Case {
            input: "landline 09876543210",
            expect_token: "[PHONE]",
            forbid: "09876543210",
        },
        Case {
            input: "reach 8123456789 anytime",
            expect_token: "[PHONE]",
            forbid: "8123456789",
        },
        Case {
            input: "+919812345678",
            expect_token: "[PHONE]",
            forbid: "9812345678",
        },
        Case {
            input: "ph: 7000012345",
            expect_token: "[PHONE]",
            forbid: "7000012345",
        },
        // --- US phones (5) ---
        Case {
            input: "US (415) 555-0132 desk",
            expect_token: "[PHONE]",
            forbid: "555-0132",
        },
        Case {
            input: "415-555-0132",
            expect_token: "[PHONE]",
            forbid: "0132",
        },
        Case {
            input: "415.555.0132",
            expect_token: "[PHONE]",
            forbid: "415.555",
        },
        Case {
            input: "+1 415 555 0132",
            expect_token: "[PHONE]",
            forbid: "415 555",
        },
        Case {
            input: "call 212 867 5309 today",
            expect_token: "[PHONE]",
            forbid: "867 5309",
        },
        // --- UK phones (3) ---
        Case {
            input: "UK +44 20 7946 0958",
            expect_token: "[PHONE]",
            forbid: "7946",
        },
        Case {
            input: "+44 7911 123456",
            expect_token: "[PHONE]",
            forbid: "7911",
        },
        Case {
            input: "0161 496 0000",
            expect_token: "[PHONE]",
            forbid: "0161",
        },
        // --- Coordinates (3) ---
        Case {
            input: "home at 37.7749, -122.4194 sf",
            expect_token: "[COORD]",
            forbid: "37.7749",
        },
        Case {
            input: "28.6139, 77.2090 delhi",
            expect_token: "[COORD]",
            forbid: "77.2090",
        },
        Case {
            input: "-33.8688,151.2093",
            expect_token: "[COORD]",
            forbid: "151.2093",
        },
        // --- Names, incl. Hinglish (6) ---
        Case {
            input: "Aarav did the homework",
            expect_token: "[NAME]",
            forbid: "Aarav",
        },
        Case {
            input: "ask priya about it",
            expect_token: "[NAME]",
            forbid: "priya",
        },
        Case {
            input: "ROHAN and Ananya",
            expect_token: "[NAME]",
            forbid: "ROHAN",
        },
        Case {
            input: "great job, Vikram!",
            expect_token: "[NAME]",
            forbid: "Vikram",
        },
        Case {
            input: "Michael reviewed Sarah's essay",
            expect_token: "[NAME]",
            forbid: "Michael",
        },
        Case {
            input: "Diya and Kabir presented",
            expect_token: "[NAME]",
            forbid: "Kabir",
        },
    ];

    #[test]
    fn corpus_has_at_least_30_cases() {
        assert!(
            CORPUS.len() >= 30,
            "spec 001 requires ≥30 PII cases, got {}",
            CORPUS.len()
        );
    }

    #[test]
    fn corpus_scrubs_every_case() {
        for c in CORPUS {
            let out = scrub(c.input).unwrap();
            assert!(
                out.contains(c.expect_token),
                "input {:?} → {:?} missing token {}",
                c.input,
                out,
                c.expect_token
            );
            assert!(
                !out.contains(c.forbid),
                "input {:?} → {:?} still leaks {:?}",
                c.input,
                out,
                c.forbid
            );
        }
    }

    #[test]
    fn multiple_pii_in_one_string() {
        let out = scrub("email aarav@x.com or call +91 98765 43210, ask Priya").unwrap();
        assert!(out.contains("[EMAIL]"));
        assert!(out.contains("[PHONE]"));
        assert!(out.contains("[NAME]"));
        assert!(!out.contains("aarav@x.com"));
        assert!(!out.contains("98765"));
    }

    #[test]
    fn clean_text_is_unchanged() {
        let clean = "The mitochondria is the powerhouse of the cell.";
        assert_eq!(scrub(clean).unwrap(), clean);
    }

    #[test]
    fn email_local_part_not_left_as_name() {
        // "john" is a seed name but must be consumed by [EMAIL] first.
        let out = scrub("john@example.com").unwrap();
        assert_eq!(out, "[EMAIL]");
        assert!(!out.contains("[NAME]"));
    }
}
