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
| Distribution roles (declared, never inferred) | `references/init-spec.json` § invariants + § distribution | repo |
| Engineering restraint / machinery test | `references/policies/coding.policy.md` § 工程克制与机制测试 | both |
| Change placement and residue cleanup | `references/policies/coding.policy.md` § 变更归位与残留清理 · `references/policies/lifecycle.policy.md` § 变更归位与残留清理 | payload |
| Root-cause repair protocol + failure budget | `references/policies/lifecycle.policy.md` § 根因修复协议与失败预算 | payload |
| Scope tiering (rule-decided, not self-judged) | `references/policies/lifecycle.policy.md` § 规模分级 | payload |
| Test protection | `references/policies/testing.policy.md` § 测试保护 | payload |

Six always-on gate clusters keep this index and its sources honest: the consent cluster, the protected-files cluster (declared governance paths must exist in the authoritative list — a pointer to the single source of truth excuses incompleteness, never incorrectness), the principles-index cluster (every row's source must resolve), the plan-status cluster (unknown status fails), the prompt-sync cluster (trigger inventory agrees with the skill sources in both directions — missing and stale; ADR-0008) and the frontmatter-version sync point are verified by `node scripts/check-doc-consistency.js --gate` (part of `npm run check`). The terminology cluster (glossary-registered forbidden renderings, exempt per line with `<!-- i18n: allow X -->` — inside a Markdown table only the preceding line of the table's first row works; later rows must be reworded) is fail-closed in the same `--gate` run. The pending-archive cluster (an implemented/Completed plan still in `docs/*/plans/`), the archived-plan-status cluster (a file in `docs/archive/` must say `archived`) and the changelog-coverage cluster (a governance/mechanism change without a CHANGELOG record; doc-only changes are exempt) are fail-closed only in `--release-gate`, run as release.md Phase 4 step 3 — alongside `node scripts/check-doc-freshness.js --release-gate`, which blocks when a translation lags its 简体中文 source or is still marked draft.

## Repository architecture

See [docs/en/architecture.md](docs/en/architecture.md) — the single source of truth for repository layout (what each directory is FOR, install payload vs repo infrastructure split).

Hard rules that follow from this:

- **Changing skill behavior = editing `references/` only** (+ `SKILL.md` if a pointer/entry changes + `CHANGELOG.md` if behavioral). Done. Docs edits never change what the skill does.
- **`docs/` edits are a documentation duty, not the feature.** When a sub-skill gains/changes trigger words, syncing them into `docs/{en,zh-CN,zh-TW}/commands.md` exists so USERS can learn how to invoke the skill — it serves the manual, not the skill. The skill works with or without it.
- **Generated skills vs scripts** — generated skills are loaded from `.governance/generated/skills/<name>/SKILL.md`; they are not `scripts/<name>.js`. The registry is generated from `references/templates/sub-skills.md`; keep the distinction explicit in agent-facing instructions.
- **Never restate skill content into `docs/`.** Docs reference the skill (file + section pointer); they do not copy workflows, step lists, or rule text. The **trigger-word inventory in `commands.md` is the one deliberate exception** — it is a user-manual duty, it is gate-enforced (prompt-sync), and its authority stays in `references/templates/sub-skills.md`; see ADR-0008. The exception covers trigger words only and extends to nothing else.
- **Change placement and residue cleanup** — changes to the current source, references, compatibility layer, history and generated projections must be classified and reconciled; the full payload rule is `references/policies/lifecycle.policy.md` § 变更归位与残留清理.
- **Rule capture** — developer-stated persistent requirements are classified and explicitly adjudicated before entering governed-project rule files; the full payload rule is `references/policies/lifecycle.policy.md` § Rule Capture.
- **Classification judge rule** — ask "who reads this and does it change the skill?" Skill behavior (modes, lifecycle, templates, policies, validator checks, trigger definitions) → `references/`, single-language. Project knowledge (how to install, how to invoke, design history, roadmap, glossary, architecture) → `docs/`, trilingual — developer-maintained, read by developers AND agents working in this repo (docs is the shared knowledge home, not a "developers only" shelf; a person being a doc's author says nothing about who reads it). A `docs/` page may summarize a skill concept but must point to the skill source rather than re-specify it.
- **Where a principle goes (the three-layer judge rule)** — `SKILL.md` policy layer holds what the *skill executor* must read on every INIT/AUDIT/RELEASE run; `references/policies/` holds *content artifacts* that get copied into governed projects as `docs/rules/*`; `AGENTS.md` holds rules for working on *this* repository. Test: would an agent executing a concrete task get it wrong without reading this? If yes and it governs the skill's own execution → policy layer. If it is a rule the governed project's agents must follow → `references/policies/`. If it only applies to contributors here → this file. The index above records where each one currently lives.

## Before touching anything

- **Read `docs/en/architecture.md` — Repository Layout section** — it is the mandatory map of what each directory is FOR. The layout gate (`npm run check` → `docs:layout`) fails CI if this tree drifts from `references/` + `scripts/`, so keeping it read-and-current is enforced, not optional. CI runs `npm run check`, so every fail-closed gate in that group blocks the build — not just the tests.
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
- **Every TASK plan's Status line leads with a canonical keyword** — `design plan, not implemented` / `Active` / `implemented` / `Completed` / `archived` (zh variants per `references/policies/lifecycle.policy.md` Phase 2). Anything else reads as unknown and fails `check-doc-consistency.js --gate`. An implemented/Completed plan still sitting in `docs/*/plans/` is pending-archive — advisory in everyday checks (the documented lifecycle lets it wait for the release commit), fail-closed only under `--release-gate` at release.

## Validation (gate tiering by change scope)

Run the gate group before declaring any task done; run the full group (`npm run check:all`) before release. Record real output (never claim "should pass").

**Scope tiering** — match the narrowest entry below by `git diff --name-only` prefix. When scope is uncertain, ESCALATE to the larger scope — never narrow the verification. The entries share the same fail-closed semantics: each gate exits 0 / 1 the same way, only the set of gates that runs changes.

| Scope | When to use | What it runs |
| --- | --- | --- |
| `npm run check:docs` | `docs/`, `README.md`, `CONTRIBUTING.md`, `architecture.md` changed | test + parity + consistency + layout |
| `npm run check:payload` | `references/`, `scripts/`, `SKILL.md`, `LICENSE` changed | test + layout + consistency + role-completeness + hygiene |
| `npm run check:tests` | `tests/`, `.gitattributes` changed | test + hygiene |
| `npm run check:full` | default, uncertain scope, or explicit full request | test + parity + layout + consistency + hygiene + role-completeness |
| `npm run check:all` | release, audit, or explicit full audit | check + freshness + plan delivery |

**What each gate checks and what it proves (evidence tiers):**

| Gate | Checks | Evidence tier | What pass means |
| --- | --- | --- | --- |
| `npm test` | all 193 tests | mechanical | conditions satisfied for the changed scope |
| `check-doc-parity.js` | trilingual tree structure (files, headings, tables) | mechanical | trees are structurally parallel (NOT semantic equivalence) |
| `check-layout-sync.js` | `references/` + `scripts/` files listed in architecture.md ×3 | mechanical | no file added without a documented home |
| `check-doc-consistency.js --gate` | 12 cross-document fact clusters (frozen: new checks must create standalone scripts when existing ones cannot host them) | mechanical | declared facts match their sources |
| `check-coding-hygiene.js --gate` | monolith test registration, suite ownership, residue markers | mechanical | test architecture is intact |
| `check-role-completeness.js --gate` | every references/scripts/ file classified, no overlap, packaging matches | mechanical | distribution contract is complete |
| `check-doc-freshness.js` | stale governance docs + translation staleness | mechanical (report only; `--release-gate` blocks stale/draft) | report only; pass ≠ correct, only that no mechanical staleness was detected |
| `check-plan-delivery.js` | plan declarations vs delivered paths/identifiers | mechanical | no declared file or identifier is missing |
| `verify_governance.js` | governance artifact existence | mechanical | runs in default mode here, fails by design (ADR-0006) |

**Evidence tier definitions:**
- `mechanical` — marker, structure, path, regex, file existence. Pass = "mechanical condition satisfied", NOT "behavior is correct" or "semantics are accurate".
- `human-attested` — requires user-in-the-loop or human review (e.g. release approval, translation review, root cause evaluation). Currently no automated gate produces this tier.
- `unverified claim` — declaration only, no independent verification available (e.g. "regression test was failing before the fix"). Not a gate output.

**Impact-face check** — before touching any public interface/module/file, search its references first (`rg "<name>"`); found files enter the Affected Files list. At task end, compare actual changed files (`git diff --name-only`) against that list: listed-but-unchanged → fix or justify; changed-but-not-listed → explain (or revert if it was a lazy side-edit). Also compare the changed set against the plan's `Target`: a file outside the declared domain is an out-of-domain edit and must be explained or reverted — payload edits smuggled into a `repo-infra` task are exactly how the install payload got broken once.

## Conventions

- Language policy by audience: agent-facing files (`SKILL.md`, `references/**`, generated artifact bodies) are single-language - never add a second language section; developer-facing files are trilingual and split - the root keeps only the English landing files (`README.md`, `CONTRIBUTING.md`), translations live in their trees (`docs/zh-CN/`, `docs/zh-TW/`), and `docs/en/` holds the rest of the English docs; historical records (`docs/design-decisions/`, `docs/archive/`) are shared single-language 简体中文. 简体中文 is the canonical source; editing one language requires updating the other two in the same change. New terms must be added to `docs/glossary.md` first
- Distribution roles (use these three names, never the bare word "payload" — it used to mean all three and that ambiguity produced real defects): **INSTALLED** = INIT writes it into the governed project (it appears as a `source` in `references/init-spec.json`); **SKILL-INTERNAL** = travels in the tarball and the skill executor reads it, but INIT never installs it, so a governed project does NOT have it (`references/init-spec.json`, `references/workflows/release.md`, `scripts/generate-governance.js`, `scripts/check-coding-hygiene.js`, `scripts/check-doc-parity.js`, `scripts/check-layout-sync.js`, `scripts/check-plan-delivery.js`, `scripts/check-role-completeness.js`, `scripts/package-skill.sh`, `scripts/release-manager.js`); **REPO-ONLY** = never in the tarball (`docs/`, `tests/`, `package.json`, `.github/`, README, CONTRIBUTING, CHANGELOG, AGENTS.md, `.gitattributes`). Two consequences: a SKILL-INTERNAL file must never be cited as a rule source for governed projects, and a SKILL-INTERNAL script must no-op outside this repo's shape. Full table: `docs/en/architecture.md` § Three distribution roles
- Commit messages: Conventional Commits, in English
- Sync group: adding or modifying a sub-skill (in `references/templates/sub-skills.md`) or a check script requires updating, in the same change: `docs/{en,zh-CN,zh-TW}/commands.md` (trigger words — user manual duty, see Repository architecture), `docs/{en,zh-CN,zh-TW}/validator.md` (if validator behavior), `CHANGELOG.md` (if behavioral) — `check-doc-consistency.js`'s prompt-sync check enforces the commands.md half
- Releases follow `references/workflows/release.md`: plan (read-only) → developer approval → tag → GitHub Release. No tag/push/release without explicit approval. **Path mapping for THIS repo** — `release.md` is payload written for governed projects (`docs/plans/` → `docs/plans/archive/`, milestones in `DEVELOPMENT_PLAN.md`); this repo's equivalents are: plans in the three language trees (`docs/{en,zh-CN,zh-TW}/plans/`) → archived to `docs/archive/` (shared, single-language); no `DEVELOPMENT_PLAN.md` — milestone tracking lives in `docs/en/roadmap.md`. Follow release.md's steps, substitute these paths. **Caveats unique to this repo** (release.md is written for governed projects and does not cover these):
  - **No `.governance/manifest.json`** — the five-place `version.manifest_match_tag` rule (package.json / CHANGELOG / manifest `governance_version` / SKILL.md frontmatter / tag) reduces to **three places + tag** here: `package.json`, `CHANGELOG.md` `[Unreleased]`→`[X.Y.Z]`, SKILL.md frontmatter `version`. The manifest step (Phase 4 step 2's manifest write, step 12's `release.validated`) is skipped by design. **Two payload defaults ride along**: `references/init-spec.json` `inputs.governance_version.default` and the fallback sentinel in `scripts/generate-governance.js` — they stamp the version onto every freshly INITed project, so they are part of the same sync step (release.md Phase 4 step 2).
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
