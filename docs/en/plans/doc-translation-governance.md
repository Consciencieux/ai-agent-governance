# Doc Translation Governance Upgrade: Terminology Gate and Translation Freshness (TASK Plan)

[English](doc-translation-governance.md) · [简体中文](../../zh-CN/plans/doc-translation-governance.md) · [繁體中文](../../zh-TW/plans/doc-translation-governance.md)

> **Status: implemented, pending archive.** This plan upgrades the trilingual documentation from "structural sync" to "terminology constraints + Git-derived freshness", fully mechanically reconciled: the sources of truth remain the source docs and the glossary, every status is derived, and no handwritten manifest, TMS, or runtime i18n is introduced.

**Target: both** — `payload` extends two already-shipped scripts (check-doc-consistency.js, check-doc-freshness.js) and syncs their behavioral descriptions in the lifecycle and sub-skill templates; `repo-infra` extends the glossary, the tests and this repo's docs. Both domains are listed separately under Affected Files.

### Task Purpose

Structural parity proves the three trees "look alike", not that the translation is right. This session has already produced real defects the structural gate could not catch: `協議/協定` mixing, `審核一下/审核一下` drift, simplified characters leaking into zh-TW docs. Without restructuring directories, adopting a TMS, or pulling in CLDR/ICU, this plan adds the first mechanical line of semantic governance: terminology constraints + translation freshness.

### Current Problem

- What is checked is structural identity, not translation identity: mistranslations, missing translations, term drift, and simplified-char leaks in zh-TW have no mechanical detection.
- There is no translation status model: a translation may be outdated after the source doc is updated, and the gate still passes. The existing freshness check compares "docs vs code activity", not "source doc vs translation" relative freshness.
- The two rules "sync all three languages in one change" and "drafts may defer translation" have no mechanical state between them; compliance is entirely left to agent discipline.

### Proposed Solution

#### 1. Terminology gate (first priority)

- `docs/glossary.md` gains two optional columns, `Forbidden zh-CN` and `Forbidden zh-TW` (semicolon-separated variants, empty by default): each concept may register forbidden renderings, e.g. the protocol row records `協議` under Forbidden zh-TW.
- Extend `scripts/check-doc-consistency.js`: scan the three doc trees; a zh-CN doc hitting a Forbidden zh-CN variant or a zh-TW doc hitting a Forbidden zh-TW variant is reported (kind `terminology_usage`). glossary.md itself is skipped. A line-level exemption `<!-- i18n: allow <term> -->` is supported.
- Enforcement: fail-closed under `--gate`/`--release-gate` (always-on via npm run check). The gate guarantees term consistency only — it does not judge whole-passage translation quality; it is the first layer of semantic governance, not a machine-translation quality evaluator.

#### 2. Git-derived translation freshness (second priority)

- Extend `scripts/check-doc-freshness.js`: match path pairs (docs/zh-CN/X.md → docs/en/X.md, docs/zh-TW/X.md) and compare each pair's last commit time (`git log -1 --format=%ct`, continuing the script's existing no-mtime design).
- Verdict: `sourceCommit > translationCommit → stale`; `sourceCommit ≤ translationCommit → translated`.
- Two boundaries: ① uncommitted source changes (via `git status`/diff on top of `git log`) → translation treated as stale; ② source and translation committed together only proves "synchronized commit", not translation correctness.
- `draft` is expressed in front matter (`<!-- i18n-status: draft -->` at file head); it may only bypass outside release phases; under `--release-gate` both stale and draft block.
- Enforcement: advisory daily (continuing the script's exit-0 convention); fail-closed under `--release-gate`. Governed projects have no trilingual trees → the check no-ops naturally; payload compatibility is guaranteed by tests.

#### 3. Section ID alignment (follow-up iteration, NOT implemented in this plan)

Recorded direction: annotate stable section identifiers (`<!-- i18n-section: X -->`) and require only ID-set equality across the three trees, relaxing the strict list-count/table-size equality to reduce structural-parity false positives. Starts only after the terminology gate and freshness have landed and stabilized.

### Affected Files

#### Payload

- `scripts/check-doc-consistency.js` — terminology gate (kind `terminology_usage`, advisory/`--release-gate` dual strength)
- `scripts/check-doc-freshness.js` — translation freshness (path pairs + uncommitted source changes + draft front matter)
- `references/policies/lifecycle.policy.md` — advisory-layer description update (freshness gains a release-gate blocking strength)
- `references/templates/sub-skills.md` — standard validation sequence description sync
- `references/workflows/release.md` — Phase 4 step 3 wires in `check-doc-freshness.js --release-gate`

#### Repo infrastructure

- `docs/glossary.md` — new Forbidden zh-CN / Forbidden zh-TW columns (term authority extension)
- `tests/run-tests.js` — term hit/exemption/no-glossary no-op; freshness stale/translated/uncommitted-source/draft/release-gate blocking; payload no-trilingual-tree no-op
- `AGENTS.md` — gate-cluster description syncs the terminology gate
- `docs/{en,zh-CN,zh-TW}/architecture.md` — in-tree comments for check-doc-consistency.js and check-doc-freshness.js
- `docs/{en,zh-CN,zh-TW}/roadmap.md` — consistency and freshness line updates
- `CHANGELOG.md` — records the behavioral change at the release boundary
- `SKILL.md` — embedded manifest version examples synced with the release (0.11.2 → 0.11.3)
- `docs/en/commands.md` — trigger realignment catch-up, recorded via an i18n-reviewed marker
- `docs/zh-TW/commands.md`, `docs/zh-TW/bootstrap-output.md`, `docs/zh-TW/skill-discovery.md`, `docs/zh-TW/plans/skill-lifecycle-management.md` — simplified-char leaks fixed via the terminology registration scan

### Risks and Decisions

- Historical translations were not necessarily kept in sync: enabling the release gate may surface a backlog of stale translations at once. Mitigation: observe advisory reports for one cycle, fix or draft-mark before release.
- Simplified trigger words (e.g. `审核一下`) are source-form references inside zh-TW docs: forbidden renderings register conceptual terms only, never trigger words; where a term must still be registered, the line-level exemption covers it.
- The terminology gate may flag legitimate contexts: forbidden renderings are registered per concept, not via global word-frequency rules; false positives are explicitly resolved with line-level exemptions.
- Same-commit sync ≠ semantic correctness: the report wording says "synchronized commit" only, never a translation-quality claim.
- Payload compatibility: governed-project shapes have no trilingual trees and no glossary; both checks must no-op without changing existing exit-code semantics.

### Validation Method

- Terminology gate: zh-TW doc contains `協議` while the glossary registers that forbidden rendering → advisory report, `--release-gate` exit 1; exemption comment suppresses; governed shape without glossary no-ops.
- Freshness: source newer than translation → stale; same-commit → translated; uncommitted source → stale; front-matter draft → bypasses daily, blocks `--release-gate`.
- Mutation testing: reverting the terminology check or the freshness verdict fails the corresponding tests.
- After updating the trilingual trees and payload copy invariants, `npm test`, `npm run check`, `npm run check:all`, and `--release-gate` all pass.

---
