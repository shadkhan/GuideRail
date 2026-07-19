# Spec: Parent Dashboard — Next.js web app
Status: Draft · Date: 2026-07-17 · ADRs: none expected (reads existing APIs)

## Goal (one sentence, user-visible outcome)
A parent manages the whole family from their phone — profiles, schedules, gate lists, billing — without touching the child's laptop.

## Requirements (numbered, testable)
R1. Next.js app (`apps/dashboard`) deployed to Vercel/CF Pages; auth via spec 009 magic-link (shared session model); mobile-first layouts — phone is the primary device.
R2. Views: (1) Family overview — per-child card: pack, today's schedule, earned time now, last quiz result; (2) Profile editor — pack/schedule/gate-list overrides; (3) Gate-list manager with the ~50-domain base list + family additions; (4) Billing (spec 010 R6); (5) Generated-question review queue (spec 012 R7) and recent worksheets (read-only mirror where synced).
R3. All mutations go through the same backend APIs the extension uses — dashboard has no privileged write paths; changes propagate to devices within one sync cycle with a visible "synced to N devices" indicator.
R4. Live-ish state (earned time, last quiz) via lightweight poll (30s) — no websockets v1.
R5. Design language: the exercise-book system from the landing page (ruled lines, red margin rule, Bricolage/Karla, earned-green) — one shared tokens file consumed by landing + dashboard.
R6. Accessibility: WCAG AA, keyboard-complete, works on a 360px screen.
R7. Empty/edge states designed: no extension linked yet (install CTA + QR), sync stale >24h warning, child offline.

## Out of scope
- Ask-to-unlock UI (spec 015 adds it onto this shell); digest content (spec 016); co-op admin (Phase 3); native apps

## Acceptance criteria (how "done" is proven)
- [ ] Test: component tests for mutation flows; API-contract tests against a mocked backend
- [ ] Evidence: phone recording — parent edits study hours on the dashboard, child's extension reflects it after sync pull
- [ ] Evidence: Lighthouse mobile ≥90 accessibility, ≥80 performance on the overview page
- [ ] Evidence: all R7 empty states screenshot-reviewed

## Open questions (must be empty before Status: Approved)
- Q1: Vercel vs CF Pages (you have both; CF keeps one vendor with Workers — decide).
- Q2: Should the dashboard show any reading-history detail, or aggregates only? (Privacy stance says aggregates; confirm the line.)
