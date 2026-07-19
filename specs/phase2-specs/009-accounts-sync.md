# Spec: Accounts & Sync — parent-only identity
Status: Draft · Date: 2026-07-17 · ADRs: will produce ADR-0007 (identity model: why no child accounts)

## Goal (one sentence, user-visible outcome)
A parent creates one account with just an email, their settings and child profiles sync across the family's devices, and children never have accounts at all — by design.

## Requirements (numbered, testable)
R1. Identity: email magic-link only (no passwords v1); parent account = the ONLY account type; children exist solely as profile objects under the parent. Sessions: short-lived JWT + refresh, stored in extension storage.
R2. Backend: same Workers project as spec 008 or sibling; D1 (SQLite) or Postgres-over-Hyperdrive for accounts/profiles/subscription-tier tables — decide in interview, record in ADR-0007.
R3. Sync scope (allowlist, not "everything"): profiles, packs selected, study hours, gate-list edits, tier flag. Explicitly NOT synced: browsing verdict cache, quiz history details (stay device-local; digest gets aggregates only via spec 016).
R4. Sync model: last-write-wins per key with updated_at; extension pulls on worker start + chrome.alarms every 6h; offline-first — everything works with sync down.
R5. Beta bridge: landing-page email list imported; first login links beta flag → founder pricing entitlement (read by spec 010).
R6. Account deletion endpoint: full erasure of server-side data within 30 days, immediate deactivation; export endpoint (JSON) — DPDP/GDPR hygiene from day one.
R7. Free-tier enforcement source of truth: tier + profile-count limit live server-side; extension enforces locally but proxy/backend re-validate (client is never trusted for entitlements).

## Out of scope
- OAuth providers; password auth; child-facing login of any kind
- Payments (spec 010); dashboard UI (spec 014) — this is API + extension integration only

## Acceptance criteria (how "done" is proven)
- [ ] Test: magic-link flow (issue/expiry/replay-rejection), LWW merge cases, offline behavior, deletion cascade
- [ ] Evidence: two Chrome profiles on different machines syncing a gate-list edit within one pull cycle (recording)
- [ ] Evidence: deletion request → server tables empty for that account (query output)
- [ ] ADR-0007 written — the "no child accounts" identity model as a COPPA position, with negative consequences (multi-device child attribution limits) stated

## Open questions (must be empty before Status: Approved)
- Q1: D1 vs Postgres — D1 is zero-cost/zero-ops but migration-limited; your call given ClickHouse lives on the VPS anyway.
- Q2: Magic-link email sender — Resend free tier vs SES? (deliverability to Gmail matters for the beta import).
