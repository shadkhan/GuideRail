# 0002. STRIDE threat model for the extension trust boundary (VU#595768)

Date: 2026-07-19 | Status: Accepted | Supersedes: — | Superseded by: —

<!-- Acronyms (first use): STRIDE = Spoofing, Tampering, Repudiation,
     Information disclosure, Denial of service, Elevation of privilege;
     ADR = Architecture Decision Record; MV3 = Manifest V3; PII = Personally
     Identifiable Information; CSP = Content Security Policy; RCE = Remote Code
     Execution; CERT = Computer Emergency Response Team; DNR =
     declarativeNetRequest. VU#595768 = a CERT vulnerability note against a
     filtering extension. -->

## Context

A filtering extension concentrates an unusual amount of trust: broad host
permissions (`<all_urls>`), managed deployment via `ExtensionInstallForcelist`,
and — later — native messaging. VU#595768, a CERT disclosure against Securly's
own extension, matters here less for the specific bug than for the **class** of
bug: the attack surface of a filtering extension is the trust boundary between
the extension and everything that can talk to it. The boundaries worth modeling
are content script → service worker, extension → backend, and the managed-policy
channel → browser. This ADR records the STRIDE pass across those boundaries and
the architectural constraints it produced — several of which are already
enforced in code (spec 002), not merely aspirational.

## Decision

We will threat-model every cross-boundary channel with STRIDE and let the
findings constrain the architecture. The load-bearing constraints:

1. **One typed message schema, validated at receipt.** The service worker never
   trusts an ad-hoc payload; the content script runs in a hostile page, so its
   messages are attacker-influenced input. Enforced today in
   `packages/extension/src/messages.ts` (runtime guards) + `service_worker.ts`
   (rejects malformed messages with a typed error).
2. **No remote code paths.** CSP is `script-src 'self' 'wasm-unsafe-eval'` — no
   remote script, no `eval`. Curriculum packs are **data** (signed, verified
   client-side per ADR-0004), never code. There is no RCE surface to hijack.
3. **PII scrubbed client-side at one choke point** (`sanitize()`, ADR-0003) so a
   compromised backend receives nothing sensitive — the server is never trusted
   with raw child data.
4. **Document residual bypass surface** rather than claim the product is
   un-bypassable.

## Alternatives considered

| Option | Why rejected (one honest sentence) |
|---|---|
| No formal threat model / ad-hoc security | The concentrated-trust bug class is exactly what informal review misses. |
| Trust content-script payloads for convenience | The content script executes inside a hostile page; its messages are attacker-influenced and cannot be trusted by shape. |
| Market the product as "un-bypassable" | Overclaiming misleads the adults doing the risk assessment — in this domain that is itself a security failure. |

## Consequences

- **Positive:** The typed boundary is enforced in code today, not just
  documented; there is no remote-script RCE surface; a breached backend leaks no
  child data because it never receives raw data in the first place.
- **Negative / accepted debt:**
  - Residual bypass surface that is **not** solvable client-side — guest or
    secondary browser profiles, alternate browsers, other devices on the network.
    These are documented for the risk-assessing adult, not hidden.
  - The managed-policy channel is a single point of fleet compromise: whoever
    controls `ExtensionInstallForcelist` controls every managed device, so
    admin-console compromise is treated as **in-scope** in the deployment docs,
    not somebody-else's-problem.
  - Repudiation is weak on unmanaged consumer devices (a determined teenager with
    DevTools can inspect extension storage) — mitigated by product design
    (earned-time is a better deal than bypassing) and, on managed profiles, by the
    `DeveloperToolsAvailability` policy. Ties to the token/revocation design
    (ADR-0005, planned).
- **Revisit when:** a new host permission or a native-messaging channel is added;
  a new CERT-class disclosure lands against a peer extension; OR the backend
  starts receiving any new payload type (re-run the `sanitize()` egress review).

## Interview note

The lesson I'd emphasize in 60 seconds: filtering extensions concentrate trust,
so the threat model is the trust boundary itself — and the honest part is
documenting residual bypass surface (guest profiles, alternate browsers, admin
compromise) instead of overclaiming, because in this domain overclaiming is a
security failure. See INTERVIEW_BANK IQ-005 for the full framing.
