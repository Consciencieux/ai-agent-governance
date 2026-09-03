# Consent and Change Hygiene Automation (TASK Plan)

[English](consent-and-change-hygiene.md) · [简体中文](../../zh-CN/plans/consent-and-change-hygiene.md) · [繁體中文](../../zh-TW/plans/consent-and-change-hygiene.md)

> **Status: design plan, not implemented.** This plan defines verifiable evidence for user consent and deletion/rename/migration hygiene; it does not infer human intent.

**Target: both** — `payload` adds runtime validation and generated-project contracts; `repo-infra` adds tests, documentation, and release integration. The two domains are listed separately under Affected Files.

### Objective

Make high-impact Git operations and deletion/rename changes machine-auditable while preserving human approval for decisions that cannot be determined from repository state.

### Current Problem

- Consent is described as a pre-commit echo, but the system cannot prove that the approval covered the exact staged change set and command scope.
- Deletion, rename, migration, API, and generated-artifact hygiene is documented but not mechanically reconciled against the actual diff.
- Existing secret, Git-policy, sync, and governance checks do not establish a durable, change-set-bound evidence record.
- A script can verify evidence and consistency, but cannot prove that a human understood the consequences or that a migration is semantically sufficient.

### Proposed Solution

#### 1. Change-set-bound consent evidence

Extend `.governance/consent.json` with a schema containing `changeSet`, `scope`, `commandDigest`, `approvedAt`, and `approvedBy`. The pre-commit hook and release executor must reject missing, malformed, expired, or mismatched evidence. The digest binds approval to the staged diff or release Proposal HEAD; a subsequent change invalidates the evidence.

Consent scope must distinguish `add`, `commit`, `tag`, `push`, and `release`. A user instruction such as “push” may trigger the confirmation prompt but is not itself evidence of approval.

#### 2. Structured change-hygiene declarations

Add a machine-readable change-hygiene record to TASK plans or `.governance/change-hygiene.json`. Each deletion or rename must declare the operation, reason, affected symbol/path, reference-search query, compatibility decision, migration or rollback evidence, and allowed historical matches.

The checker compares declarations with `git diff --name-status --find-renames`, runs the declared searches, verifies referenced migration/ADR/CHANGELOG files exist, and reports unexplained deletions, renames, stale current-layer references, and missing migration evidence.

#### 3. Risk-tiered enforcement

- `advisory`: internal changes with no public API/config/data-format signal.
- `gate`: public API/config/data-format, security, permission, or destructive changes.
- `human-required`: semantic migration sufficiency, irreversible data changes, and ambiguous compatibility decisions.

The checker must never treat the existence of a document as proof that its content is adequate. It reports evidence status and leaves the final semantic decision to the developer.

#### 4. Integration

Run consent validation immediately before commit/tag/release writes. Run change-hygiene validation during Phase 4 and before release archive/tag operations. Add the scripts to the INIT payload only after their standalone behavior and governed-project fallback are tested.

### Affected Files

#### Payload

- `scripts/check-consent.js` — validate change-set-bound consent evidence
- `scripts/check-coding-hygiene.js` — reconcile deletion/rename/migration declarations with Git state
- `references/init-spec.json` — copy and declare the new standalone scripts and consent schema
- `references/templates/githooks-template.md` — enforce consent validation before writes
- `references/templates/agents-md.template.md` — document evidence and risk tiers
- `references/policies/git.policy.md` — define consent evidence scope
- `references/policies/coding.policy.md` — define structured deletion/rename hygiene
- `references/policies/governance-files.policy.md` — protect the new gate scripts
- `references/workflows/release.md` — wire checks into Phase 4 and release gating
- `SKILL.md` — update the payload contract and validation sequence

#### Repository infrastructure

- `tests/run-tests.js` — fixtures for digest binding, scope mismatch, deletion, rename, migration, and fallback behavior
- `scripts/check-doc-consistency.js` — verify synchronized documentation markers
- `docs/{en,zh-CN,zh-TW}/commands.md` — document user-facing triggers
- `CHANGELOG.md` — record the behavioral change at the release boundary

### Risks and Decisions

- Hashes prove identity, not comprehension; consent remains human-in-the-loop.
- Requiring migration files for every internal rename would create false positives; enforcement must depend on risk classification.
- Git history may be unavailable in exported payloads; without history, the checker reports reduced assurance and does not fabricate evidence.
- Historical references in CHANGELOG, ADRs, archives, compatibility aliases, and tests need explicit allowlisting rather than a global zero-match rule.
- Do not enable automatic tag/push/release behavior; this plan only strengthens pre-write validation.

### Validation Method

- A consent record for one staged diff fails after any staged-line change.
- A consent record with incomplete scope fails before the corresponding write operation.
- Unexplained deletion and rename changes fail the high-risk gate and identify the missing declaration.
- A declared migration path that does not exist fails; an existing path is reported as evidence, not semantic approval.
- Historical-layer matches are allowed only when explicitly declared.
- No-Git and governed-project fallback behavior is deterministic and clearly reported.
- `npm test`, `npm run check`, and `npm run check:all` pass after all three language trees and payload copy invariants are updated.

---
