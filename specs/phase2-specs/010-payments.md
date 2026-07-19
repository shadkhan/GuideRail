# Spec: Payments — Family plan, founder pricing, dual-rail billing
Status: Draft · Date: 2026-07-17 · ADRs: will produce ADR-0008 (billing rails & tax posture)

## Goal (one sentence, user-visible outcome)
A beta family upgrades to the Family plan in under two minutes — card via merchant-of-record internationally, UPI in India — and founder pricing is honored automatically for life.

## Requirements (numbered, testable)
R1. International rail: Paddle or Lemon Squeezy (merchant of record — they own US/UK/EU tax filing; ADR-0008 records the choice and why MoR beats Stripe for a solo Indian founder).
R2. India rail: Razorpay subscriptions with UPI autopay; ₹ price point set per validation report (₹199–299/mo band, annual discount).
R3. Entitlement flow: webhook → backend verifies signature → sets tier + expiry on the account → extension/proxy read tier from spec 009's source of truth within one sync cycle. Webhooks are idempotent and replay-safe.
R4. Founder pricing: beta-flagged accounts get the founder price plan automatically at checkout; price locked while subscription stays active (grace: 30-day lapse keeps the lock).
R5. States handled: active, past_due (7-day grace, features stay on), canceled (features off at period end, data retained), refunded. Downgrade never deletes profiles — it locks extras read-only.
R6. Billing surface v1 lives in the dashboard (spec 014): current plan, invoices (provider-hosted), cancel button that actually cancels in one click (no retention dark patterns — brand promise).
R7. All prices/plans in one config file consumed by landing page, dashboard, and checkout — no drift.

## Out of scope
- Co-op group billing (Phase 3); lifetime deals; trials beyond the free tier itself; dunning emails beyond provider defaults

## Acceptance criteria (how "done" is proven)
- [ ] Test: webhook signature verification, idempotent replay, every state transition in R5
- [ ] Evidence: sandbox end-to-end recording — checkout → webhook → tier flips → proxy cap raises, on BOTH rails
- [ ] Evidence: cancel flow recording (one click, confirmation, period-end behavior)
- [ ] ADR-0008 written (MoR choice, dual-rail complexity accepted, tax posture for India entity)

## Open questions (must be empty before Status: Approved)
- Q1: Paddle vs Lemon Squeezy — decide on current India-founder onboarding friction (check both at build time).
- Q2: Do you invoice from an Indian sole-proprietor identity now, or wait for incorporation (ties to the funding-timing advice)?
