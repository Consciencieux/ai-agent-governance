# Roadmap

[English](roadmap.md) · [简体中文](../zh-CN/roadmap.md) · [繁體中文](../zh-TW/roadmap.md)

Horizons: **Done** / **Near-term** / **Mid-term** / **Long-term**

### Done

- **Governance defect closure** — after a confirmed governance defect, search bounded sibling surfaces and inspect the relevant rule/template/generator/gate/test/release chain across repo-infra and governed-project domains. [Plan](../archive/PLAN-0029-governance-defect-closure.md)
- **Domain-level test entry** — `node tests/run-tests.js --suite <name>` / `--list` for the dev loop; `npm test` and every gate stay full ([plan](../archive/PLAN-0030-run-tests-suite-entry.md))
- **Governance lessons in the payload** — declaration-vs-mechanism gap, evidence tiers (mechanical / human-attested / unverified), test activity (vacuous tests, fact sources), enumeration re-check after moves, and CI gate completeness are now INSTALLED rules, not repo-only memory. Design: [../archive/PLAN-0028-payload-governance-lessons.md](../archive/PLAN-0028-payload-governance-lessons.md)
- **Consent evidence + change hygiene** — `stagedDigest` field binds approval to staged CONTENT (proven: approve SAFE, swap to MALICIOUS → rejected). Deletion/rename hygiene reconciled against git diff via `.governance/change-hygiene.json`. Risk-tiered enforcement (advisory/gate/human-required) documented in `coding.policy.md`. C6 review-evidence binding: `plan --review-evidence` produces a digest, `execute` refuses completed without it. All three sections of the plan delivered. Implementation: [../archive/PLAN-0027-consent-and-change-hygiene.md](../archive/PLAN-0027-consent-and-change-hygiene.md)
- AGENTS.md governance bootstrap
- Feature registry
- Governance validator
- Release workflow
- Multi-language CI templates
- Multi-agent lock enforcement — `scripts/check-lock.js` (read-only lock check, INIT copies it, validator requires it)
- Validator content checks — CHANGELOG format + manifest `artifacts[].kind` validity
- Git workflow governance — `.governance/git-policy.json` + `scripts/check-git-policy.js` (protected branches, branch-based development, no direct push)
- Agent activity audit — append-only `.governance/activity.jsonl` per-task audit trail + drift-check `activity-report` mode
- Secret scanning gate — `scripts/check-secrets.js` blocks secret-like staged content (validator gates)
- Governance score — validator `--json` outputs composite `score` (unweighted v1) + CI shields.io badge endpoint artifact
- Doc freshness — `scripts/check-doc-freshness.js` flags stale governance docs via `git log` commit dates, and derives translation freshness per source/translation pair (advisory; `--release-gate` blocks stale or draft translations)
- Doc consistency — `scripts/check-doc-consistency.js` flags cross-document contradictions (version examples, protected lists, ADR statuses, roadmap targets, links, numeric claims; advisory default; consent/protected-list/principles-index/plan-status/terminology clusters fail-closed under `--gate`/`--release-gate`, changelog coverage only under `--release-gate`)
- **Review manager** — 8th sub-skill: multi-agent deep review workflow (5 fixed domains, severity-sorted report, fix + gate verification). Design: [../archive/PLAN-0007-review-manager.md](../archive/PLAN-0007-review-manager.md)
- **Tiered review gate** — release/push risk tiering (low = lightweight only; medium = suggested deep review at approval; high = review-manager required); lightweight scripts always run. Design: [../archive/PLAN-0009-tiered-review-gate.md](../archive/PLAN-0009-tiered-review-gate.md)
- **Governed-project sync groups** — two layers: (L1) declarative `.governance/sync-rules.json` (watch/require) + checklist-driven Phase 5; (L2) `scripts/check-sync.js` mechanical verification against the actual change set. Designs: [../archive/PLAN-0008-governed-project-sync-groups.md](../archive/PLAN-0008-governed-project-sync-groups.md) + [../archive/PLAN-0010-sync-groups-mechanical-check.md](../archive/PLAN-0010-sync-groups-mechanical-check.md)
- **INIT scripted generator** — deterministic, snapshot-testable INIT generation (`scripts/generate-governance.js`); phased A → B → C. Design: [../archive/PLAN-0012-init-scripted-generator.md](../archive/PLAN-0012-init-scripted-generator.md)
- **Plan delivery gate** — `repo-tools/check-plan-delivery.js`: mechanical plan-vs-delivery reconciliation (fail-closed before archiving); anchor clauses (`— anchor: `snippet``) verify CONTENT for existing declared files, not just existence. Design: [../archive/PLAN-0026-plan-delivery-anchors.md](../archive/PLAN-0026-plan-delivery-anchors.md)
- **Plan archive gate** — canonical plan-status keywords (design/active/implemented/completed/archived) + release-scoped pending-archive gate (`--release-gate` in check-doc-consistency.js) + delivery extraction fix (`####` subsections no longer truncated)
- **Install-payload integrity gate** — tests proving copied gate scripts are self-contained (no sibling `require`) and that `init-spec.json`'s copy list matches what INIT writes
- **Consent policy rewrite** — one confirmation per change set across five sync points; plan approval demoted to intent alignment (`consent-policy-hardening` plan)
- **Governance principles index** — pointers-only index of 27 principles + a `--gate` check that keeps every row's source resolvable
- **Rule capture** — stop stated requirements from living only in chat context: the agent pre-classifies each requirement (persistent / one-off / unclear), the developer adjudicates at Phase 6, confirmed rules are written into `AGENTS.md` / `docs/rules/**`, unconfirmed ones leave a `rules_pending` trace in the activity trail. Design: [../archive/PLAN-0016-rule-capture.md](../archive/PLAN-0016-rule-capture.md)
- **Terminology gate** — glossary `Forbidden zh-CN`/`Forbidden zh-TW` columns enforced across the language trees (fail-closed in `--gate`, per-line exemptions, no-op without a glossary). Design: [../archive/PLAN-0020-doc-translation-governance.md](../archive/PLAN-0020-doc-translation-governance.md)
- **Translation freshness** — git-derived per-pair status (stale / draft / reviewed markers), `--release-gate` blocks lagging translations; no handwritten manifest. Design: [../archive/PLAN-0020-doc-translation-governance.md](../archive/PLAN-0020-doc-translation-governance.md)
- **Engineering restraint (machinery test)** — unapproved machinery must justify itself; approved requirements win; semantic seams stay legal. Design: [../archive/PLAN-0019-engineering-restraint.md](../archive/PLAN-0019-engineering-restraint.md)
- **Root-cause repair protocol + failure budget** — reproduction-first plan fields, `repairSessionId` binding, 1st/2nd/3rd failure escalation. Design: [../archive/PLAN-0018-anti-patch-development.md](../archive/PLAN-0018-anti-patch-development.md)
- **Test architecture split + coding hygiene gate** — single discovery entry plus eight domain suites (set-reconciled), gated against monolith regression and empty suites. Design: [../archive/PLAN-0018-anti-patch-development.md](../archive/PLAN-0018-anti-patch-development.md)
- **Distribution-role completeness gate** — every file under `references/` + `scripts/` carries exactly one declared role (INSTALLED / SKILL-INTERNAL), verified by `repo-tools/check-role-completeness.js` (no unclassified file, no overlap, no stale declaration, packaging boundary matches). Design: [../archive/PLAN-0021-gate-tiering-evidence-boundary.md](../archive/PLAN-0021-gate-tiering-evidence-boundary.md)
- **Scope-tiered verification + evidence tiers** — `check:docs` / `check:payload` / `check:tests` / `check:full` entries matched to change scope, with each gate's output classified as mechanical / human-attested / unverified so a green run is never read as more proof than it is. Design: [../archive/PLAN-0021-gate-tiering-evidence-boundary.md](../archive/PLAN-0021-gate-tiering-evidence-boundary.md)
- **Physical distribution boundary** — repo maintenance content can no longer ship to tarball users: repo-only files (skill-release flow, packaging script, repo-only gates) moved out of `references/` and `scripts/` into `repo-tools/` and `repo-workflows/`, which the packaging step cannot reach. Role gate reverse check + complete tarball-manifest equality test keep declarations and packaging the same fact. Design: [../archive/PLAN-0024-repository-boundary-split.md](../archive/PLAN-0024-repository-boundary-split.md)
- **Release flows split by audience** — `release.md` is governed-project-release only; this repo's own flow lives in the self-contained `repo-workflows/skill-release.md` (SemVer judging, tiered review and transactionality carried inline). Design: [../archive/PLAN-0024-repository-boundary-split.md](../archive/PLAN-0024-repository-boundary-split.md)
- **INSTALLED content made project-portable** — rule text in the shipped payload no longer mixes audiences: no `npm run` commands in projects without package.json, no skill-repo docs paths, no unconditional trilingual obligations, no dangling pointers. Design: [../archive/PLAN-0022-content-audience-portability.md](../archive/PLAN-0022-content-audience-portability.md)

### Near-term

- **Multi-agent coordination protocol** — standardized coordination across concurrent agents (lock check already shipped; review-manager's parallel subagents are its first real use case). *No design plan yet*
- **Remote governance dashboard** — observability for governed repositories (dependencies: activity audit trail + score, both already shipped). *No design plan yet*
- **Monorepo multi-governance domains** — validator multi-root resolution + multiple manifests (only when real monorepo demand appears). *No design plan yet*

### Deferred release-safety decisions

Adjudicated, recorded, and deliberately not implemented. Check this list before any
release-related task: these are known gaps in what a green gate actually proves.

- **Review-evidence binding** — Status: **resolved** (v0.14.1+). `plan --review-evidence <file>` binds a SHA-256 digest of the review artifact into the proposal; `execute` refuses `reviewStatus: completed` without that digest (format-validated as 64-char hex). The `explicitly-approved` path stays digest-free by design (human explicitly owns the risk). The self-attested gap that this item tracked is closed — a signed tag now implies a digest-backed review artifact existed at proposal time. Reference: [../archive/PLAN-0023-gate-repair-and-ssot-alignment.md](../archive/PLAN-0023-gate-repair-and-ssot-alignment.md) § C6

### Mid-term

- **Demo repository** — a real governed example project showing the governance artifacts in action (mid-term; until then this repo serves as a *lightweight-governance* reference: release flow + plans/archive + ADRs + tests, but NOT a full governed software project — its validator runs in default mode fail by design). *No design plan yet*
- **Ecosystem polish** — IDE extension (governance-aware editor integration; trigger on real user demand) + Cursor compatibility field testing (verify the documented .cursor/rules compatibility; trigger on mechanism changes or reported issues). *No design plan yet*

Note: design plans for unimplemented features live in each language tree's `plans/` ; completed TASK plans are archived into `docs/archive/` at release. Governed projects track their own development plans in `docs/plans/DEVELOPMENT_PLAN.md` (generated by INIT).

**Maintenance rule (rolling re-baseline, at each release):**

1. **On completion** — move the item to `Done` (done items carry no horizon label). Archive its design doc to `docs/archive/` (shared, single-language).
2. **Horizons are relative** — after removing completed items, promote the remainder: Mid-term → Near-term, Long-term → Mid-term (as demand warrants).
3. **Trigger** — the re-ordering is part of the release flow (the `release-manager` step that archives plans also re-baselines this roadmap), not an ad-hoc edit; otherwise labels go stale.
