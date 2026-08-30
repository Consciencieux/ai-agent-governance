# AGENTS.md — 模板（生成时用 `@` 引用 docs/rules/*，保持精简 ≤150 行）

按项目替换 `{{...}}` 占位符。语言默认英文；若项目约定文档语言为中文，全文翻译并保持结构一致。

```
# {{PROJECT_NAME}} — Agent Guidelines

## Project Overview
{{1-sentence description}}

## Development Commands
Run these bare, without wrapping:
- Test: `{{TEST_CMD}}`
- Lint: `{{LINT_CMD}}`
- Build: `{{BUILD_CMD}}`
- Governance check: `{{npm run governance-check | uv run scripts/check_governance.py | ...}}`

## Documentation Map
Docs live under `docs/`; agents discover new files by listing the directory.
Do NOT maintain a fixed inventory here. Two docs are mandatory and must stay fresh:
- `docs/ARCHITECTURE.md` — system architecture, ADRs, component registry
- `CHANGELOG.md` — completed changes

**Content classification (where new content goes):**
- **Runtime rules** live only in `AGENTS.md` + `docs/rules/**` (single source of truth) — the rules the agent must obey.
- **Everything else under `docs/`** (README, feature docs, plans, architecture) is project knowledge — reference the rules, never restate them. When adding a new doc, ask "is this a rule the agent must obey, or knowledge?" Rules → `docs/rules/**`; knowledge → the appropriate `docs/` location.

**Change hygiene:** for removal, rename, move, replacement, deprecation, split/merge, configuration/API/data-format or generated-artifact changes, search the full impact surface before editing. Keep current behavior in the current layer, intentional compatibility in a transition layer with an owner and removal condition, and reasons in history. No unexplained residue, duplicate authority or broken projection may remain.

## Agent Operating Lifecycle
All agents MUST follow this lifecycle for every dev task. Scope tiers: small (single file, <50 lines, no public-interface change) runs Understand → Implement → Validate → Report only; medium/large run the full lifecycle with a TASK plan. Full detail: @docs/rules/lifecycle.md
- **Phase 1 Understand**: read AGENTS.md, docs/ARCHITECTURE.md, docs/features/, recent CHANGELOG.md before acting.
- **Phase 2 Plan**: medium/large changes MUST first create `docs/plans/TASK_<name>.md` (Status, Task Purpose, Current Problem, Proposed Solution, Affected Files, Risks, Validation Method). Affected Files must be based on reference search (`rg`), not guesswork.
- **Phase 3 Implement**: respect architecture, keep backward compatibility, do not restructure without reason. Before touching any public interface/module/file, search its references first and include the found files in the plan. Maintain the Change Hygiene Ledger for old/new names, paths, config keys, commands and dynamic references.
- **Phase 4 Validate**: run tests, lint, build; record real output.
- **Phase 5 Synchronize Knowledge** (medium/large only): update CHANGELOG.md (at merge/release boundaries, not per commit), Feature Registry, ARCHITECTURE.md (if changed), check off the corresponding milestone in docs/plans/DEVELOPMENT_PLAN.md (if one exists), and set the completed TASK_<name>.md Status to Completed. Reconcile sync groups per `.governance/sync-rules.json` — a watch hit without its required files = task not done; run `node scripts/check-sync.js` (exit 0 required). Run Rule Capture before writing: developer-confirmed persistent requirements only; one-off requirements are not written; unclear/unconfirmed items remain in `state.json.rule_capture` and block completion. Archiving happens at RELEASE, not here.
- **Phase 6 Report**: modified files, new features, deleted/renamed/replaced/deprecated content, Change Hygiene Ledger results, captured/pending rules, validation results and doc updates. Compare actual changed files against the planned Affected Files list — listed-but-unchanged → fix or justify; changed-but-not-listed → explain.
- Forbidden: changing code without updating project knowledge.

## Changelog Workflow
Plans go in `docs/plans/`; completed changes go in `CHANGELOG.md`. No overlap. On release, move entries into a version section and bump the version.
Change classification: doc-only → no entry; bug fix → Fixed; new capability → Added; architecture/behavior/breaking → Changed.

## Versioning
SemVer: MAJOR.MINOR.PATCH — breaking → MAJOR, feature → MINOR, fix → PATCH.

## Definition of Done
Code + tests + all quality gates + CHANGELOG + docs sync. Anything missing = not done.

## Dependency Management Rules
Add dependencies only via the project package manager and state the purpose. Heavy dependencies need user confirmation.

## Code Modification / Deletion Protection
Before touching existing code, always:
1. **Context Analysis**: check AGENTS.md, ARCHITECTURE.md, docs/features/, CHANGELOG.md, git history.
2. **Determine Code Ownership**: registered feature? core architecture? test-covered? depended on by other modules?
3. **Before Deletion**: never delete directly — explain why, what it does, search all references, check Feature Registry impact, provide migration.
4. **Breaking Changes**: removing modules, changing public APIs, altering data structures, swapping core deps, changing architecture layers MUST be recorded and reflected in ARCHITECTURE.md, Feature Registry, CHANGELOG.
- Forbidden: deleting code because it "looks unused"; be extra careful with dynamic invocation / plugin / config-driven code.

## New Code Registration
Every new module/service MUST be registered in the component registry table in `docs/ARCHITECTURE.md` (name, responsibility, dependencies, entry). If it forms a new feature, register in `docs/features/`. Unregistered = task incomplete.

## Do Not
Secrets, unrelated refactors, restructuring without cause, skipping Definition of Done.

## Commit Message Convention
{{CONVENTION: e.g. Conventional Commits in <lang>}}

## Agent Permission Model
| Action | Permission |
| --- | --- |
| Read | automatic |
| Create Documentation | automatic |
| Modify Code | allowed, must validate |
| Modify 3+ Files at Once | confirmation required |
| Delete Code | confirmation required |
| Dependency Change | confirmation required |
| Git Commit / Git Push | one confirmation per change set (see Git Write Policy) |

## Rule Priority System
1. System / Platform Safety → 2. Explicit User Request → 3. Governance Integrity → 4. AGENTS.md → 5. docs/rules/ → 6. Existing Code Convention
Note: users may request governance changes via explicit instruction (through the Governance File Protection flow), but ordinary tasks may not implicitly bypass governance rules. "Edit AGENTS.md" triggers the protection flow, not a normal override.

## Git Write Policy
- Auto: `git status`, `git diff`, `git add <specific files>`, `git checkout -b` / clean worktree switches
- Confirm (destructive / out-of-sequence): `git add .`, `git rm`, `git restore`, `git tag`, `git reset`, `git rebase`, `git revert`, `git merge`, `git stash`, `git pull` (can trigger merge/rebase), `git clean`, `git commit --amend` of a pushed commit (counts as force push), checkout carrying uncommitted changes
- **One confirmation per change set.** After any task, before committing: echo the full git command sequence (files to add, each commit message with its type prefix, push target), wait for one explicit confirmation covering `add` → `commit` → `push`. A user's write instruction ("push", "commit these changes") triggers this echo — it is NOT the consent itself. No per-step re-asking.
- **Plan approval is intent alignment** — aligning "what to change / how", not a commit authorisation. Size tiering decides whether a plan document is written, never whether the user confirms the commit.
- **Hard constraints:** the echo IS the sequence (never deviate from it); a step fails → stop and report (never retry differently, never improvise); push rejected (non-fast-forward) → stop and report (never pull/rebase yourself); task-level phrasing ("wrap it up", "finish the task") is NOT a write instruction; ambiguous ("提交一下") → ask first.
- Before any `git commit`: run `node scripts/check-secrets.js` — exit 0 required (never commit secret-like material). After a sync-group-triggering change, run `node scripts/check-sync.js` — exit 0 required (watch/require pairs must be reconciled).
- Release sequence: a Proposal approved at the Approval Gate covers that one release's write ops; no per-step re-asking.
- Full detail: @docs/rules/git-policy.md

## Git Workflow Governance
- Before starting work run `scripts/check-git-policy.js`; on a protected branch with `directPush: false` (see `.governance/git-policy.json`), create a feature branch `feature/agent-<YYYYMMDD>-<summary>` first.
- Flow: feature branch → implement → test → commit → push branch → PR → human approval → merge into the protected branch.
- Never force push; never push directly to protected branches. Small single-file doc/typo changes may skip the branch, but must be reported.

## Governance File Protection
Modifying AGENTS.md, CLAUDE.md, docs/rules/**, .governance/manifest.json, .governance/preflight.json, .governance/git-policy.json, .governance/sync-rules.json, scripts/verify-governance.js, scripts/check-lock.js, scripts/check-git-policy.js, scripts/check-secrets.js, scripts/check-sync.js, .githooks/pre-commit, .githooks/commit-msg, opencode.json, or CI config (.github/workflows/**, .gitlab-ci.yml) requires: reason → CHANGELOG update → bump `.governance/manifest.json` governance_version → run verify-governance.js. Never loosen permission limits or remove validation without explicit user approval.

## Mandatory Pre-commit Checklist
CHANGELOG must be updated before push/PR. No CHANGELOG update → no push.
```
