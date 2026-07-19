# Spec: Ask-to-Unlock — request → one-tap parent approval
Status: Draft · Date: 2026-07-17 · ADRs: none expected

## Goal (one sentence, user-visible outcome)
A child blocked from a site taps "Ask my parent," the parent approves or denies from their phone in one tap, and the decision applies within seconds — the negotiation moves into software.

## Requirements (numbered, testable)
R1. Child side: on quiz-gate and (new) blocked-site pages, an "Ask my parent" button with optional 100-char reason; request = {origin, profile, reason, ts}; max 3 pending per child (anti-spam), duplicate-origin requests coalesce.
R2. Transport: request → backend → parent notification via web push (dashboard PWA) with email fallback if push undelivered in 5 min; deep-links to an approval card.
R3. Approval card options: Allow 1 hour · Allow today · Allow always (adds to profile allow-list) · Deny with optional note. Decision syncs to the device ≤ one pull cycle; push-triggered immediate pull where possible.
R4. Applied result: temporary allows = earned-time-style session rule + alarms expiry (reuses spec 005 machinery); "always" writes through the normal profile override path (spec 011 R6).
R5. Child feedback: pending state visible on the gate page ("asked — waiting"), decision shown without shame framing (deny note displays verbatim, neutral styling).
R6. Log: request/decision history per profile in the dashboard (last 30), local + synced aggregate.
R7. Study-hours integrity: approvals never extend study hours themselves; an "always" allow still yields to future gate-list edits.

## Out of scope
- SMS/WhatsApp channels; multi-parent voting; auto-approval rules; child-to-child requests

## Acceptance criteria (how "done" is proven)
- [ ] Test: coalescing/anti-spam, every approval option's rule lifecycle, push→email fallback timer, deny-note rendering
- [ ] Evidence: two-device recording — child asks on laptop, parent approves "1 hour" on phone, site opens on laptop; timer expiry restores gate
- [ ] Evidence: push disabled → email arrives within fallback window with working deep link

## Open questions (must be empty before Status: Approved)
- Q1: Should "Allow today" mean calendar-day or until study-hours end? (Recommend until-hours-end; confirm.)
- Q2: Notify child when denied silently vs with note required? (Family-culture question — default optional note.)
