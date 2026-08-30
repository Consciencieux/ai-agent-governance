# Change Placement and Residue Cleanup (TASK Plan)

[English](removal-hygiene.md) · [简体中文](../../zh-CN/plans/removal-hygiene.md) · [繁體中文](../../zh-TW/plans/removal-hygiene.md)

> **Status: implemented (2026-08-30, pending Release archive).** This plan is delivered in the current worktree; archive it under the repository release rules.
>
> **Target: both** — `payload` is delivered to governed projects (`SKILL.md`, `references/`); `repo-infra` maintains this repository's `AGENTS.md`, tests and developer documentation. The two delivery domains are separated under Affected Files.
>
> **Target version: v0.11.0 (provisional).** This is an agent-facing behavior rule; if the final work is only documentation cleanup, the Release Proposal reclassifies it under SemVer. Implementation does not directly change versions or create a release.

### Task Purpose

Establish a cross-change **placement and residue-cleanup rule**: after a change, the current normative and implementation surfaces state only current facts; compatibility and migration information lives in an explicit transition surface; reasons and historical facts live in the history layer. This keeps later agents from being misled by stale words, links, configuration, examples or contradictory descriptions after content is deleted, renamed, migrated, replaced, split or merged.

“Removal hygiene” is one case, not the whole rule. The rule must protect semantic consistency across code, configuration, tests, CI, templates, generated artifacts and the three-language documentation trees.

### Current Problem

- The original plan covered only negating footnotes after deletion/replacement; it did not cover residue from renames, moves, deprecations, migrations, splits, merges, disabled feature flags or API/data-format changes.
- “Search the old name across the repository and require zero hits” is too crude: CHANGELOG, ADRs, archived plans, migration guides, compatibility aliases and compatibility tests may need the old name. What must be zero is unexplained residue in the current normative surface.
- Updating only the single source of truth while leaving references, anchors, dynamic loading names, environment variables, test fixtures, generated artifacts or translations creates drift between “code changed” and “governance still says the old thing”.
- Removing a public interface, configuration item or data format without caller inventory, migration, compatibility window and rollback conditions can turn cleanup into an unintended breaking change.
- The current session's old content, impact surface and acceptable compatibility scope must come from actual search results; an agent must not infer that a change is “clean” from memory.

### Terms and Layers

Classify every hit by surface before deciding whether it is residue:

| Surface | Contents | May it mention the old content? |
| --- | --- | --- |
| **Current normative/implementation** | Current `AGENTS.md`, `docs/rules/**`, current architecture/feature/command docs, code, config, schemas, CI, tests and generated artifacts read by agents | Not by default; only a still-working compatibility behavior or necessary migration pointer may remain |
| **Compatibility/transition** | Deprecation/migration docs, compatibility aliases, adapters, feature-flag transition logic, compatibility tests and version-migration notes | Yes, but state purpose, scope, owner and removal condition/version; never make the old content look preferred |
| **History** | `CHANGELOG.md`, ADRs, `docs/archive/` and completed-plan history | Yes; it records facts, reasons and decisions, not current execution rules |
| **Plan/review** | Unfinished plans, review reports and task reports | Yes for problem and acceptance context, but it must not be mistaken for a runtime rule; retain it as history under the archive rules |

The criterion is therefore not “zero occurrences of the old word in the repository”, but: **the current surface has no unexplained or unapproved old fact that can mislead execution; every compatibility exception has an explicit exit condition; and history is not read as a current instruction.**

### Change Types in Scope

| Change type | Required checks | Default handling of old content |
| --- | --- | --- |
| Delete/remove | References, exports, registries, routes, config, environment variables, docs, examples, tests, CI, generated artifacts, links and migration impact | Clear it from the current surface; keep the reason in history; provide migration or evidence that no migration is needed for public contracts |
| Rename/move | Imports, dynamic loading, plugin names, paths, links, anchors, command triggers, config keys, environment variables, Feature/Architecture records and three-language copies | Use the new name consistently in the current surface; keep the old name only as a declared compatibility alias or migration reference with an expiry |
| Replace/rewrite | Semantic conflict, single source of truth, examples, defaults, schemas, test assertions and generated output | Describe only the new behavior in the current surface; put old behavior in the migration/history layer, not in a negating footnote |
| Deprecate/soft-delete | Preferred path, compatibility window, warning, owner, removal version, consumer notification and tests | The old content may remain in the compatibility surface, clearly non-preferred and with an executable closure condition |
| Split/merge/restructure | Ownership, source file, cross-references, directory indexes, duplicate bodies and sync groups | Keep one authoritative source in the current surface; put the migration mapping in the transition surface |
| Disable/remove config or feature flag | Defaults, schema, environment examples, CI, deployment scripts, runtime branches, test fixtures and docs | State whether it is temporarily disabled, deprecated or fully removed; a disabled capability must not look available |
| API/CLI/protocol/data-format change | External consumers, version compatibility, serialization, rollback, migration scripts, release notes and SemVer | Never silently remove without a compatibility plan; breaking impact requires high-risk review and release classification |
| Template/generated-artifact/translation change | Source, generated files, existing-project migration, three-language structure, links and version drift | Set the source first; update projections through an explicit flow; never silently overwrite existing projects |
| Permission/security/validation-rule change | Protection scope, permission boundary, failure closure, rollback and user confirmation | “Cleanup” cannot be used to loosen limits or remove a gate |

### Proposed Solution

#### 1. Build a Change Hygiene Ledger

For medium/large changes, add a ledger alongside Affected Files in the plan; a small single-file documentation change may use a compact version in the final report. Every concept/path/interface that is removed, renamed, replaced or migrated gets one row:

| ID | Type | Old → new | Surfaces | Decision | Allowed old refs / exit condition | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| CH-01 | rename | `old` → `new` | code/docs/config | Rename everywhere; keep alias until vX | `docs/migration.md`; remove at vX | `rg` + tests |

The decision must be one of `remove`, `rename`, `replace`, `deprecate`, `retain` or `migrate`. An item without a decision, owner, exit condition or evidence is `unresolved` and cannot be declared complete.

#### 2. Before the change: discover the impact surface

Before editing, the agent must:

1. Record old names, paths, config keys, commands, schema fields, feature names and possible dynamic strings; do not search only natural-language headings.
2. Use `rg` across code, config, docs, tests, CI, templates, generated artifacts and all three language trees; separately inspect plugins, reflection, string concatenation, manifests, environment variables and script arguments.
3. Classify every hit as current, compatibility, history or `unresolved`; searched files enter Affected Files.
4. Decide whether this is “remove completely” or “compatibility migration”. If there are public callers, dynamic references or unknown consumers, default to high-risk/blocked and do not delete directly.

#### 3. During the change: update the source, then converge projections

- Update the single source of truth first, then synchronize AGENTS pointers, rule files, architecture/Feature records, code references, config, tests, CI, templates, generated artifacts and translations.
- The current normative surface states current behavior only; do not use “removed”, “no longer supported” or “this used to…” footnotes as a substitute for cleanup. If users need migration information, put it in the compatibility/migration layer with an exit condition.
- A compatibility alias, redirect, shim or adapter for a rename/move must be intentional and declared in the ledger; it must not be deleted merely to satisfy a global zero-hit search.
- Before deleting code, continue to follow deletion protection: state the reason, confirm ownership, search references, check Feature Registry impact and provide migration/rollback. Dynamic and configuration-driven paths require human verification.
- Do not copy historical descriptions from CHANGELOG, ADRs or archived plans back into current rules or prose; current docs reference the rule source instead of duplicating its body.

#### 4. After the change: run surface-specific cleanup

Validation has four parts; it is no longer one global hit count:

- **Current-surface check:** unexplained hits for old identifiers, links, anchors, config keys, commands or semantics must be zero.
- **Compatibility-surface check:** every retained hit has a reason, scope, owner, removal version/date and corresponding test or migration document in the ledger.
- **History-surface check:** CHANGELOG, ADRs, archives and plans may retain old content, but current agent execution paths must not treat them as current rules.
- **Projection-consistency check:** code/config/tests/CI/templates/generated artifacts/three-language docs have no broken links, duplicate authorities or contradictory statements.

An unclassified hit, unknown public consumer, undecided compatibility boundary, stale generated artifact or unverified migration/rollback marks the task `⚠️ Blocked` or `❌ Failed`; a negating footnote cannot hide it.

#### 5. Integrate with the lifecycle

- **Phase 1 Understand:** read architecture, Features, rules and recent CHANGELOG; identify change types and old/new items.
- **Phase 2 Plan:** medium/large plans must contain the Change Hygiene Ledger, compatibility decision, migration/rollback plan, Affected Files and Target.
- **Phase 3 Implement:** change in the order “source → references → projections” and update the ledger item by item.
- **Phase 4 Validate:** run current/compatibility/history/projection checks plus standard tests, static checks, builds and documentation gates.
- **Phase 5 Synchronize:** synchronize CHANGELOG, ADR, Features, Architecture, three-language docs and plan status; historical reasons stay in the history layer.
- **Phase 6 Report:** report removed/renamed/replaced/deprecated items, retained compatibility items and exit conditions, unresolved hits, migration/rollback results and real validation evidence.

The rule applies to small changes, but small changes may use the compact ledger. Public interfaces, permissions/security, data formats, cross-module restructuring or unknown dynamic references are large changes and require deep review.

#### 6. Rule placement and migration

The normative body lives in `references/policies/lifecycle.policy.md` (with a pointer from `coding.policy.md` when needed), and generated projects receive it through their `docs/rules/` copies. `SKILL.md` and this repository's `AGENTS.md` carry only a pointer or summary, never a duplicate full rule.

Existing governed projects do not update automatically when source templates change. On an explicit upgrade, use MIGRATE to merge lifecycle/coding rules, the agent summary and relevant generated artifacts, preserve intentional compatibility arrangements and run the target validator; a cleanup task must not silently become a repository-wide rewrite.

### Affected Files

#### Payload (delivered to governed projects)

- `references/policies/lifecycle.policy.md` — authoritative change-placement and residue-cleanup rule: four surfaces, Change Hygiene Ledger, change matrix, lifecycle integration and validation criteria
- `references/policies/coding.policy.md` — point Code Modification / Deletion Protection to the general change ledger and add rename, migration, deprecation and public-contract checks
- `references/templates/agents-md.template.md` — add a concise pointer/summary: search impact before changes, separate current/compatibility/history surfaces and leave no unexplained residue; do not copy the full matrix into the template
- `SKILL.md` — add only an entry pointer to the authoritative lifecycle/coding policy (no duplicate body; if an existing pointer is sufficient, leave this file unchanged)

#### Repo-infra (maintained in this repository)

- `AGENTS.md` — add an executable pointer for contributors in this repository; respect payload/repo-infra separation and do not restate the full rule
- `tests/run-tests.js` — contract tests for current-surface zero residue, compatibility metadata, dynamic references/links, generated/three-language synchronization and migration compatibility
- `docs/en/anti-regression.md`, `docs/zh-CN/anti-regression.md`, `docs/zh-TW/anti-regression.md` — update the developer mechanism map with the broader change types
- `docs/en/lifecycle.md`, `docs/zh-CN/lifecycle.md`, `docs/zh-TW/lifecycle.md` — update the lifecycle summary to point to the complete change ledger rule
- `docs/glossary.md` — add trilingual entries first if terms such as Change Hygiene, compatibility surface or historical surface are introduced
- `CHANGELOG.md` — record the behavior change under `[Unreleased]` as `Changed`; do not create a separate version entry for every business cleanup

The three plan copies must stay synchronized. Add `docs/en/commands.md`, `docs/zh-CN/commands.md` and `docs/zh-TW/commands.md` only if a trigger word or sub-skill changes; this plan adds no prompt. At release, follow the Release flow for version sync, plan archiving and roadmap re-baselining; do not perform those operations automatically during implementation.

### Risks and Mitigations

- **The rule is too broad and makes agents afraid to edit:** classify by change type; block only unclassified, public-contract or security/permission risks, and use a compact ledger for small explicit changes.
- **Global zero-hit search deletes compatibility/history evidence:** search the whole repository but validate by the four surfaces; every compatibility exception needs an exit condition.
- **Dynamic references are missed:** make strings, plugin registration, manifests, environment variables, script arguments and generated artifacts mandatory search surfaces; block when consumers cannot be confirmed.
- **A deletion becomes an accidental breaking change:** public API/CLI/protocol/data-format changes require caller inventory, migration, rollback and SemVer classification.
- **Multiple authorities diverge:** update the source first, then projections; AGENTS/SKILL/docs contain summaries or pointers, not duplicated bodies.
- **Compatibility residue lasts forever:** every alias, shim, old config or deprecation item needs an owner, removal version/date and test; a later cleanup task closes it when due.
- **Security gates are removed as “cleanup”:** permission, security, deletion-protection and validation changes continue through governance-file protection and high-risk review; this rule cannot lower the bar.
- **Three-language/generated-project drift:** validate source docs, three-language docs and existing-project migration separately; the generator never overwrites existing files.

### Acceptance and Validation Method

#### Automated/contract tests

- The ledger represents `remove`, `rename`, `replace`, `deprecate`, `retain` and `migrate`; an item without a decision or evidence cannot be marked complete.
- Current-surface hits for old symbols, paths, links, anchors, config and semantics are reported; legitimate historical hits in CHANGELOG/ADR/archive are not reported as residue.
- A compatibility hit without an owner, removal version/date, migration note or test fails; complete metadata passes.
- Simulate deletion, rename, replacement, deprecation, feature-flag disablement, split/merge and API/data-format changes, checking references, config, tests, CI, generated artifacts and docs synchronization for each.
- Dynamic string/plugin/manifest/environment-variable fixtures are found; unknown public consumers or unclassified hits enter `Blocked`.
- Old templates/state/activity records and existing governed projects remain readable after the MIGRATE fixture; existing files are not automatically overwritten.

#### Agent behavior acceptance (dogfood)

Construct one task that deletes an internal documentation section, renames a config key, keeps a compatibility alias with a removal version, deprecates a public command and moves a generated template. Verify:

1. Before editing, the agent reports old/new items, surfaces, decisions and Affected Files.
2. The current surface contains only current names and behavior; the compatibility surface states purpose, owner and exit condition; history retains the reason; no “removed/no longer…” footnote is added to current rules.
3. An unclassified hit, unknown dynamic reference or incomplete migration prevents a completion claim and records the blocker.
4. Repeating the run creates no duplicate authority; generated artifacts and three-language docs remain consistent.
5. Public-contract or security-rule changes produce separate review/confirmation evidence, migration or rollback evidence and the correct version classification.

#### Repository gates

- Run `npm test` and `npm run check` in this repository; do not run or fabricate a passing result from the default `scripts/verify_governance.js` here.
- After changing `references/`, scripts or trilingual docs, run `docs:parity`, `docs:layout` and `check-doc-consistency.js`, recording real output.
- Run one `rg` impact review, explain every unclassified hit and compare `git diff --name-only` with the plan's Affected Files and Target.
- The plan-delivery gate must pass before the Release flow archives the plan; preserve historical records and do not copy history back into the current normative surface.

---
