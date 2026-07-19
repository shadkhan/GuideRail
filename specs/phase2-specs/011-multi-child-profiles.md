# Spec: Multi-Child Profiles
Status: Draft · Date: 2026-07-17 · ADRs: none expected (schema was versioned for this)

## Goal (one sentence, user-visible outcome)
The median buyer — a parent with 3+ kids in different classes — runs one extension with a profile per child: right pack, right schedule, right quizzes, per child.

## Requirements (numbered, testable)
R1. Storage migration `gr.v1.*` → `gr.v2.*`: single-profile data becomes profile[0]; migration is one-way, tested, and reversible-by-backup (auto-export JSON before migrating).
R2. Up to 5 profiles (free tier: 1 — enforced per spec 009 R7). Profile = {name, avatar_color, pack_id, schedule, gate_list_overrides}.
R3. Active-profile selection: quick switcher on the extension popup, parent-PIN required to switch DURING study hours (kids can't hop to a sibling's laxer profile mid-block); free switching outside hours.
R4. Every policy read (filtering, quiz gate, blur, hours) resolves through `activeProfile()` — grep-checkable: no module reads schedule/pack directly.
R5. Quiz topic-weighting history, earned-time tokens, and verdict cache are namespaced per profile — a sibling's earned time never leaks.
R6. Per-profile gate-list overrides layer on the family base list (add-only for stricter, PIN-gated removals for laxer).
R7. Sync (spec 009) carries all profiles; device can pin "this laptop defaults to profile X."

## Out of scope
- Per-profile dashboards beyond the switcher (spec 014 renders the full views); >5 profiles; profile-level PINs for kids

## Acceptance criteria (how "done" is proven)
- [ ] Test: migration corpus (fresh, v1-with-data, corrupted), namespace isolation (token minted in profile A absent in B), switcher PIN matrix in/out of hours
- [ ] Evidence: recording — two profiles, different packs; same URL allowed for child A (Class 10 pack) and quiz-gated for child B (Class 3), switch enforced by PIN during hours
- [ ] Evidence: auto-export backup file exists and re-imports cleanly

## Open questions (must be empty before Status: Approved)
- Q1: Device-pinning default UX — ask on first run after upgrade, or silent last-used?
- Q2: Family base gate-list vs per-profile only — confirm the layering model above matches how your own household would use it.
