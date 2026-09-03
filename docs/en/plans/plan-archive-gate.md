# Planned Archive Gate (TASK Plan)

[English](plan-archive-gate.md) · [简体中文](../../zh-CN/plans/plan-archive-gate.md) · [繁體中文](../../zh-TW/plans/plan-archive-gate.md)

> **Status: implemented (2026-09-03).** Delivery verification (`scripts/check-plan-delivery.js`) skips design-only plans; this line is what marks it.

**Target: both** — `payload` lands the plan-status contract and release-gate wiring in governed-project artifacts (`references/`, plus the INIT-copied `scripts/check-doc-consistency.js`); `repo-infra` maintains this repository's gate cluster, the delivery-gate extraction fix, tests, and trilingual docs sync. Both delivery faces are listed under Affected Files.

**Target version: v0.12.0 (provisional).** A canonical plan-status contract plus a release-scoped gate is a new payload capability (minor), not a patch; the Release Proposal re-judges per SemVer at release time. Implementation does not change versions or create releases.

### Task Purpose

Stop the recurring release miss where a completed TASK plan stays in `docs/*/plans/` un-archived, and give plan completion a machine-queryable progress view. Completion is currently inferred from hand-written prose with nothing failing when the inference is wrong; make "implemented but not yet archived" a mechanically detectable state enforced at release time — forgettable in prose, not bypassable in the gate.

### Current Problem

- Plan completion is prose-only: status lines vary across at least eight phrasings (`implemented`, `Completed (2026-08-29)`, `已实现，已归档`, `已实现（v0.6.0，已归档）`, `设计计划，未实现`, …). No canonical machine-readable value.
- The archive step (`references/workflows/release.md` Phase 4 step 4) is a checklist item the executor must remember; no gate forces it.
- `scripts/check-plan-delivery.js` verifies declared files but only by exclusion — a plan is in scope unless design-only. It never reports "a plan says implemented yet still sits in `plans/`"; from the gate's perspective archiving is optional.
- Real case: the `v0.11.0` release committed only version-sync files; three implemented plans (`post-review-remediation`, `removal-hygiene`, `rule-capture`) stayed in `plans/` until a manual review caught it. The gates passed all along.
- Affected Files sections written with `####` subsections extract as empty in the delivery gate — `extractSection` in `scripts/check-plan-delivery.js` stops at the first `####`, so such plans pass vacuously. The archived `rule-capture.md` carries this defect, and the first draft of this very plan tripped it.
- `skill-lifecycle-management.md` (all three trees) carries no Status line at all — a state the current tooling cannot even name.

### Proposed Solution

#### 1. Canonical status keywords

The first Status/状态 line of every plan must lead with one canonical keyword; the set is a property of the gates and is identical across the three language trees:

| value | English | 简体中文 | 繁體中文 | gate treatment |
| --- | --- | --- | --- | --- |
| design | Status: design plan, not implemented | 状态：设计计划，未实现 | 狀態：設計計劃，未實作 | out of delivery scope; never a pending-archive candidate |
| active | Status: Active | 状态：Active | 狀態：Active | in flight (Phase 2 creation state); not a pending-archive candidate |
| implemented | Status: implemented | 状态：已实现 | 狀態：已實作 | pending-archive candidate while under docs/*/plans/ |
| completed | Status: Completed | 状态：已完成 | 狀態：已完成 | pending-archive candidate while under docs/*/plans/ |
| archived | Status: archived | 状态：已归档 | 狀態：已歸檔 | never flagged; archiving asserts completion |

Variants not leading with a canonical keyword are `unknown` — reported as such, never guessed. `completed` matches the existing Phase 5 convention (mark Completed at task end; archiving happens at RELEASE), so the contract codifies current behavior rather than inventing a new lifecycle.

#### 2. Release-scoped pending-archive gate

- New cluster in `scripts/check-doc-consistency.js`: scan `docs/{en,zh-CN,zh-TW}/plans/*.md`, classify each plan by canonical keyword, report `plans_pending_archive` and `plans_status_unknown`.
- Fail-closed only in a new `--release-gate` mode (the always-on gate clusters plus pending-archive), wired into `references/workflows/release.md` Phase 4 step 3. In default and `--gate` modes pending-archive is advisory: a plan may legitimately sit implemented in `plans/` between task completion and release — the documented lifecycle — so the always-on check must not go red for that window. This plan's own post-implementation state is the regression proof.
- `plans_status_unknown` stays fail-closed in always-on `--gate`: it is fixable on the spot by editing one status line, unlike pending-archive which is only resolvable at release.
- The scan degrades safely when the trilingual trees are absent (INIT installs this script into governed projects; the cluster no-ops there).

#### 3. Archive wording and trigger sync

- `references/policies/lifecycle.policy.md` records the plan-header contract; `AGENTS.md` mirrors the pointer.
- `docs/{en,zh-CN,zh-TW}/commands.md` plan-manager row gains the `archive completed plan` trigger (covered by the prompt-sync check).
- `references/workflows/release.md` states the pre-condition script-neutrally so it holds in governed projects: no plan whose status is implemented/completed may remain under `docs/plans/` or `docs/*/plans/` when the archive step runs.

#### 4. Fix the delivery gate's `####` truncation

`extractSection` in `scripts/check-plan-delivery.js` stops at the first `####` inside Affected Files, so declarations there were never verified. Change the section boundary to stop only at lower-level headings (`##`/`#`) and add a regression test with a `####`-structured section. This plan's acceptance depends on the gate reading its flat declarations; the fix keeps future subsection-style plans honest too.

#### 5. Progress visibility

`scripts/check-doc-consistency.js --json` gains a per-plan status classification (design / implemented / completed / archived / unknown) plus a pending-archive count — the machine-queryable completion-progress view this repository lacked.

### Affected Files

**Payload (ships to governed projects)**

- `references/policies/lifecycle.policy.md` — plan-header contract: canonical keyword table, meanings, archive-at-release under the release gate
- `references/templates/agents-md.template.md` — Phase 2 plan structure cites the canonical status keyword
- `references/workflows/release.md` — Phase 4 step 3 runs `--release-gate`; step 4 gains the script-neutral pending-archive pre-condition
- `scripts/check-doc-consistency.js` — new cluster, `--release-gate` mode, per-plan `--json` classification (INIT copies this script; the trilingual scan no-ops in governed projects)

**Repo-infra (this repository)**

- `scripts/check-plan-delivery.js` — `extractSection` stops only at lower-level headings; `####` content is verified
- `tests/run-tests.js` — cluster fixtures (advisory vs release-gate), unknown-status gate, trilingual keywords, extraction regression
- `AGENTS.md` — canonical plan-status convention and the release-gate step pointer
- `docs/en/commands.md` + `docs/zh-CN/commands.md` + `docs/zh-TW/commands.md` — plan-manager gains the archive trigger
- `docs/{en,zh-CN,zh-TW}/plans/skill-lifecycle-management.md` — add the design status line (normalization; prevents unknown-on-arrival)
- `CHANGELOG.md` — `[Unreleased]` Added entry

Release boundaries sync `package.json`, `SKILL.md` frontmatter, CHANGELOG and tag per the release flow; not authorized by this plan. On completion this plan is archived per repository rules (zh-CN copy wins, moved to docs/archive/plan-archive-gate.md) after passing the delivery gate.

### Risks & Mitigation

- False positives on existing prose surface as `plans_status_unknown` and get reconciled as plans pass through; the keyword set stays explicit rather than silently widening the regex.
- The release gate only works if invoked: it is wired into release.md Phase 4 step 3, and this repository's release practice runs that checklist.
- Trilingual keyword drift: the keyword table is identical in all three trees; parity and prompt-sync checks run after edits.
- Scope creep: no rewriting of every existing plan's prose; normalization covers only the no-status plan.
- The always-on gate stays green through the pre-release window by design — the enforcement point is release time, not every check run.

### Validation Method

#### Automated / contract tests

- An implemented plan under `plans/`: `--gate` exits 0 (advisory report only); `--release-gate` exits 1 with `plans_pending_archive` naming the plan.
- The same plan moved to `docs/archive/`: both modes green.
- A design plan and an archived plan: never flagged in either mode.
- An unknown status: `--gate` exits 1.
- zh-CN and zh-TW keyword variants are both recognized.
- A `####`-structured Affected Files section extracts its declarations (regression for the truncation fix).

#### Gate verification

- `npm test` and `npm run check` stay green right after this plan's own status flips to implemented — the regression proof for the release-scoping decision.
- `scripts/check-doc-parity.js` stays green after the trilingual commands.md edits.
- Real output is recorded; never claimed to "should pass".
