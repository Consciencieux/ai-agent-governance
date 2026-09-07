# Payload Governance Lessons Migration: Declaration-Mechanism Gap & Verification Feedback Loop (TASK plan)

> **Status: Active.** (In progress, initial state at creation.)

**Target: payload** — edits only to rule/template text under `references/`, giving governed projects lessons of the same kind this repo has proven; no new gate scripts, no test-architecture changes (`repo-infra` stays untouched). If implementation surfaces a new decidable rule needing mechanical enforcement (requiring a new script/test), this plan is split into `both` and revised.

### Task Purpose

Turn the lessons 0.13.0 onwards kept re-proving in this repo — above all the "declares one set, mechanism covers another" defect class — into rule text governed projects can follow directly, instead of repo-internal memory. Goal: an agent in a governed project can read, while writing rules/tests/CI, the judgement standard that "mechanical coverage must match the declaration", and can identify "vacuous tests" and "enumeration that asserts only a subset" as defects.

### Current Problem

- This repo hit the same defect class three times in v0.13.1/v0.13.2/0.14.0: the rule declared a set, the mechanism silently covered a subset (5 sync points verified 2, hygiene scan missed 6 gates, plan-delivery lost 2 trees, CI ran 2 of 6 gates, a shape guard disabled real protection). Each time the lesson was recorded in AGENTS.md, but **AGENTS.md is this repo's file and does not ship in the payload** — governed projects cannot read it.
- Similar "vacuous tests" (asserting a subset instead of the complete set; a test staying green after its target feature is removed) appeared in v0.13.2/0.12.0 and never reached the payload's `testing.policy.md`.
- The payload's `lifecycle.policy.md` Phase 4 already has "evidence requirement: bare commands + real output excerpts", but lacks the three-tier distinction this repo's AGENTS.md applies (mechanical / human-attested / unverified) — so a "✓ passed" in a governed project cannot distinguish "mechanical condition met" from "semantically correct".
- The payload's `release.md` already states the four version sync points for governed projects, but the judgement rule itself ("the sync-point list must agree with what is mechanically verified") does not appear as a rule.

> **Out-of-scope / already-done statement**: the CHANGELOG content boundary (record change/impact/migration, not verification process) and the CHANGELOG structure contract (canonical category headings, duplicate-heading blocking, no appending to published sections, `[Unreleased]` rebuild) were **already written into the payload and verified landed in the previous work** (`lifecycle.policy.md` §CHANGELOG 内容边界 + §CHANGELOG 结构契约; `agents-md.template.md` Content boundary; governed-project end-to-end: duplicate heading `--gate` exit 1, 10/10 landed, recorded in CHANGELOG [Unreleased]). **They are NOT part of this plan's todo** — this plan covers only the lessons still missing: D1 declaration-set ≠ mechanism-coverage, D2 re-check enumerations after moves, D3 shape guard disabling protection, D4 vacuous tests, D5 assert the complete set, D6 evidence tiers, D7 CI gate completeness.

### Proposed Solution

Governed projects already have the corresponding infrastructure (`lifecycle.policy.md` Phase 4, `testing.policy.md` test protection, `coding.policy.md` change placement, `ci.md` distributed to project CI). The solution writes the four lessons below into the EXISTING sections — no new section headings, no new scripts, no new gates; each stated as a judgement standard, not a retelling of this repo's incidents.

#### 1. Declaration-mechanism consistency (D1 + D2 + D3 merged into one section)

Write into `references/lifecycle.policy.md` after Phase 4 (verification sequence) as a section "declaration vs mechanism gap"; also add one item to "change placement & residue cleanup" in `references/coding.policy.md`.

Key points:
- What a rule declares is a set (sync points, scan targets, CI gates, checklists); the mechanism must cover the same scope. "Declared 5 places, verified 2" and "declared coverage of all source trees but the enumeration missed one tree" are the same defect class; fixing must complete the declaration or narrow the mechanism, never just change the doc.
- After a file move/rename/directory split, re-check every hardcoded directory enumeration and guard: `SCAN_DIRS`, `SEARCH_ROOTS`, role lists, scan sets, path constants. Verdict standard: mechanically prove "declared set = restored final coverage set", never by impression.
- A shape guard ("this project lacks layout X → not applicable → exit 0") must not incidentally disable real protection: the guard's trigger condition must be declared and narrow (e.g. "missing `references/init-spec.json`"), not a tree-level broad condition (e.g. "missing `references/`").

#### 2. Test activity (D4 + D5 merged into one item)

Write after "test protection" in `references/testing.policy.md`.
- Vacuous test: a test staying green after the tested feature is removed = the test does not cover the feature; assertions must target the COMPLETE target set, not a subset (enumeration assertions and subset assertions are both vacuous).
- When a change touches a gate/guard/checklist enumeration, the test must prove the condition is non-vacuous (e.g. inject a real marker/identifier proving the check actually runs), not merely assert an exit code or empty output.

#### 3. Evidence tiers (D6)

Write into the "evidence requirement" part of `references/lifecycle.policy.md` Phase 4.
- Three tiers: mechanical (marker/structure/path/regex/file existence → "mechanical condition satisfied", not "behavior correct"); human-attested (requires user involvement, e.g. release approval, translation review); unverified claim (self-administered only, no independent verification). A "✓ passed" must carry one of these tiers, otherwise verification cannot be claimed.

#### 4. CI gate completeness (D7)

Write into `references/workflows/ci.md` (the CI template file distributed to governed projects).
- If the project maintains CI, CI must run commands equivalent to the gate set AGENTS.md declares, not a subset (e.g. only `npm test` while claiming "fails CI").

### Affected Files

- `references/policies/lifecycle.policy.md` — new "declaration vs mechanism gap" section (after Phase 4) + Phase 4 evidence-tier three-way distinction
- `references/policies/testing.policy.md` — test-protection section adds vacuous-test/assert-complete-set
- `references/policies/coding.policy.md` — change placement adds the enumeration re-check item
- `references/workflows/ci.md` — CI gate completeness note
- `references/templates/agents-md.template.md` — sync only if the AGENTS.md template carries a corresponding summary (change classification/test-protection pointers); otherwise skip
- `docs/{en,zh-CN,zh-TW}/plans/` — this plan's trilingual presence (becomes single-language on archive)
- `docs/en/architecture.md`, `docs/zh-CN/architecture.md`, `docs/zh-TW/architecture.md` — layout tree if new files (expected none)

> Note: payload changes must carry a `CHANGELOG.md` [Unreleased] entry (governance/mechanism change → `Changed`).

### Risks

- **Scope creep**: 4 edits may entangle. Mitigation: independent commit prefixes (`docs(rules)`, `docs(ci)`), completed as a single TASK.
- **Retelling this repo's incident detail becomes "restatement"**, violating the "rules never restate" principle. Mitigation: state all as judgement standards; never write "what happened in 0.13.2".
- **Vague, no judgement**: if the rule becomes a slogan like "do it right", it is worthless. Mitigation: every item carries an executable criterion (e.g. "declared set = restored final coverage set").
- **Unverified benefit for governed projects**: a governed project may not have `testing.policy.md` (depends on INIT layout). Mitigation: check `init-spec.json` installs `testing.policy.md`; skip projects that don't install it.
- **Conflict with AGENTS.md's "single-language rule"**: `references/` is single-language (Simplified Chinese authoritative); all writes here are zh-Simplified. en/zh-TW only sync `commands.md` trigger words — this plan touches no trigger words, so the trilingual sync only needs to keep parity intact.

### Validation Method

1. `npm test` (full regression)
2. `npm run check` (parity/layout/consistency/hygiene/role gates)
3. `npm run check:payload` (payload scope)
4. Clean-target INIT a throwaway project (`--phase C`), verify:
   - generated `docs/rules/lifecycle.md` contains "declaration vs mechanism gap" and "evidence tiers";
   - generated `docs/rules/testing.policy.md` contains "vacuous test";
   - generated `docs/rules/coding.policy.md` contains "enumeration re-check";
   - generated `.github/workflows/` or `ci` template contains "gate completeness";
   - generated `AGENTS.md` (if the template carries a corresponding summary) contains the pointer.
5. Boundary check: `references/` has no `repo-tools/`, `repo-workflows/`, `npm run` or other repo-specific paths; `check-role-completeness --gate` green.