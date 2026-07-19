# GuideRail — Claude Code Starter Kit

Drop this into your repo root. Structure:

```
CLAUDE.md                          # lean, always-loaded project memory
.claude/
  settings.json                    # hooks (guarantees) + permission allow/deny
  agents/spec-reviewer.md          # fresh-context diff reviewer
  skills/
    mv3-conventions/SKILL.md       # loads when touching manifest/worker/DNR code
    wasm-build/SKILL.md            # build + size gate + benchmark procedure
    adr-writer/SKILL.md            # ADR template & voice
    knowledge-capture/SKILL.md     # maintains the two docs below
docs/
  INTERVIEW_BANK.md                # interview Q&A (seeded with 8 real entries)
  LEARNINGS.md                     # concepts learned (seeded with 6 entries)
  adr/                             # ADRs live here (0001 fail-open, 0002 threat model first)
specs/
  README.md                        # spec template + the two-session workflow
```

## First session checklist
1. Copy kit into repo, `git add`, commit.
2. Adjust CLAUDE.md commands to match your actual package.json scripts.
3. Verify hooks fire: edit any .ts file, watch prettier/eslint run.
4. Start spec #1: the Rust-WASM benchmark spike (see validation report Phase 3).

The loop: interview → spec → plan mode → implement with hooks → spec-reviewer → evidence → knowledge-capture.
