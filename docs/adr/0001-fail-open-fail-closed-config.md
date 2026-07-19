# 0001. Fail-open vs fail-closed is a per-profile configuration, not a hardcoded policy

Date: 2026-07-19 | Status: Accepted | Supersedes: — | Superseded by: —

<!-- Acronyms (first use): ADR = Architecture Decision Record; MV3 = Manifest
     V3; DNR = declarativeNetRequest; CIPA = Children's Internet Protection Act. -->

## Context

The classifier (spec 001) returns one of three verdicts — `allow`, `quiz_gate`,
or `unknown`. `unknown` is the hard case: a page we have not yet classified, or
cannot. What the extension does with an `unknown` page is a safety trade-off
whose right answer depends entirely on who is on the other side of the screen.
In the **consumer** profile (homeschool / study-time, a supervising adult in the
room) the adult is a compensating control, and a blocking interstitial on every
unclassified page would be intolerable UX. In the **institutional** profile
(Securly-scale, one adult per hundreds of screens) there is no compensating
control and the liability calculus inverts. Classification itself is cheap
(warm-path p95 0.1 ms, ADR-0003) but runs asynchronously, and the ~30 k DNR
dynamic-rule budget cannot pre-block the long tail of unknown domains — so the
disposition of `unknown` is a real, load-bearing decision. CLAUDE.md already
names this a non-negotiable: it must be config (`profile: consumer |
institutional`), never hardcoded.

## Decision

We will make the disposition of an `unknown` page a function of the `profile`
config value, evaluated at the single branch point where the classifier returns
`unknown`. **Consumer → fail-open:** render immediately, classify in the
background, and act on the result retroactively (the blur-blanket, spec 006,
keeps images hidden until validation so the visual path stays fail-closed even
while the page is fail-open). **Institutional → fail-closed:** hold the
navigation behind a fast interstitial until a verdict resolves. Both profiles
share one classifier and one pack pipeline; only the `unknown` branch differs.
To keep the fail-closed path usable, the institutional profile pre-caches
classifications for the district's top domains so the interstitial resolves in
under 1 s at p95 for the long tail.

## Alternatives considered

| Option | Why rejected (one honest sentence) |
|---|---|
| Hardcode fail-open globally | Unacceptable liability at district scale, where no adult supervises each screen. |
| Hardcode fail-closed globally | An interstitial on every unclassified page destroys the consumer experience and taxes normal browsing with latency the parent doesn't need. |
| Per-site user toggle | Too granular, no clear owner, and it pushes a safety decision onto the user mid-browse — exactly when they're least equipped to make it. |

## Consequences

- **Positive:** One codebase serves both the consumer and institutional markets;
  the trade-off is explicit and auditable in this ADR rather than buried in a
  constant. The axis composes cleanly with the CIPA-conscious fail-closed default
  districts expect (project map, Phase 4).
- **Negative / accepted debt:**
  - Fail-open means a single unclassified harmful page can render **once** before
    async classification catches it. The blur-blanket narrows the *visual*
    exposure window but does not eliminate the general one.
  - Fail-closed adds interstitial latency on the long tail of uncached domains.
    Pre-caching mitigates it, but a genuinely cold unknown domain still waits, and
    that p95 wait — not the policy — is what users feel.
  - Neither profile is bypass-proof; the residual surface is owned by ADR-0002.
- **Revisit when:** an institutional pilot measures interstitial p95 > 1 s on real
  traffic; OR a consumer incident shows the supervising-adult assumption doesn't
  hold for a real family; OR the classifier gains a confidence score that would
  justify a third, "soft-gate" disposition between open and closed.

## Interview note

The point I'd make in 60 seconds: I wouldn't defend fail-open universally — I
made it a configuration axis, not a philosophy. When a safety trade-off depends
on deployment context, it belongs in config with both sides documented, never
hardcoded into the product's worldview. See INTERVIEW_BANK IQ-002 for the full
framing.
