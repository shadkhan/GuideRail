# 0012. The parent PIN is PBKDF2-hashed with an attempt lockout — a speed bump on unmanaged devices, not a vault
Date: 2026-07-22 | Status: Accepted | Supersedes: — | Superseded by: —

<!-- Acronyms (first use): PIN = Personal Identification Number; PBKDF2 =
     Password-Based Key Derivation Function 2; ADR = Architecture Decision
     Record; UI = User Interface. -->

## Context
Spec 007 adds a parent PIN gating the settings page, and per-family settings
(pack, study hours, gate-list, pause) that live in `chrome.storage.local`. The
uncomfortable truth (already named in ADR-0002 and ADR-0005): the adversary may
be a child who controls the device, and on an unmanaged Chrome profile
`chrome.storage` is readable and writable via DevTools. A 4–6 digit PIN is a
space of only 10^4–10^6, and the settings it guards are editable out-of-band
regardless of the PIN. So the decision is not "how do we make this secure" — it's
"what honest, proportionate protection do we ship, and how do we say what it
is not?" This ADR also settles that settings mutations never touch storage from
UI code directly (R7).

## Decision
We will store the PIN as **PBKDF2-SHA-256 over a random 16-byte salt, 150,000
iterations** — never plaintext — verified worker-side; the page never sees the
hash. Brute force is bounded by an **attempt lockout**: after 5 wrong tries a
5-minute cooldown. (Spec R5 says "alarms-based"; we instead store an `until`
timestamp checked on every verify — the more robust equivalent that survives the
ephemeral worker without a scheduled fire, exactly as the spec-005 quiz grace
lockout does. Nothing needs to *happen* at cooldown-end; the check is correct
whenever it's read.) There is **no
recovery** — a forgotten PIN means re-onboarding (Q1). Every settings mutation
goes through a typed `settings.update` / `pin.*` message to the worker, which is
the only writer of `config.*` storage (R7): the options and rules pages never
call `chrome.storage.set`. We will state the limitation in the UI itself (the PIN
step says, in plain words, that this is a speed bump a determined child can
bypass) rather than implying a security guarantee we can't keep.

## Alternatives considered
| Option | Why rejected (one honest sentence) |
|---|---|
| Store the PIN in plaintext (or a fast unsalted hash) | Trivially recovered from storage; PBKDF2+salt at least makes the small digit space costly to brute-force and doesn't leak the PIN verbatim. |
| Longer/alphanumeric password | Real friction for a parent on a shared home laptop for near-zero gain, since the guarded settings are editable out-of-band anyway — the lockout, not entropy, is the control. |
| Server-verified PIN / accounts | No backend in Phase 1; and a server check still can't stop local storage edits, so it would add infrastructure without closing the actual gap. |
| Let the UI write settings directly to chrome.storage | Scatters writes and invites ad-hoc/untyped mutations — the exact class of bug the message schema exists to prevent (R7, ADR-0002). |
| A PIN email-recovery flow | Requires accounts/email infra (Phase 2); "no recovery, re-onboard" is the honest beta answer (Q1). |

## Consequences
- **Positive:** The PIN is never stored in plaintext; the lockout makes online
  guessing impractical (5 tries / 5 min); the settings write path is a single
  typed choke point in the worker (greppable, testable), so no UI code can
  silently corrupt config; the limitation is disclosed to the parent in the UI,
  not buried. PBKDF2/verify/lockout logic is unit-tested, and the worker
  handlers are integration-tested (set → verify → 5-attempt lock).
- **Negative / accepted debt:**
  - **Forgeable on an unmanaged device — stated plainly.** The PIN gates the
    settings *UI*, not the settings *data*, and there are two bypasses, both
    accepted: (1) **message replay** — the worker's `settings.update` handler
    applies any well-formed mutation without checking a verified-PIN state, so a
    child who can open the extension's service-worker console can send a
    `settings.update` message directly and change study hours / pause protection /
    swap the pack with *zero* PIN knowledge. This is strictly easier than (2)
    editing `config.*` in `chrome.storage.local` via DevTools. And the 10^4–10^6
    PIN space is small if the stored hash is exfiltrated and cracked offline (150k
    PBKDF2 iterations slow but don't stop it). We deliberately did NOT add a
    worker-side unlock gate, because on an unmanaged profile that gate is itself
    editable (storage.session), so it would be security theatre contradicting this
    ADR's honesty — real enforcement is the managed/force-installed profile of
    Phase 4. Same posture as ADR-0005 and IQ-007 — consistent, and honest.
  - **No PIN recovery** — a forgotten PIN costs the parent a full re-onboard;
    acceptable for beta, revisited when accounts exist.
  - **150k PBKDF2 iterations** cost ~tens of ms per verify; fine for an occasional
    settings unlock, not for anything hot-path.
- **Revisit when:** the Phase 4 managed profile lets us actually protect the
  settings data (the PIN model may then gain a server-checked or policy-locked
  component); OR accounts arrive and a recovery path becomes possible.

## Interview note
I'd open by refusing to overclaim: a 4–6 digit PIN whose stored settings live in
editable local storage is a UI speed bump, not access control — so I spent the
budget where it's honest, not where it looks impressive. PBKDF2 with a salt means
the PIN is never in plaintext and is costly to crack if the hash leaks; a 5-try
lockout on a stored timestamp (surviving the ephemeral service worker) stops
online guessing; and every settings write goes through one typed message handler
in the worker so the UI can never scribble on storage directly. Then I'd name the
gap out loud — a kid with DevTools edits the config regardless — because the
product's whole trust story is "make bypass unnecessary, not impossible," and the
real lock is the managed institutional profile, not this PIN.
