# Spec: Weekly Digest — the Sunday email
Status: Draft · Date: 2026-07-17 · ADRs: none expected (aggregates-only per privacy stance)

## Goal (one sentence, user-visible outcome)
Every Sunday a parent gets one email per family — a per-child snapshot of what was read, quizzes passed, and time earned — the artifact they forward to a skeptical spouse, and the habit that defends against school-year churn.

## Requirements (numbered, testable)
R1. Aggregation is device-side: extension computes weekly per-profile aggregates {topics_read (tag counts, NOT urls), quizzes: attempted/passed, earned_minutes, worksheets_generated, ask_requests: n} and syncs ONLY these aggregates — raw history never leaves the device (consistent with spec 009 R3).
R2. Backend digest job (Workers cron, Sunday 16:00 local-to-account-tz): assembles synced aggregates → one email per family via the spec 009 email provider; skips silently if no activity (no guilt emails).
R3. Email design: exercise-book design language, per-child cards, one highlight line auto-picked ("Riya's best topic: the water cycle — 3/3 twice"); plain-text alternative part; renders in Gmail/Outlook mobile.
R4. Free tier gets the digest too (retention > monetization here) with a single tasteful footer line about Family features — never inside the child cards.
R5. Controls: dashboard toggle per family, day/time picker, instant "send me this week now" preview button.
R6. Stale-device honesty: if a device hasn't synced ≥3 days, the digest says so ("Arjun's laptop last reported Thursday") rather than presenting partial data as complete.
R7. One-click unsubscribe honored instantly (list-unsubscribe header) — deliverability hygiene.

## Out of scope
- PDF/print digest; in-dashboard historical charts (later); teacher/co-op digests (Phase 3+); streaks or gamified pressure mechanics (deliberately excluded — no guilt loops)

## Acceptance criteria (how "done" is proven)
- [ ] Test: aggregate computation from synthetic week data, tz-correct send windows, skip/stale/unsubscribe paths
- [ ] Evidence: real digest email screenshot on Gmail mobile + Outlook web, two-child family, one stale device
- [ ] Evidence: grep/API proof that no URL-level data exists server-side — aggregates only
- [ ] Evidence: "send now" preview works from the dashboard

## Open questions (must be empty before Status: Approved)
- Q1: Highlight-line selection rule — deterministic (best pass-rate topic) or small-LLM phrasing pass (costs, but warmer)? Recommend deterministic v1.
- Q2: Sunday 16:00 default — right for both India and US beta families, or per-region default?
