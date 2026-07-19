# Spec: Onboarding, Study Hours & Child Rules Screen
Status: Draft · Date: 2026-07-17 · ADRs: none expected

## Goal (one sentence, user-visible outcome)
A parent goes from install to working protection in under 10 minutes — one child profile, curriculum picked, study hours set — and the child can always see exactly what rules apply to them.

## Requirements (numbered, testable)
R1. First-run onboarding (extension options page, 4 steps): (1) parent PIN set, (2) child name/class → pack selection via spec 003 API, (3) study-hours schedule, (4) "show your child this screen" — the rules screen walkthrough. Progress persists if abandoned midway.
R2. Study hours v1: per-weekday windows (answering spec 004 Q1), sensible default pre-filled (Mon–Fri 09:00–15:00), stored in the versioned schema; all policy modules read from one `isStudyTime()` source of truth.
R3. Parent settings (PIN-gated): edit profile/pack/hours, edit gate-list (add/remove domains), pause protection for today (logged), uninstall guidance.
R4. Child rules screen (NOT PIN-gated, linked from quiz gate footer): plain-language display of — active study hours, what's always allowed (curriculum name), what's earnable (gate list), current earned time, and the exact data stored locally ("nothing leaves this computer"). Reading level ~10 years.
R5. PIN: 4–6 digits, hashed (not plaintext) in storage, 5-attempt lockout with alarms-based cooldown; honest limitation documented — this is a speed bump on unmanaged devices, consistent with IQ-007 posture.
R6. All UI is extension pages (options + rules screen); Karla/system fonts, meets WCAG AA contrast, keyboard navigable.
R7. Every settings mutation goes through the typed message schema + storage wrappers; no direct storage writes from UI code.

## Out of scope
- Multi-child profiles (Phase 2); parent web dashboard; email capture/accounts
- Ask-to-unlock; weekly digest

## Acceptance criteria (how "done" is proven)
- [ ] Test: onboarding state machine (resume-from-abandon), isStudyTime() matrix incl. midnight-spanning windows, PIN lockout timing
- [ ] Evidence: screen recording — fresh install to protected browsing < 10 minutes wall clock
- [ ] Evidence: child rules screen reviewed by an actual child (your beta tester #1) — capture their feedback verbatim in LEARNINGS
- [ ] Accessibility: keyboard-only walkthrough recording; contrast check output

## Open questions (must be empty before Status: Approved)
- Q1: PIN recovery path — none (re-onboard) vs parent email link (requires backend)? Recommend none for beta, stated clearly.
- Q2: Default gate-list contents — finalize the ~50 domains (I can draft; you approve).
