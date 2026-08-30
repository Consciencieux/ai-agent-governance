# .governance/generated/skills/ 子技能（生成到目标项目 `.governance/generated/skills/<name>/SKILL.md`）

生成的子技能供**项目内的后续 Agent 开发任务**使用。生成后若项目用 opencode，写入 `opencode.json`：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "skills": { "paths": [".governance/generated/skills"] }
}
```

---

## 1. repository-inspection

````
---
name: repository-inspection
description: Use at the start of any task in this repo to inspect the environment. Loads project type, language, package manager, build tool, test framework, linter, git state, existing CI, and existing AI guidance files. Triggers on "inspect the repo", "what is the stack", "check environment".
---

# Repository Inspection

Run before creating or modifying anything. Use shell/glob/read tools, then fill and return this JSON:

{"projectType":"","language":"","packageManager":"","buildTool":"","testFramework":"","linter":"","gitRepo":true,"ci":"","existingDocs":[],"missingAutomation":[],"plannedChanges":[]}

Detection hints:
- package.json -> pnpm/npm/yarn (pnpm-lock.yaml / package-lock.json / yarn.lock)
- pyproject.toml -> uv/poetry/pip
- pom.xml -> Maven; build.gradle(.kts) -> Gradle; Cargo.toml -> Cargo; go.mod -> Go modules
- CI: .github/workflows / .gitlab-ci.yml / .circleci/config.yml / Jenkinsfile

Constraints:
- Never overwrite important files; merge or update existing.
- Never delete existing config without stating a reason.
- Output: JSON report above, plus the file(s) changed, if any.
````

---

## 2. ci-generator

````
---
name: ci-generator
description: Use when this repo needs CI configuration for its detected stack. Generates a GitHub Actions / GitLab CI pipeline matching the repository's package manager, test framework and build tool. Triggers on "setup CI", "add CI", "create workflow".
---

# CI Generator

Input (from repository-inspection):

{"language":"typescript","packageManager":"pnpm","test":"vitest","buildTool":"tsup","ci":"github-actions"}

Rules:
- Pipeline MUST include: install deps -> format check -> lint -> typecheck -> test -> build -> upload artifacts.
- Use the project package manager and lockfile; pin tool versions.
- If CI platform is unknown or permissions are missing -> report ⚠️ Blocked with the exact reason.
- Real config only; verify YAML validity.
````

---

## 3. governance-validator

````
---
name: governance-validator
description: Use to check that this repo's governance artifacts are intact before declaring a task complete. Runs scripts/verify-governance.js and records results into .governance/validation.json. Triggers on "governance check", "verify governance", "validate AGENTS".
---

# Governance Validator

Run: `node scripts/verify-governance.js` (or registered npm script `npm run governance-check`).

Path resolution: uses `.governance/manifest.json` artifacts when present (structure-adaptive), otherwise built-in defaults. Checks: AGENTS.md, CHANGELOG.md, ARCHITECTURE, features, plans, rules, .gitignore, .env.example, CI config, validator self, `.governance/` (dir, manifest.json, state.json, preflight.json), governance_version. `validation.json` / `drift-report.json` are runtime outputs and are NOT required.

Then update `.governance/validation.json`:

```json
{"timestamp":"<ISO>","mode":"manifest","total":0,"passed":0,"failed":0,"passedAll":false,"results":[]}
```

If any check fails -> report ❌ Failed with the missing items. Do NOT declare the task done until exit code is 0.
````

---

## 4. state-manager

````
---
name: state-manager
description: Use at the end of any agent task to persist progress into .governance/state.json. Tracks maturity, phase, agent identity, completed items and blocked items so later sessions resume correctly. Triggers on "update state", "record progress".
---

# State Manager

State machine: `understand → plan → implement → validate → synchronize → report`, plus terminal states `completed / blocked / failed`. Any phase failure → `blocked`/`failed`. On crash/recovery, read `phase` to find the resume point — never re-run completed items, never skip phases.

At the end of every task (or on interruption), update `.governance/state.json`:

```json
{"maturity":"","phase":"","agent_id":"","task_id":"","locked":null,"completed":[],"blocked":[],"task_start_sha":"","updatedAt":"<ISO>","rule_capture":{"status":"none","task_id":"","candidates":[]}}
```

- `maturity`: LEVEL_0_EMPTY / LEVEL_1_PROTOTYPE / LEVEL_2_ACTIVE / LEVEL_3_PRODUCTION
- `phase`: one of the lifecycle phases above (understand / plan / implement / validate / synchronize / report / completed / blocked / failed)
- `agent_id` / `task_id`: identify the working agent; used for multi-agent locking
- `locked`: set while actively modifying a file; null when done
- `completed`: list of done items (docs, agents, rules, security, ci, state)
- `blocked`: external blockers with reason (e.g. "github_permission")
- `task_start_sha`: at task start, write `git rev-parse HEAD` here; resume keeps the original (never overwrite mid-task); consumed by `scripts/check-sync.js` as the change-set base
- `rule_capture`: optional current-task state for persistent/unclear requirement candidates; `status` is `none / collecting / awaiting_adjudication / resolved`. Missing in older projects means `none`; candidates use a unique `rc-<task_id>-<sequence>` ID, normalized text, scope, classification, reason, target and status.

Multi-agent rule: before starting, run `node scripts/check-lock.js` (exit 1 = another agent holds `locked`) or read state.json — wait or coordinate, never edit the same file in parallel. Never remove a completed entry. If a previous run left state, resume from it instead of restarting.

**Audit trail (activity log):** at the same task-execution end point, append exactly ONE line to `.governance/activity.jsonl` (append-only JSON Lines, git-ignored runtime output). A resumed execution with the same `task_id` may append a new linked line, but never rewrites an old line:

```json
{"ts":"<ISO>","agent_id":"<id>","task_id":"<id>","phase":"<phase>","action":"<action>","files":["<paths>"],"commands":["<cmd>"],"result":"ok|blocked|failed","summary":"<one line>","rules_captured":["rc-<task>-01"],"rules_pending":["rc-<task>-02"],"rules_resolved":[{"id":"rc-<task>-03","decision":"one-off"}]}
```

- `action` vocabulary (v1): `init / inspect / plan / implement / modify / delete / commit / release / audit / migrate`
- **Redaction (mandatory):** mask any secret-like token in `summary` / `commands` / candidate text and the new rule fields (same pattern classes as `scripts/check-secrets.js`) before writing — never log secret material
- **Rule capture:** collect only developer-stated persistent behavioral requirements. `one-off` items are report-only; `persistent` and `unclear` items require explicit ID-based adjudication before a rule-file write. If adjudication is missing, set `state.json.rule_capture.status` to `awaiting_adjudication`, keep the task `blocked`, and resume from lifecycle Phase 5b after the developer decides.
- Never overwrite or rewrite existing lines (append-only); rotation is deferred
````

---

## 5. drift-check

````
---
name: drift-check
description: Use to detect governance drift in this repo — compare declared artifacts in .governance/manifest.json against reality, check governance_version, and produce a health report. Triggers on "check governance drift", "governance health report", "is governance intact".
---

# Drift Check

1. Run: `node scripts/verify-governance.js --json`
2. Read `.governance/manifest.json`: `governance_version` + declared `artifacts`
3. Compute drift:
   - missing artifacts: declared in manifest but absent on disk (from validator results)
   - version drift: `governance_version` now vs last recorded in `.governance/validation.json`
4. Write `.governance/drift-report.json`:
   ```json
   {"timestamp":"<ISO>","governance_version":"<X>","missing":[],"versionDrift":false}
   ```
5. Propose minimal fixes only — no rebuild, no restructure, no migration. Governance-file changes require user confirmation (see Governance File Protection).

**activity-report mode** — aggregate the audit trail (`.governance/activity.jsonl`):

- Read the last N entries (default 50): group by `agent_id` / by `action` / failed-only (`result != "ok"`)
- Output a summary table + the failed entries with `ts` / `agent_id` / `task_id` / `summary`
- Read `.governance/state.json.rule_capture` and report its current unresolved candidates first. Use candidate IDs to reconcile `rules_pending`, `rules_captured` and `rules_resolved`; report current pending count, not the historical sum of old pending records.
- Never print `commands` / `files` from failed entries verbatim when they may contain secret material (apply the same redaction as state-manager)

**freshness mode** — flag governance docs gone stale relative to code activity (report-only, NEVER a gate):

1. Compute per-doc staleness = days since its **last git commit** (`git log -1 --format=%cs -- <doc>`), NOT filesystem mtime (fresh clones have all mtimes equal to checkout time)
2. Measure code activity in the same window: commits touching `src/`, `app/`, `packages/` etc. since the doc's last commit date
3. Thresholds (advisory): doc not committed in 30+ days while code is active → `stale`; 90+ days → `very stale`
4. Mandatory-doc pair (`docs/ARCHITECTURE.md`, `CHANGELOG.md`) reported first; feature docs (`docs/features/`) included
5. Append the result to `.governance/drift-report.json` (nested under `freshness`):
   ```json
   {"freshness": {"stale": ["docs/ARCHITECTURE.md"], "veryStale": []}}
   ```
6. Exit code is unaffected — freshness is advisory only; stable low-commit projects are allowed to show stale docs without failing

**consistency mode** — flag cross-document contradictions (report-only, exit 0 always). Run `node scripts/check-doc-consistency.js --json` (or `npm run governance-consistency` if registered):

- **version-example sync** — `governance_version` / manifest examples in docs must match the current declared version
- **protected-files sync** — protected-file summary lists must match the single source of truth (`references/policies/governance-files.policy.md`); summaries that defer to it ("single source of truth") are exempt
- **ADR status sync** — ADRs marked `Accepted (Unreleased)` whose feature already shipped in a released CHANGELOG section
- **roadmap target validity** — unfinished items whose target version ≤ current version
- **link validity** — relative markdown links must resolve to real files
- **numeric claims** — documented counts (validator check count etc.) must match the source
- **trilingual tree parity** — delegates to `scripts/check-doc-parity.js` (three language trees structurally parallel)

Append the result to `.governance/drift-report.json` (`consistency` object). Advisory only — heuristics, never a fail-closed gate.

- Exit 0 always (reporting, not a gate)

**standard validation sequence** — lifecycle Phase 4 runs the gates in order: `check-lock.js` (multi-agent) → `check-git-policy.js` → `check-secrets.js` → `verify-governance.js` → project test/lint/build → advisory (`check-doc-freshness.js` + `check-doc-consistency.js`, exit 0). Gates 1-5 fail-closed; the advisory pair reports only.
````

---

## 6. release-manager

````
---
name: release-manager
description: Use to cut a tagged release for this repo with a human-in-the-loop workflow. Analyzes the repository (git tags, version, git log/diff, API and user-visible changes), produces a Release Proposal (SemVer 2.0.0 classification + risk level: low/medium/high with a review recommendation), waits for explicit developer approval, then executes the release (annotated tag, push, GitHub Release) — never any write operation without approval. Triggers on "release", "publish version", "create release", "/release vX.Y.Z".
---

# Release Manager

Follow `references/workflows/release.md` (the single source of truth). Release lifecycle: Design → Implement → Validate → Release → Audit.

Core principle: AI analyzes and proposes; the developer authorizes; no release operation runs without explicit confirmation.

## release_requirements (all must pass)

- `git.require_clean_status`: `git status --porcelain` empty
- `tests.required`: test command exit 0
- `changelog.required`: CHANGELOG records the change
- `version.manifest_match_tag`: `package.json.version` == `CHANGELOG` top version == `manifest.governance_version` == tag `v<version>`
- `release.tag_required`: target tag does not exist yet (`git tag -l <tag>`)
- `release.proposal_approved`: a Release Proposal was generated and the developer explicitly approved it
- `release.review_satisfied`: Proposal risk/review metadata is valid; a high-risk Proposal has `reviewStatus` set to `completed` or `explicitly-approved`
- `validator.passed`: `node scripts/verify-governance.js` exit 0

Any failure → report ⚠️/❌ with the exact item; do NOT proceed.

## Phase 1 — Analyze

Inspect the repository: current tag/version, `git log` / `git diff` since the last release, file changes, API/interface changes, user-visible changes. Run the read-only analyzer:

`node scripts/release-manager.js plan --json '<{"current":"X.Y.Z","changes":[{"type":"...","description":"...","uncertain":false}]}>'`

It outputs the Release Proposal JSON (current / recommended / releaseType / reasons / riskLevel / reviewRecommendation / reviewStatus / riskReasons / releaseNotes / headSha) and NEVER writes. Exit code 2 → clarification required (see Uncertainty).

## Phase 2 — Version Decision (SemVer 2.0.0)

- **Major** only for real breaking changes (removed public API, breaking API change, removed config, CLI behavior breaking scripts, incompatible protocol/data format). Internal refactors, file moves, architecture changes never trigger Major.
- **Minor** only for backward-compatible, **user-perceivable** new capabilities (new user feature, public API, CLI command, config capability, or user-visible agent behavior). README/docs/tests/CI changes, refactors, perf/logging tweaks, and internal tooling/mechanism improvements (lock checks, content validation, template additions, flow ordering, internal flags) never trigger Minor.
- **Patch** for everything else (fixes, refactors, perf, docs, tests, config, dependency updates, internal tooling/mechanism improvements).
- NEVER decide by diff size, commit count, file count or added code volume.

## Phase 3 — Approval Gate

Show the developer:

```
Release Proposal

Current: vX.Y.Z
Recommended: vX.Y.Z
Reason: ...
Risk level: low / medium / high
Review recommendation: none / suggested / required
Review status: not-required / suggested / required / completed / explicitly-approved
Release Notes: ...

Proceed with release?
```

Wait for explicit confirmation. Write the approved proposal to `.governance/release-proposal.json` (git-ignored runtime output). For high-risk proposals, set `reviewStatus` to `completed` after review-manager finishes, or to `explicitly-approved` after item-by-item developer confirmation. Forbidden to proceed when: no confirmation, vague reply, unresolved breaking-change judgement, missing high-risk review evidence, or the working tree changed.

## Phase 4 — Execute

Only after explicit approval:

1. Re-verify: `git status` clean AND `git rev-parse HEAD` equals the proposal `headSha`; any change → abort and re-run Analyze.
2. Sync versions: `package.json` → CHANGELOG (move `[Unreleased]` into `[X.Y.Z]`) → `.governance/manifest.json` (`governance_version` + `release` field).
3. Archive completed milestones (aggregated into `docs/plans/archive/vX.Y.Z.md`, one file per version) and completed `TASK_<name>.md` files (moved as individual files, original names). Keep the original entries, never delete. Unfinished milestones stay in `docs/plans/`.
4. Commit: `git add` (version sync + archive files only) → `git commit -m "release: vX.Y.Z - <summary>"`. Version changes and the archive MUST be in the same commit — the tag must point to a HEAD that contains them.
5. Run `node scripts/verify-governance.js`; exit code must be 0.
6. Refresh the proposal: update `headSha` to the new HEAD, write `.governance/release-proposal.json`.
7. `node scripts/release-manager.js execute --proposal .governance/release-proposal.json --yes` (creates the annotated tag; `--yes` is the recorded approval — without it the tool refuses all writes; it re-verifies clean tree + `headSha`).
8. `git push origin main` → `git push origin vX.Y.Z` — write operations, user confirmation required.
9. `gh release create vX.Y.Z --title "vX.Y.Z" --notes "<Release Notes>"`. gh missing/unauthenticated → ⚠️ Blocked with reason.
10. Set `manifest.release.validated` to `true`, re-run validator, record into `.governance/validation.json`.

## Uncertainty

If you cannot determine whether a change is breaking or a feature: mark it Potential Breaking Change / Potential Feature, request developer confirmation, pause the release. Never guess.

## 0.x versions

0.x.y still follows the rules above; breaking changes never auto-bump to 1.0.0 — only an explicit developer request may enter 1.0.0.

## Permissions

`plan` is read-only and may run automatically. Git tag, push, and `gh release create` are write operations — they run ONLY after an explicit developer approval (the approval covers this release's write sequence); state intent and wait for confirmation. Modifying `references/workflows/release.md` or manifest `release` fields follows the Governance File Protection flow.
````

---

## 7. plan-manager

````
---
name: plan-manager
description: Use to manage this repo's development plans — create TASK_<name>.md before medium/large changes, check off milestones in docs/plans/DEVELOPMENT_PLAN.md and mark TASK Status when work completes. Triggers on "create task plan", "update development plan", "check off milestone", "mark task completed", "plan this task".
---

# Plan Manager

Operates the plan lifecycle (rules live in `@docs/rules/lifecycle.md` — this sub-skill only encapsulates the workflow, it does not duplicate the rules).

## Phase 2 — Create a TASK plan

For medium/large changes, create `docs/plans/TASK_<name>.md` (before writing code) with:

```
## Status
Active

## Task Purpose
...

## Current Problem
...

## Proposed Solution
...

## Affected Files
...

## Risks
...

## Validation Method
...
```

Small changes (typo, single-function tweak) may skip the TASK file but must state the reason in the final report.

**Present & confirm** — after creating the plan, present it to the user (Proposed Solution, Affected Files, Risks, Validation Method) and get explicit confirmation before implementation proceeds. Changes spanning 3+ files require user confirmation regardless of size judgement. Do not start implementing without confirmation (unless the user explicitly waives it).

## Phase 5 — Update plans on completion

After the task passes validation and its knowledge sync:

1. Check off the corresponding milestone in `docs/plans/DEVELOPMENT_PLAN.md` — mark status + acceptance result (if a milestone exists).
2. Set the TASK file's `## Status` to `Completed` (with completion date).
3. Update CHANGELOG.md / Feature Registry / ARCHITECTURE.md per lifecycle Phase 5.

Archiving happens at RELEASE (release-manager), NOT here.

## Rules

- Plans go in `docs/plans/`; completed changes go in `CHANGELOG.md` — no overlap.
- Never delete a completed milestone or TASK file; archiving preserves originals.
- If a previous session left a TASK file or state, resume from it instead of recreating.
````
## 8. review-manager

````
---
name: review-manager
description: Perform a review across two independent dimensions — depth (lightweight quick pass vs full audit: line-by-line, dev-plan cross-reference, execution-level verification, distrust-of-gates) and scope (the change set by default, a specified path, or the whole project). Triggers on "review this" · "review the changes" · "audit recent changes" · "review my changes" · "审核一下" (light/change-set) · "deep review" · "full review" · "全面审查" · "彻底审查" · "逐行审查" (full/change-set) · "review the whole project" · "全项目审核" (light/whole-project) · "audit everything" · "全项目彻查" (full/whole-project); append a path argument to scope it (review <path> / deep review <path> / 审核 <路径>).
---

# Review Manager

Standardize review into fixed modes — no improvisation. Every review covers the same five domains; **depth** decides how hard each file is examined and which mandatory steps run, **scope** decides which files enter the review.

## Mode selection — depth × scope (two independent dimensions)

**Depth** decides how hard each file is examined; **scope** decides which files enter the review. Parse them independently: `deep`/`彻底`/`逐行` set depth; `whole project`/`everything`/`全项目` set scope; a path argument sets scope. Unspecified scope = the change set.

| | Lightweight (quick pass) | Full audit (line-by-line + 6 mandatory steps) |
| --- | --- | --- |
| **Change set** (default) | `review this` · `review the changes` · `audit recent changes` · `review my changes` · `审核一下` — pre-commit quick check | `deep review` · `full review` · `全面审查` · `彻底审查` · `逐行审查` — release gate, high-risk changes, post-incident re-review |
| **Specified path** | `review <path>` · `审核 <路径>` (e.g. `review src/auth`) — single-module quick check | `deep review <path>` · `彻底审查 <路径>` — single-module deep dive (before refactor, inheriting unfamiliar code) |
| **Whole project** | `review the whole project` · `全项目审核` — global health pass (mechanical checks + sampling, no line-by-line promise) | `audit everything` · `全项目彻查` — full-repository audit (highest cost, use sparingly) |

Both modes run the same 5 domains (fixed, no dynamic expansion in v1):

- Script logic — correctness, edge cases, error handling
- Doc consistency — three language trees, links, version examples, CHANGELOG reconciliation (invokes drift-check scripts as input)
- Test coverage — fixture realism, assertion strength, flaky risk
- Governance artifacts — policies, templates vs implementation, protected lists
- Security — secrets, permission rules, sensitive data

## Lightweight workflow

1. **Determine scope** — resolve the scope dimension first, then collect files:
   - **Change set (default)** — `git diff <baseline>..HEAD` + `git status --porcelain` (uncommitted); baseline defaults to the last review point (manually specified in v1, no auto-recording). Includes directly affected files (tests affected by changed scripts, generated artifacts affected by changed policies).
   - **Specified path** — every file under the given path glob including subdirectories, **not limited to what changed**.
   - **Whole project** — all repository files, **excluding** `node_modules/`, build output, `.git/`.
2. **Dispatch parallel subagents** — the 5 fixed domains above, one pass each.
3. **Summarize** — sorted by severity (severe / general / trivial), each with file path + line number + evidence.
4. **Fix** — severe and general must be fixed; trivial items reported for the user to decide.
5. **Gate verification** — run `npm run check` (tests + parity) and record real output.

## Full audit workflow (additional mandatory steps)

The full audit runs the lightweight steps PLUS the following — each is a hard requirement, not optional:

1. **Enumerate the scope exhaustively** — for the change-set scope: `git show --stat` + `git diff --name-only` + `git status --porcelain` (uncommitted); for a path scope: list every file under the path; for whole-project scope: list all repository files (excluding `node_modules/`, build output, `.git/`) → complete file list. No sampling.
2. **Read every file in scope in full, line by line** — summaries and "trust the author's description" are forbidden. This is the core difference from lightweight depth.
3. **Cross-reference against dev plans** — for each plan doc under `plans/` touching the reviewed scope: compare phase alignment, Affected Files, Validation Method, shipped-vs-planned. Flag deviations (e.g. plan says Phase B, implementation put it in Phase A; plan lists a required doc that is missing).
4. **Execution-level verification** — do not stop at reading code; actually run the artifacts and check the output is valid (e.g. generate JSON and verify it parses; re-run the e2e command in an isolated temp dir). Assumption is that output is broken until proven otherwise.
5. **Distrust the gates** — a green result is not proof the check ran. Verify the verification: confirm the test harness actually executed the relevant tests (e.g. ✓ line count matches the denominator; tests are registered before the runner loop, not after); re-run the suite independently; cross-check numeric claims in docs against the validator source.
6. **Evidence-form report** — every finding carries file:line + real output excerpt (command output, parsed JSON, etc.), sorted by severity. Fix severe and general items, then re-run gates and record real output.

## Cost guardrails (scope × depth)

- **Whole project × Full audit** — before starting, report the file count and estimated effort and wait for user confirmation (prevents runaway cost).
- **Whole project × Lightweight** — rely on mechanical checks (drift-check scripts + gates) plus sampled human-style review; do NOT promise line-by-line coverage.
- **Specified path × Full audit** — no guardrail needed (scope is bounded).

Anti-confirmation-bias rule for both modes but especially full audit: assume bugs exist and hunt them; never conclude "no issues" from reading your own just-written code without execution-level evidence.

## Boundary with drift-check (explicit)

| | review-manager | drift-check |
| --- | --- | --- |
| Layer | deep (problem-finding, two depths) | mechanical (omission-catching) |
| Input | git diff + related project files + (full audit) dev plans | manifest + script check classes |
| Output | severity-sorted issue list + fixes | drift-report.json |
| Trigger | `review this` (light) / `deep review` (full) / + path or `全项目` for scope | `check governance drift` |

Complementary: the review-manager's "doc consistency" subagent invokes drift-check scripts; no duplication.

Governed-project note: review-manager focuses on governance artifacts + recent changes; business-logic review scope is decided by the project's own conventions, not enforced.
````

