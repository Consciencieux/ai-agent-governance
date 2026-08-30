# AGENTS.md

Guidelines for agents working on the ai-agent-governance skill repo itself. This repo is a skill distribution repository (not a governed software project) — it uses lightweight governance: release flow + plans/archive + ADRs + tests.

## Governance principles index

Where each principle authoritatively lives. Pointers only — never restate the content here; edit the authoritative file and this index stays valid. Scope tells you which domain a principle governs: **payload** ships to governed projects, **repo** governs work on this repository.

| Principle | Authoritative source | Scope |
| --- | --- | --- |
| Single source of truth | `SKILL.md` § 单一事实源 | payload |
| Rule Priority (conflict adjudication) | `SKILL.md` § Rule Priority | payload |
| Agent permission matrix | `SKILL.md` § Agent Permission Model | payload |
| Three-state status protocol | `SKILL.md` § 状态协议 | payload |
| Anti-fabrication | `SKILL.md` § 反虚构规则 | payload |
| Feature placeholder strategy | `SKILL.md` § Feature 占位策略 | payload |
| Project defaults (no guessing) | `SKILL.md` § 项目默认值约定 | payload |
| Language policy by audience | `SKILL.md` § 语言政策 · this file § Conventions | both |
| Circuit breaker (error recovery) | `SKILL.md` § 熔断机制 | payload |
| Two-pass context breaker | `SKILL.md` § 上下文熔断 | payload |
| Governance file protection | `references/policies/governance-files.policy.md` | both |
| Multi-agent identity + locking | `SKILL.md` § 多 Agent 协作 | payload |
| Error classification | `SKILL.md` § 错误分类 | payload |
| Human-in-the-loop release | `references/workflows/release.md` § 发布流程总览 | both |
| SemVer discipline | `references/workflows/release.md` § Phase 2 | both |
| Release transactionality | `references/workflows/release.md` § 事务性 | payload |
| Turn-scoped consent + exceptions A/B | `references/policies/git.policy.md` § 确认范围 · this file § Git Operation Safety Protocol | both |
| Payload self-containment | `references/init-spec.json` § invariants | repo |

Two gates keep this index and its sources honest: the consent cluster and the protected-files cluster are verified by `node scripts/check-doc-consistency.js --gate` (part of `npm run check`).

## Repository architecture

See [docs/en/architecture.md](docs/en/architecture.md) — the single source of truth for repository layout (what each directory is FOR, install payload vs repo infrastructure split).

Hard rules that follow from this:

- **Changing skill behavior = editing `references/` only** (+ `SKILL.md` if a pointer/entry changes + `CHANGELOG.md` if behavioral). Done. Docs edits never change what the skill does.
- **`docs/` edits are a documentation duty, not the feature.** When a sub-skill gains/changes trigger words, syncing them into `docs/{en,zh-CN,zh-TW}/commands.md` exists so USERS can learn how to invoke the skill — it serves the manual, not the skill. The skill works with or without it.
- **Never restate skill content into `docs/`.** Docs reference the skill (file + section pointer), they do not copy workflows, step lists, or full trigger inventories.
- **Change placement and residue cleanup** — changes to the current source, references, compatibility layer, history and generated projections must be classified and reconciled; the full payload rule is `references/policies/lifecycle.policy.md` § 变更归位与残留清理.
- **Rule capture** — developer-stated persistent requirements are classified and explicitly adjudicated before entering governed-project rule files; the full payload rule is `references/policies/lifecycle.policy.md` § Rule Capture.
- **Classification judge rule** — ask "who reads this and does it change the skill?" Skill behavior (modes, lifecycle, templates, policies, validator checks, trigger definitions) → `references/`, single-language. Developer/user docs (how to install, how to invoke, design history, roadmap, glossary) → `docs/`, trilingual. A `docs/` page may summarize a skill concept but must point to the skill source rather than re-specify it.
- **Where a principle goes (the three-layer judge rule)** — `SKILL.md` policy layer holds what the *skill executor* must read on every INIT/AUDIT/RELEASE run; `references/policies/` holds *content artifacts* that get copied into governed projects as `docs/rules/*`; `AGENTS.md` holds rules for working on *this* repository. Test: would an agent executing a concrete task get it wrong without reading this? If yes and it governs the skill's own execution → policy layer. If it is a rule the governed project's agents must follow → `references/policies/`. If it only applies to contributors here → this file. The index above records where each one currently lives.

## Before touching anything

- **Read `docs/en/architecture.md` — Repository Layout section** — it is the mandatory map of what each directory is FOR. The layout gate (`npm run check` → `docs:layout`) fails CI if this tree drifts from `references/` + `scripts/`, so keeping it read-and-current is enforced, not optional.
- Read [SKILL.md](SKILL.md) — it is the product specification, not just a doc
- Read [CONTRIBUTING.md](CONTRIBUTING.md) and the relevant [docs/](docs/) page for the area you change

## Protected files (governance file protection)

Modifying `SKILL.md`, `references/policies/**`, `references/templates/**`, `references/workflows/release.md`, or any `scripts/*.js` requires: reason → CHANGELOG update (if behavioral) → run `npm test`. Never loosen permission limits or remove validation steps. Full protected-files list: `references/policies/governance-files.policy.md` (single source of truth); the above is a summary.

## Change classification (CHANGELOG)

- doc-only (typo, wording, formatting) → no CHANGELOG entry
- bug fix → `Fixed`; new capability → `Added`; architecture/behavior/breaking → `Changed`
- CHANGELOG is written at merge/release boundaries (per the release flow), not per commit
- Small changes (single file, no public-interface change) skip the full lifecycle and CHANGELOG entry; medium/large changes follow the full six-phase lifecycle (per `references/policies/lifecycle.policy.md` scope tiers)
- Plans are design docs in each language tree's `plans/` (`docs/<lang>/plans/`); completed plans are archived to `docs/archive/` (shared, single-language) at release, never deleted
- **Every TASK plan declares a `Target`** — `payload` (ships to governed projects: `SKILL.md`, `references/`, `scripts/`, `LICENSE`), `repo-infra` (`docs/`, `tests/`, `package.json`, `.github/`, README/CONTRIBUTING/CHANGELOG/AGENTS.md), or `both`. When `Target: both`, the plan must enumerate the sync points per domain — that enumeration is what stops a cross-domain rule from being updated in one place only. Write filenames outside the Affected Files section without backticks: the delivery gate treats every backticked token inside that section as a delivery declaration.

## Validation (standard verification procedure)

Run the gate group (`npm run check`) before declaring any task done; run the full group (`npm run check:all`) before release. Record real output (never claim "should pass").

- **Impact-face check** — before touching any public interface/module/file, search its references first (`rg "<name>"`); found files enter the Affected Files list. At task end, compare actual changed files (`git diff --name-only`) against that list: listed-but-unchanged → fix or justify; changed-but-not-listed → explain (or revert if it was a lazy side-edit). Also compare the changed set against the plan's `Target`: a file outside the declared domain is an out-of-domain edit and must be explained or reverted — payload edits smuggled into a `repo-infra` task are exactly how the install payload got broken once.

- **Gate layer (fail-closed, exit ≠ 0 blocks):**
  - `npm test` — the full test suite (`tests/run-tests.js`); must exit 0 (always)
  - `node scripts/check-doc-parity.js` — three language trees structurally parallel (after any `docs/` / root `README.md` / `CONTRIBUTING.md` edit)
  - `node scripts/check-layout-sync.js` — `docs/{en,zh-CN,zh-TW}/architecture.md` Repository Layout must list every file under `references/` + `scripts/` (after any `references/` / `scripts/` / `architecture.md` edit)
- **Advisory layer (exit 0, report only):**
  - `node scripts/check-doc-freshness.js` — stale governance docs (periodic drift-check)
  - `node scripts/check-doc-consistency.js` — cross-document contradictions (periodic drift-check)
- `scripts/verify_governance.js` runs in default mode on this repo and fails by design (skill repo shape) — do not "fix" that by fabricating governance artifacts

## Conventions

- Language policy by audience: agent-facing files (`SKILL.md`, `references/**`, generated artifact bodies) are single-language - never add a second language section; developer-facing files are trilingual and split - the root keeps only the English landing files (`README.md`, `CONTRIBUTING.md`), translations live in their trees (`docs/zh-CN/`, `docs/zh-TW/`), and `docs/en/` holds the rest of the English docs; historical records (`docs/design-decisions/`, `docs/archive/`) are shared single-language 简体中文. 简体中文 is the canonical source; editing one language requires updating the other two in the same change. New terms must be added to `docs/glossary.md` first
- Install payload: the skill consists of `SKILL.md` + `references/` + `scripts/` + `LICENSE` only; `docs/`, `tests/`, `package.json`, `.github/`, README, CONTRIBUTING, CHANGELOG, AGENTS.md are repo infrastructure and must not be copied into skill installations
- Commit messages: Conventional Commits, in English
- Sync group: adding or modifying a sub-skill (in `references/templates/sub-skills.md`) or a check script requires updating, in the same change: `docs/{en,zh-CN,zh-TW}/commands.md` (trigger words — user manual duty, see Repository architecture), `docs/{en,zh-CN,zh-TW}/validator.md` (if validator behavior), `CHANGELOG.md` (if behavioral) — `check-doc-consistency.js`'s prompt-sync check enforces the commands.md half
- Releases follow `references/workflows/release.md`: plan (read-only) → developer approval → tag → GitHub Release. No tag/push/release without explicit approval. **Path mapping for THIS repo** — `release.md` is payload written for governed projects (`docs/plans/` → `docs/plans/archive/`, milestones in `DEVELOPMENT_PLAN.md`); this repo's equivalents are: plans in the three language trees (`docs/{en,zh-CN,zh-TW}/plans/`) → archived to `docs/archive/` (shared, single-language); no `DEVELOPMENT_PLAN.md` — milestone tracking lives in `docs/en/roadmap.md`. Follow release.md's steps, substitute these paths. **Caveats unique to this repo** (release.md is written for governed projects and does not cover these):
  - **No `.governance/manifest.json`** — the five-place `version.manifest_match_tag` rule (package.json / CHANGELOG / manifest `governance_version` / SKILL.md frontmatter / tag) reduces to **three places + tag** here: `package.json`, `CHANGELOG.md` `[Unreleased]`→`[X.Y.Z]`, SKILL.md frontmatter `version`. The manifest step (Phase 4 step 2's manifest write, step 12's `release.validated`) is skipped by design.
  - **`validator.passed` is exempt** (release.md L37): the skill repo has no `.governance/`/software-project shape, so `verify_governance.js` fails by design here (ADR-0006). Its gate obligation is replaced by `tests.required` (`npm test` exit 0). Do NOT fabricate a `.governance/` to make it pass.
  - **Script filename is `scripts/verify_governance.js`** (underscore). release.md L181/L186 references `verify-governance.js` (hyphen) — that is a governed-project path; here it is the underscore file and it is not run as a release gate.
  - **Archive collision** — a plan exists as three language copies (`docs/{en,zh-CN,zh-TW}/plans/X.md`) but `docs/archive/` is shared single-language. The 简体中文 copy wins; the en/zh-TW copies are not archive candidates. Archive one file named `X.md` in `docs/archive/`.
  - **Roadmap re-baseline is part of the release** (per its maintenance rule), so Phase 4 also updates `docs/en/roadmap.md` when it archives plans.
- Roadmap horizons are re-baselined at each release (per the maintenance rule in `docs/en/roadmap.md`), not ad-hoc

## Git Operation Safety Protocol (HIGHEST PRIORITY)

Read-only git ops (`status`/`log`/`diff`/`show`/`fetch`/`remote`/`branch`) are free.

**One confirmation per change set — the pre-commit echo.** After any task completes (regardless of size), before committing, echo the full git command sequence — which files to add, the commit message (a line per commit, type carried in its prefix), the push target — and take **one** confirmation covering `add` → `commit` → `push`. A user's write instruction ("push", "commit these changes") triggers this echo; the instruction itself is **not** the consent. No per-step re-asking.

**Plan approval is intent alignment.** A medium/large task's Phase 2 plan approval aligns "what to change, how" — it is not a commit authorisation. Size tiering decides only whether a plan document is written, never whether the user gets to confirm the commit.

**Release sequence.** A Proposal approved at the Approval Gate covers the whole sequence (version sync → archive → release commit → tag → push branch → push tag → GitHub Release → asset upload); no per-step re-asking. If any check fails mid-sequence, stop and re-plan.

**Universal hard constraints (every change set):**

- The echo IS the full command sequence (staged files, each commit message, target remote/branch); execution never deviates from it.
- Any step fails → stop and report. Never retry with a different approach, never improvise a repair; re-confirm before continuing.
- Push rejected (non-fast-forward) → stop and report. Never pull/rebase and re-push on your own.
- Task-level phrasing ("wrap it up", "完成任务", "发布吧") is NOT a write instruction. Ambiguous remarks ("提交一下", "clean up the repo") → ask first.

**Independent confirmation** — never covered by the pre-commit echo: `tag`, `reset`, `rebase`, `revert`, `merge`, force push, `clean`, `rm`, `restore`, `stash`, `pull`; checkout carrying uncommitted changes; amend of an already-pushed commit (counts as force push). `checkout -b` and clean-worktree switches are free.

Before confirming, still run the pre-commit checklist: `scripts/check-secrets.js` exit 0, no sensitive/unrelated files staged. When in doubt, ask first.
