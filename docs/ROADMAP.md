# GuideRail — Phased Roadmap (User-Visible Outcomes)

Engineering work like the WASM spike and ADRs runs underneath Phase 1 but isn't listed, since users never see it.

## Phase 1 — Private Beta: "Study hours that work" (single child, free)

- Install the extension, set study hours, and pick one child's class/curriculum pack (CBSE, ICSE, or general homeschool at launch)
- Curriculum-aware filtering: schoolwork sites and topics just work — no false blocks on anatomy or history research
- The quiz gate: distraction sites during study hours show 3 questions from that day's actual reading instead of "Access Denied"
- Pass → visible 30-minute earned-time timer; expires automatically, no parental intervention
- Blur-by-default image safety on unknown sites
- Child-visible rules screen ("what applies to me and when") — the transparency deal from day one

## Phase 2 — Family Launch: "One dashboard, all your kids" (paid tier begins)

- Multiple child profiles (up to 5), each with their own class, curriculum, and study schedule
- Parent web dashboard: manage profiles, schedules, and site policies from your phone
- Ask-to-unlock: child requests a blocked site → parent approves/denies in one tap
- Weekly digest email per child: what they read, quizzes passed, time earned
- One-click worksheet engine: any webpage → printable worksheet + answer key (PDF)
- Adaptive quiz difficulty + grace mode (re-read and retry, never hard lockout)
- Free tier limits arrive (1 profile, 5 AI quizzes/month); Family plan unlocks everything

## Phase 3 — Community: "Your co-op, one standard" (co-op tier + geography expansion)

- Co-op shared allowlists: subscribe to a curated list your co-op lead maintains once, everyone benefits
- Co-op admin dashboard with anonymized group progress views
- More curriculum packs: UK National Curriculum, Indian state boards, values-based optional packs — driven by beta demand
- Hindi/Hinglish quiz support for the India segment; UPI/₹ pricing
- BYOK option for free-tier power users (bring your own AI key, unlimited quizzes)
- Edge browser support

## Phase 4 — Institutional: "Managed at scale" (the Securly-profile product)

- Managed deployment for schools/microschools/coaching institutes: force-installed, tamper-hardened, guest-mode and DevTools policies applied
- Fail-closed institutional profile with fast interstitial for unclassified sites
- Admin console: bulk profile provisioning, org-wide policy, aggregate reporting
- Teacher view: assign reading, see class-level quiz outcomes, push worksheets to a group
- Data-residency options (India DPDP / UK GDPR) and compliance documentation pack for admins

## Dependency Logic

Phase 1 proves the core loop with real families (the validation report's gating test), Phase 2 is where money and retention features arrive, Phase 3 converts community distribution into the co-op wedge, and Phase 4 is the institutional story — which, notably, can be demoed to Securly long before Phase 4 ships, because its hard parts (fail-closed config, managed-policy boilerplate, benchmarks) exist as ADRs and demos from Phase 1.
