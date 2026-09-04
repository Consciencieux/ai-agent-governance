# Anti-Patch Development and Test Architecture Governance (TASK Plan)

[English](anti-patch-development.md) · [简体中文](../../zh-CN/plans/anti-patch-development.md) · [繁體中文](../../zh-TW/plans/anti-patch-development.md)

> **Status: design plan, not implemented.** This plan governs AI behavior during repeated patching, local fixes, and failed retries; it does not treat file length itself as a quality metric.

**Target: both** — `payload` adds root-cause, escalation, and regression-evidence rules; `repo-infra` splits the test architecture, adds debt detection, records metrics, and expands tests. The two domains are listed separately under Affected Files.

### Objective

Reduce the chance that AI temporarily makes one failure green through local patches while accumulating brittle code and regressions. Make every fix a reproducible, explainable, verifiable loop.

### Current Problem

- AI tends to make the smallest textual change around the last error without a required reproduce → hypothesis → root cause → fix → regression loop.
- The same bug can receive three or four attempts, each adding compatibility branches, special cases, or test exceptions without escalating to architectural re-understanding or review.
- `tests/run-tests.js` has grown into a monolithic 2,000+ line test file; registration, fixtures, execution, and assertions are mixed, encouraging more copy-and-patch behavior.
- A failing test is not always demonstrated to fail before the fix, so a regression test may cover the patch instead of locking the original invariant.
- Existing change-hygiene rules require residue cleanup but do not turn repeated failures, patch debt, test monolith growth, and unverified hypotheses into reviewable delivery evidence.

### Proposed Solution

#### 1. Add a root-cause repair protocol

Require every medium/large bug or mechanism TASK plan to declare a reproduction command, expected failure, root-cause hypothesis, impact surface, repair invariant, regression test, and unresolved risks. The regression test must fail before the fix; if the bug cannot be reproduced, the task remains `blocked` or `design plan, not implemented` and cannot be completed through speculative patches.

Create a task-level `repairSessionId` when the bug is first reproduced; bind every later repair attempt to that ID. A failure signature is auxiliary evidence only and cannot be reset by changing the error text. Record each attempt with an ID, change scope, validation result, and failure reason. Only an explicit developer ruling that this is a new problem may close the current session and create a new ID. Store technical summaries only; never copy secrets or full conversations.

#### 2. Set a failed-attempt budget and escalation rules

- First failure: stop adding patches and re-check reproduction, call paths, and architecture boundaries.
- Second failure: expand impact-surface search and run review-manager, or obtain an explicit developer decision to change the hypothesis.
- Third failure: stop the current implementation path and re-plan; do not keep stacking compatibility branches, test exemptions, or special cases.

Count attempts by the same `repairSessionId`; failure signatures and diff similarity may assist clustering but cannot reset the budget. Only an explicit developer ruling that this is a new problem may reset the session. Success means the original regression, full gates, and relevant invariants pass—not merely that the last command is green.

#### 3. Split the test architecture while preserving the stable entry point

Keep `npm test` and `node tests/run-tests.js` as compatibility entry points, but reduce `tests/run-tests.js` to discovery, the common runner, and summary output. Split suites under `tests/suites/` by domain, such as validator, generator, policy, docs, release, and payload. Put shared fixtures and assertions in explicitly named test-support modules.

Use a ratcheted baseline: preserve test behavior and output first, then migrate in batches. Do not block the existing monolith solely because of its historical line count; prevent new growth and retain runnable domain-level entry points after each migration. Migration must be one-way: after a test moves into `tests/suites/`, delete it from the old monolith; the old file may retain only the runner, not a second test registry or implementation. CI and local commands must use one test-discovery entry point. Reconcile test IDs, counts, and results before and after each migration.

#### 4. Add a low-risk fast path

Classify simplification by impact, not line count: docs/spelling/format-only changes may use the simplified path; a single-file change with no behavior change may have one fast repair attempt; runtime, configuration, permission, data-format, and public-interface issues require reproduction and regression evidence even when one line changes. A hotfix may restore service first, but must complete regression evidence and close patch debt in a follow-up task. The fast path still follows the first-failure re-understanding and second-failure escalation rules.

#### 5. Turn quality invariants into gates

Add or extend checks for:

- every regression test mapping to a reproducible failure or invariant;
- every regression failing before the fix and passing after it; removing the fix should fail again, or boundary tests must demonstrate the fix's effect;
- every new test belonging to a registered domain suite instead of being silently appended to the runner;
- test-file baseline and abnormal suite growth being reported first, with blocking only after an agreed growth budget is exceeded;
- no replaced current-layer fact, temporary compatibility branch, ownerless TODO, or unexplained test exemption remaining;
- repeated failed attempts within one `repairSessionId` having an escalation record before completion;
- root-cause hypotheses including falsifiable causal evidence, not merely filled-in fields.

The checker verifies structure and evidence only. It must not mistake “a test exists” for proof that the root cause is correct, nor automatically judge semantic quality.

#### 6. Produce a patch-debt report

Aggregate repeated paths, repeated failure signatures, temporary branches, test exemptions, unresolved compatibility items, and monolithic-test growth into the review report or `.governance/drift-report.json`. Classify current, transition, and historical surfaces so CHANGELOG/ADR/archive history is not reported as implementation residue.

When patch debt crosses a threshold, the next related task is automatically treated as medium/large; public API, data-format, or cross-module fixes require review-manager.

#### 7. Integrate with the lifecycle and release gate

Place the root-cause protocol in lifecycle Understand/Plan/Validate/Report and put the failed-attempt and test-architecture rules into generated AGENTS.md. Daily checks report debt; release checks block open high-risk debt, stale failure records, unowned tests, and incomplete migrations.

This plan must not be satisfied by reducing coverage, deleting failing tests, widening global exemptions, or fabricating fixtures.

### Affected Files

#### Payload

- `references/policies/lifecycle.policy.md` — add root-cause repair, failed-attempt budget, escalation, and reporting rules
- `references/policies/coding.policy.md` — define patch debt, temporary branches, test exemptions, and repair invariants
- `references/templates/agents-md.template.md` — generate executable repair and escalation guidance for agents
- `references/workflows/release.md` — gate high-risk patch debt and unresolved failure records
- `references/init-spec.json` — declare new report/check artifacts if they are ultimately copied into governed projects
- `SKILL.md` — update INIT/AUDIT/RELEASE repair-loop and escalation boundaries

#### Repository infrastructure

- `tests/run-tests.js` — preserve the compatibility entry point and migrate it into the runner/summary boundary
- `tests/suites/**` — split existing tests by domain
- `tests/support/**` — centralize fixtures, runner helpers, and common assertions
- `scripts/check-coding-hygiene.js` — add patch-debt, test-ownership, and residue evidence checks (extend an already-delivered gate instead of creating a duplicate)
- `scripts/check-doc-consistency.js` — check repair-protocol and synchronized-document markers
- `scripts/check-doc-freshness.js` — report stale failure records and test documentation where applicable
- `tests/fixtures/**` — provide minimal “fails before fix, passes after fix” regression scenarios
- `docs/{en,zh-CN,zh-TW}/commands.md` — document review-manager and root-cause repair triggers
- `CHANGELOG.md` — record gate and test-architecture behavior at the release boundary

### Risks and Decisions

- A failed-attempt budget could escalate too early; the first failure only requires re-understanding, the second requires expanded review, and the third stops the current path. `repairSessionId` must be task-bound so changing error text cannot evade the budget.
- A line-count threshold can become ceremonial; use a historical baseline, growth budget, and suite ownership instead of a global 2,000-line rule.
- Test extraction can create a large noisy diff; preserve entry points, output, and test semantics first, then migrate by domain.
- Two entry points can drift dynamically; during migration there must be one test-discovery entry point and the old monolith must reject new tests.
- Root-cause fields can be made to look complete without being causal; require before/after regression and falsification/boundary evidence, with human review after the second failure.
- A fast path can be abused to bypass behavior checks; classify by impact so runtime and configuration failures are never exempt merely because the diff is small.
- Root cause, migration sufficiency, and whether a patch truly simplifies the system still require human judgment; gates prove evidence, structure, and regression execution only.
- Do not escalate every small fix into a full review; trigger review-manager for repeated failure, high-risk interfaces, or cross-module changes.
- This plan complements consent/change-hygiene: that plan governs authorization and deletion/rename evidence; this plan governs failure feedback loops and patch accumulation.

### Validation Method

- Create a fixture where the first repair fails and verify that the report requires hypothesis review instead of another patch.
- Create two consecutive failures under one `repairSessionId` and verify review-manager/developer escalation; changing the error text must not reset the count, and the third failure must block the current path.
- Verify that a new repair session requires an explicit developer ruling that the problem changed.
- After migrating `tests/run-tests.js` into a runner, `npm test`, the direct entry point, and domain suites must produce equivalent results; adding a new test to the old file must fail the gate.
- Verify that a regression fails before the fix and passes after it; removing the fix fails again or boundary tests demonstrate the fix's effect.
- Removing or bypassing a regression test, adding an ownerless exemption, or placing a test in an unregistered domain must fail the gate with the missing evidence identified.
- Verify that monolithic test files are governed by incremental growth budget and that the historical baseline does not block the entire project at once.
- Verify correct current/transition/historical debt classification and no false residue reports for CHANGELOG, ADR, or archive records.
- Complete payload self-containment, trilingual parity, `npm test`, `npm run check`, and `npm run check:all`.
