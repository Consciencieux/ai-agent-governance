# Roadmap

[English](roadmap.md) · [简体中文](../zh-CN/roadmap.md) · [繁體中文](../zh-TW/roadmap.md)

Horizons: **Done** / **Near-term** / **Mid-term** / **Long-term**

### Done

- AGENTS.md governance bootstrap
- Feature registry
- Governance validator
- Release workflow
- Multi-language CI templates
- Multi-agent lock enforcement — `scripts/check-lock.js` (read-only lock check, INIT copies it, validator requires it)
- Validator content checks — CHANGELOG format + manifest `artifacts[].kind` validity
- Git workflow governance — `.governance/git-policy.json` + `scripts/check-git-policy.js` (protected branches, branch-based development, no direct push)
- Agent activity audit — append-only `.governance/activity.jsonl` per-task audit trail + drift-check `activity-report` mode
- Secret scanning gate — `scripts/check-secrets.js` blocks secret-like staged content (validator 21 checks)
- Governance score — validator `--json` outputs composite `score` (unweighted v1) + CI shields.io badge endpoint artifact
- Doc freshness — `scripts/check-doc-freshness.js` flags stale governance docs via `git log` commit dates, and derives translation freshness per source/translation pair (advisory; `--release-gate` blocks stale or draft translations)
- Doc consistency — `scripts/check-doc-consistency.js` flags cross-document contradictions (version examples, protected lists, ADR statuses, roadmap targets, links, numeric claims; advisory default; consent/protected-list/principles-index/plan-status/terminology clusters fail-closed under `--gate`/`--release-gate`, changelog coverage only under `--release-gate`)
- **Review manager** — 8th sub-skill: multi-agent deep review workflow (5 fixed domains, severity-sorted report, fix + gate verification). Design: [../archive/review-manager.md](../archive/review-manager.md)
- **Tiered review gate** — release/push risk tiering (low = lightweight only; medium = suggested deep review at approval; high = review-manager required); lightweight scripts always run. Design: [../archive/tiered-review-gate.md](../archive/tiered-review-gate.md)
- **Governed-project sync groups** — two layers: (L1) declarative `.governance/sync-rules.json` (watch/require) + checklist-driven Phase 5; (L2) `scripts/check-sync.js` mechanical verification against the actual change set. Designs: [../archive/governed-project-sync-groups.md](../archive/governed-project-sync-groups.md) + [../archive/sync-groups-mechanical-check.md](../archive/sync-groups-mechanical-check.md)
- **INIT scripted generator** — deterministic, snapshot-testable INIT generation (`scripts/generate-governance.js`); phased A → B → C. Design: [../archive/init-scripted-generator.md](../archive/init-scripted-generator.md)
- **Plan delivery gate** — `scripts/check-plan-delivery.js`: mechanical plan-vs-delivery reconciliation (fail-closed before archiving)
- **Plan archive gate** — canonical plan-status keywords (design/active/implemented/completed/archived) + release-scoped pending-archive gate (`--release-gate` in check-doc-consistency.js) + delivery extraction fix (`####` subsections no longer truncated)
- **Install-payload integrity gate** — 3 tests proving copied gate scripts are self-contained (no sibling `require`) and that `init-spec.json`'s copy list matches what INIT writes
- **Consent policy rewrite** — one confirmation per change set across five sync points; plan approval demoted to intent alignment (`consent-policy-hardening` plan)
- **Governance principles index** — pointers-only index of 18 principles + a `--gate` check that keeps every row's source resolvable
- **Rule capture** — stop stated requirements from living only in chat context: the agent pre-classifies each requirement (persistent / one-off / unclear), the developer adjudicates at Phase 6, confirmed rules are written into `AGENTS.md` / `docs/rules/**`, unconfirmed ones leave a `rules_pending` trace in the activity trail. Design: [../archive/rule-capture.md](../archive/rule-capture.md)
- **Terminology gate** — glossary `Forbidden zh-CN`/`Forbidden zh-TW` columns enforced across the language trees (fail-closed in `--gate`, per-line exemptions, no-op without a glossary). Design: [../archive/doc-translation-governance.md](../archive/doc-translation-governance.md)
- **Translation freshness** — git-derived per-pair status (stale / draft / reviewed markers), `--release-gate` blocks lagging translations; no handwritten manifest. Design: [../archive/doc-translation-governance.md](../archive/doc-translation-governance.md)
- **Engineering restraint (machinery test)** — unapproved machinery must justify itself; approved requirements win; semantic seams stay legal. Design: [../archive/engineering-restraint.md](../archive/engineering-restraint.md)
- **Root-cause repair protocol + failure budget** — reproduction-first plan fields, `repairSessionId` binding, 1st/2nd/3rd failure escalation. Design: [../archive/anti-patch-development.md](../archive/anti-patch-development.md)
- **Test architecture split + coding hygiene gate** — single discovery entry plus eight domain suites (set-reconciled), gated against monolith regression and empty suites. Design: [../archive/anti-patch-development.md](../archive/anti-patch-development.md)

### Near-term

- **Multi-agent coordination protocol** — standardized coordination across concurrent agents (lock check already shipped; review-manager's parallel subagents are its first real use case)
- **Skill lifecycle management** — dedicated [`ai-skill-manager`](https://github.com/Consciencieux/ai-skill-manager) skill (INSTALL → UPDATE → ROLLBACK for all skills in .agents/skills/, including this skill). Deferred from v0.6.0/v0.7.0; revisit when the version-sync step proves insufficient. Design: [plans/skill-lifecycle-management.md](plans/skill-lifecycle-management.md)
- **Remote governance dashboard** — observability for governed repositories (dependencies: activity audit trail + score, both already shipped)
- **Monorepo multi-governance domains** — validator multi-root resolution + multiple manifests (only when real monorepo demand appears)

### Mid-term

- **Demo repository** — a real governed example project showing the governance artifacts in action (mid-term; until then this repo serves as a *lightweight-governance* reference: release flow + plans/archive + ADRs + tests, but NOT a full governed software project — its validator runs in default mode fail by design)
- **Ecosystem polish** — IDE extension (governance-aware editor integration; trigger on real user demand) + Cursor compatibility field testing (verify the documented `.cursor/rules` compatibility; trigger on mechanism changes or reported issues)

Note: design plans for unimplemented features live in each language tree's `plans/` (e.g. `skill-lifecycle-management.md`); completed TASK plans are archived into `docs/archive/` at release. Governed projects track their own development plans in `docs/plans/DEVELOPMENT_PLAN.md` (generated by INIT).

**Maintenance rule (rolling re-baseline, at each release):**

1. **On completion** — move the item to `Done` (done items carry no horizon label). Archive its design doc to `docs/archive/` (shared, single-language).
2. **Horizons are relative** — after removing completed items, promote the remainder: Mid-term → Near-term, Long-term → Mid-term (as demand warrants).
3. **Trigger** — the re-ordering is part of the release flow (the `release-manager` step that archives plans also re-baselines this roadmap), not an ad-hoc edit; otherwise labels go stale.
