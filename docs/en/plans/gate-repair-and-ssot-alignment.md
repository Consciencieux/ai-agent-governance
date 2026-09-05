# Gate Repair and SSOT Alignment (TASK plan)

[English](gate-repair-and-ssot-alignment.md) · [简体中文](../../zh-CN/plans/gate-repair-and-ssot-alignment.md) · [繁體中文](../../zh-TW/plans/gate-repair-and-ssot-alignment.md)

> **Status: design plan, not implemented.** Responds to a read-only audit (2026-09-05): several gates exist but are inert, mis-wired, or stronger than their claims — the protected-files cluster parses zero rows, `check:payload` omits the gate that guards payload edits, CI runs 2 of 6 gates, `plans:delivery` runs without `--gate`, SKILL.md frontmatter `version` is unreachable, and archived plans carry non-canonical Status lines. The same audit also confirmed five single-source-of-truth violations (three divergent release flows, an inverted undecided claim in zh-CN/zh-TW, a dead README template block, a lossy validator check list, a permission-matrix row mismatch).

**Target: both** — `payload` fixes INSTALLED script behavior (`scripts/check-doc-consistency.js`, `scripts/generate-governance.js`), `references/` content integrity (`references/templates/sub-skills.md`, `references/policies/governance-files.policy.md`, `SKILL.md`), and INIT payload coupling; `repo-infra` fixes test fixtures, npm wiring, CI, repo docs, and archive statuses. The two domains are listed separately under Affected Files.

### Objective

Make the existing gate set deliver what AGENTS.md already claims, and restore single-source-of-truth where audit proved multiple authorities. Where a known rule had no backstop at all, add the cheapest mechanical check and prove it with a negative test — no new gate class beyond what the findings require.

### Current Problem (confirmed 2026-09-05)

- **Protected-files cluster is inert.** `scripts/check-doc-consistency.js` scopes the policy table to `policy.slice(0, policy.search(/\n## /))`; in the real file the first `## ` heading (byte 217) precedes the table (byte 470), so `protectedPaths` is always empty and the whole completeness loop never runs. The cluster's only negative test uses a heading-less fixture, proving a code path that never executes in production.
- **Scope-tiered npm entries are mis-composed.** `check:payload` (the tier documented for `references/` + `SKILL.md` edits) omits `check-doc-consistency --gate` — the gate that owns the consent markers and protected-files list living in exactly those files. `check:docs` symmetrically omits `docs:layout`. Both contradict the AGENTS.md scope table.
- **CI runs 2 of 6 gates.** `.github/workflows/ci.yml` runs only `npm test` + `docs:parity`; layout, consistency, hygiene and role-completeness never fail CI. AGENTS.md's "fails CI" claim is currently false.
- **`plans:delivery` never gates.** `npm run plans:delivery` runs `check-plan-delivery.js` without `--gate`, so `check:all` does not enforce plan delivery despite AGENTS.md and release.md requiring it.
- **SKILL.md frontmatter `version:` is unreachable.** The version regex requires quoted `"version"`/`"governance_version"` forms; YAML `version: 0.13.0` never matches. One of the three version sync points has no mechanical backstop.
- **Archived plans carry non-canonical Status lines.** 21 files in `docs/archive/`: only anti-patch-development and gate-tiering-evidence-boundary carry `Status: archived`; several still say 已实现（待 Release 归档）or 状态：… and five or more have no Status line at all. The plan-status cluster scans only `docs/*/plans/`, never `docs/archive/`.
- **Release-flow markers exist in three versions with divergent coverage.** `references/workflows/release.md` (authoritative) carries 6 requirement markers; `references/templates/sub-skills.md` (the copy installed into governed projects) carries only 3 — `docs.parity_passed`, `sync.passed`, `plan.delivery_verified` are missing, as are release.md Phase 4 step 3 (three release-gates) and step 11 (packaging + upload).
- **zh-CN/zh-TW architecture pages assert a stale, inverted fact.** Both say the role-completeness gate "保持红色直到裁定——目前是 governance-files.policy.md 与 feature-doc.template.md"; the English page says both have been resolved. `init-spec.json` shows `undecided: {}`.
- **`.governance/README.md` has two templates and the policy one is dead.** `governance-files.policy.md` § .governance/README.md 生成模板 defines a Tracked/Ignored block that nothing consumes; the generator emits the `static content` variant from `references/init-spec.json`.
- **The validator check list is lossy in its installed copy.** `scripts/verify_governance.js` `DEFAULTS` lists 21 checks, including Lock check, Git policy, Git policy check, Secret scan gate, Sync groups check; `sub-skills.md`'s `governance-validator` Checks line names only artifact categories and omits those five tool checks and `.governance/git-policy.json`.
- **Permission matrix mismatch.** `references/templates/agents-md.template.md` carries a "Modify 3+ Files at Once | confirmation required" row that `SKILL.md` § Agent Permission Model (the indexed authority) lacks, although the rule is real (`lifecycle.policy.md` § 规模分级).

### Proposed Solution

#### A. Gate repair (payload + repo-infra)

##### A1. Protected-files parser — extract the table inside the policy's own scope

Replace the `slice(0, search(/\n## /))` window with extraction of the first Markdown table that appears **inside the first content section** of the policy (or, simpler and more robust: parse the first table in the file whose match falls after the intro paragraph; do NOT truncate at the first `## ` heading, because the policy's own heading precedes its table). Reshape the existing negative test fixture to the real document shape (heading + table), so the regression test exercises the production path. Keep the single-source-of-truth exemption scoped to the same section.

##### A2. npm scope-tier composition

Align `package.json` with the AGENTS.md scope table:
- `check:docs` = test + parity + consistency `--gate` + layout
- `check:payload` = test + layout + consistency `--gate` + hygiene `--gate` + role-completeness `--gate`

##### A3. CI wiring

`.github/workflows/ci.yml` gains a step that runs `npm run check` (all fail-closed gates). The `verify_governance.js` badge step keeps `|| true` (ADR-0006). Update the AGENTS.md sentence to state what is now true (gates run in CI).

##### A4. `plans:delivery --gate`

Change `package.json` `plans:delivery` to `node scripts/check-plan-delivery.js --gate` so `check:all` enforces delivery.

##### A5. SKILL.md frontmatter version check

Extend the version cluster to parse the YAML frontmatter block of `SKILL.md` (unquoted `version: X.Y.Z`) and compare against the repo's current version. Negative test: bump frontmatter only → gate fails.

##### A6. Archived-plan Status normalization

- Rewrite the Status line of every `docs/archive/*.md` to the canonical archived form (`> **Status: archived.**（已归档。归档即断言完成。）` style, per lifecycle policy). Keep the pre-archive status text as a nested note where it carries delivery information (as anti-patch-development already does).
- Extend the plan-status cluster (or add an archive-status sibling, per the frozen-responsibility rule — prefer extending the existing cluster since it is the same plan-status domain) to scan `docs/archive/` for a missing or non-canonical Status line, fail-closed in `--release-gate`, with a negative test.

#### B. SSOT alignment (payload + repo-infra)

##### B1. Sub-skill release-flow parity

In `references/templates/sub-skills.md`, bring the release-manager requirement list to the same 6 markers as `release.md` and restore Phase 4 step 3 (three release-gates) and step 11 (package + upload) with the same wording structure. Add a consistency test wiring the audit's method: extract marker sets from both files and assert sub-skills ⊇ release.md requirement markers, fail-closed.

##### B2. zh-CN/zh-TW architecture undecided claims

Replace the stale "当前是 X 与 Y" sentences in `docs/zh-CN/architecture.md` and `docs/zh-TW/architecture.md` with the resolved fact (both items are now INSTALLED artifacts; `undecided` is empty), matching the English page.

##### B3. Remove the dead README template block

Delete `references/policies/governance-files.policy.md` § .governance/README.md 生成模板 (or reduce it to a pointer to `init-spec.json` artifact `content`), keeping the policy's tracked/ignored table intact. Add the policy section to a test that asserts it does not restate a second .governance/README.md template.

##### B4. Validator check list in sub-skills.md

Complete the `governance-validator` Checks line so it enumerates all 21 checks in the same order as `DEFAULTS` (using the format of the authoritative list; no count drift).

##### B5. Permission matrix row

Add the "Modify 3+ Files at Once | confirmation required" row to `SKILL.md` § Agent Permission Model, matching `references/templates/agents-md.template.md` and `lifecycle.policy.md` § 规模分级.

### Verification (evidence tiers)

- Every fix ships with a mechanical negative test that reproduces the original failure mode on the production file/real fixture (tests prove the gate CAN red — not just that it is green).
- `npm test` (all suites) + `npm run check` + `npm run check:all` exit 0.
- Release-gate behavior of the plan-status/archive-status cluster verified with `--release-gate` on a mutated copy.
- No new gate class beyond the plan-status extension; responsibility table unchanged otherwise.

### Affected Files

**payload (INSTALLED / SKILL-INTERNAL behavior and content):**

- `scripts/check-doc-consistency.js` — A1 (protected-files table extraction), A5 (frontmatter version), A6 (archive-status scan)
- `scripts/generate-governance.js` — A5 (version sentinel stays in sync; verify no other copy diverges)
- `references/templates/sub-skills.md` — B1 (release-flow markers + Phase 4 steps), B4 (validator check list)
- `references/policies/governance-files.policy.md` — B3 (dead README template block removal)
- `SKILL.md` — B5 (permission matrix row); version frontmatter must stay synced (A5)

**repo-infra (docs, tests, wiring):**

- `package.json` — A2 (scope-tier composition), A4 (`plans:delivery --gate`)
- `.github/workflows/ci.yml` — A3 (run npm run check)
- `AGENTS.md` — A3 wording, A2 table check (already correct — verify only)
- `docs/zh-CN/architecture.md` — B2
- `docs/zh-TW/architecture.md` — B2
- `docs/archive/*.md` — A6 (21 files, Status normalization)
- `tests/suites/consistency.test.js` — A1 fixture reshape, A5 negative test, A6 negative test, B1 marker-set test
- `tests/suites/docs.test.js` — A2 composition test (package.json entry equivalence)
- `tests/support/helpers.js` — fixture helpers if shared by the new tests
- `CHANGELOG.md` — release entry
