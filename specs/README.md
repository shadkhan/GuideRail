# specs/ — One file per feature

The unit of work in this repo is a spec, not a prompt. Implementation sessions build FROM the spec file, never from chat memory.

## Workflow
1. **Spec session:** "Interview me about <feature> using your question tool. When we're done, write specs/<feature>.md using the template below." Review, edit, commit.
2. **Implementation session (fresh):** "Implement specs/<feature>.md. Enter plan mode first. Ask if the spec is ambiguous — spec ambiguity is a spec bug, fix the spec."
3. **Review:** "Use the spec-reviewer agent to review the diff against specs/<feature>.md."
4. Mark the spec `Status: Implemented` only after the reviewer's verdict and evidence (tests/benchmarks) exist.

## Template
```markdown
# Spec: <feature name>
Status: Draft | Approved | Implemented · Date: YYYY-MM-DD · ADRs: <links or "none needed">

## Goal (one sentence, user-visible outcome)

## Requirements (numbered, testable)
R1. ...
R2. ...

## Out of scope (explicit — the reviewer checks this)

## Acceptance criteria (how "done" is proven)
- [ ] Test: ...
- [ ] Benchmark: ... (budget: ...)
- [ ] Evidence artifact: ...

## Open questions (must be empty before Status: Approved)
```

## Rules
- A spec with no acceptance criteria is a wish, not a spec.
- If implementation reveals the spec was wrong, stop, amend the spec, then continue — the spec stays the source of truth.
