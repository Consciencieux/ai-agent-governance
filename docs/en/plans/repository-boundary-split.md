# Repository Boundary Split — payload dirs vs repo-tools (TASK plan)

[English](repository-boundary-split.md) · [简体中文](../../zh-CN/plans/repository-boundary-split.md) · [繁體中文](../../zh-TW/plans/repository-boundary-split.md)

> **Status: implemented.** Follow-up to the 2026-09-05 audience audit. The `content-audience-portability` plan fixed CONTENT leaks; this plan fixes the STRUCTURE that allowed them: the declared distribution roles are not enforced by anything. `package-skill.sh` copies whole directories, so a file ships to every tarball user merely by living under `references/` or `scripts/` — regardless of the role `init-spec.json` claims for it. Measured on the current tree: 45% of the tarball by weight (7 files, ~51 KB) is this repository's own maintenance content that no skill user can act on.

**Target: both** — `payload` changes what the tarball carries (7 repo-only files move out of the shipped dirs) and hardens `init-spec.json` + the role gate; `repo-infra` rewires every reference to the moved paths (package.json scripts, CI, tests, AGENTS.md, SKILL.md, trilingual architecture) and records the new rule. Both domains are listed separately under Affected Files.

### Objective

Make the tarball boundary a **physical fact, not a declaration**. The current invariant is "the declared roles are consistent with a directory-based copy" — that is what `check-role-completeness` proves, and it is not enough: deleting `references/init-spec.json`'s `distribution` block changes nothing about what ships. The new invariant:

> tarball 内容边界由目录结构直接保证;tarball 不包含任何 REPO-ONLY 文件。

Once this holds, a repo-only file cannot leak into the payload no matter what a declaration says, and the "does this role need a tarball switch" fourth dimension never appears.

### Current problem (post-audit measurements)

1. **The split of release flows was never made real.** `skill-release.md` still depends on `release.md` in four places (L3, L53, L57, L77 — SemVer decision, risk-tiering, transactionality ... and the reference chain is one-way: `release.md` never points back). The two audiences are documented-side separate but dependency-side still coupled.
2. **Roles are declarative; packaging is directory-based; nobody reconciles the two.** `package-skill.sh` = `cp SKILL.md + cp -R references + cp -R scripts + cp LICENSE`. It does not read `init-spec.json`, has no role filter, and nothing verifies that a declaration claimed by `check-role-completeness` actually matches what lands in the tarball.
3. **The tarball carries this repo's internal tooling.** Shipped but useless to a skill user: `references/workflows/skill-release.md` (7 repo-only facts — its own repo's `npm run check:skill-release`, this repo's `package.json`, `docs/{en,zh-CN,zh-TW}/roadmap.md`, `docs/archive/`, `package-skill.sh`, `init-spec.json`, the name `ai-agent-governance`), `scripts/package-skill.sh` (hardcodes THIS skill's tarball name), and the five repo-only gates `check-doc-parity.js` / `check-plan-delivery.js` / `check-layout-sync.js` / `check-role-completeness.js` / `check-coding-hygiene.js` — no executor reference anywhere (SKILL.md, sub-skills.md, release.md never name them; the no-op guards added last round polished a file the target should never have received).
4. **The audience-mixing benchmark is not the only instance.** `sub-skills.md` (INSTALLED) still carries 6 本仓库/技能仓库 mentions and 3 `package.json` mentions; that now ships into governed projects, where those sentences read as misplaced.
5. **The boundary-verification tests only prove closure, not packaging.** The closure tests (3a/3c) resolve references INSIDE a generated project; nothing looks at the tarball itself.

### Proposed solution

#### 1. New directory shape — directory IS the role boundary

```text
SKILL.md            skill 入口(用户安装即运行)
references/         仅:skill 执行内容 + INIT 产物源(policies + templates + workflows/release.md + workflows/ci.md + init-spec.json)
scripts/            仅:安装到目标项目的 8 个脚本 + generate-governance.js(SKILL-INTERNAL)
repo-tools/         本仓库专用脚本(绝不打包):package-skill.sh、check-doc-parity.js、check-plan-delivery.js、
                    check-layout-sync.js、check-role-completeness.js、check-coding-hygiene.js
repo-workflows/     本仓库专用文档(绝不打包):skill-release.md(单语,agent-facing)
docs/ tests/ package.json .github/ CHANGELOG.md AGENTS.md LICENSE(根,不变)
```

The packaging MECHANISM stays simple — no per-file role filter is introduced — but this plan does change what the copy carries: the 7 files below leave the shipped dirs, so `SKILL.md + references/ + scripts/ + LICENSE` is now a smaller, cleaner set. The boundary holds because repo-only content is **physically outside** those directories.

#### 2. Role semantics after the split

- `INSTALLED` — unchanged: a `source` in `init-spec.json` artifacts, INIT writes it into the governed project.
- `SKILL-INTERNAL` — shrinks to exactly three: `references/init-spec.json`, `references/workflows/release.md`, `scripts/generate-governance.js`. Only files the executor needs but INIT must not install.
- `REPO-ONLY` — now defined **by directory**: everything under `repo-tools/`, `repo-workflows/`, plus the existing root-level infra (`docs/`, `tests/`, `package.json`, `.github/`, README, CONTRIBUTING, CHANGELOG, AGENTS.md). The wording change is one sentence in architecture.md (three languages): REPO-ONLY is what the packaging step cannot reach, not a list of exceptions.
- `init-spec.json` `distribution.skillInternal` is reduced to the three files above; `distribution.undecided` stays empty.
- **Role gate — two independent assertions, both fail the gate** (declaration layer): ① **reverse**: ANY file under `repo-tools/` or `repo-workflows/` appearing in `artifacts` or `distribution.skillInternal` fails — declaring a repo-only file as distributed is the exact mistake this plan is undoing; ② **closure**: EVERY file under `references/` and `scripts/` must be declared (a `source` in `artifacts`, or in `distribution.skillInternal`) — an undeclared file sitting in a shipped dir fails. Assertion ② already exists (the unclassified check); the plan states it explicitly because the review correctly observed that the reverse check alone does not prove the shipped dirs are clean. The MATERIAL layer — what the tarball actually carries vs the declared allow-set — is T5.1, and only the two together prove "roles == packaging".

#### 3. File moves (git mv, history preserved)

| from | to |
| --- | --- |
| references/workflows/skill-release.md | repo-workflows/skill-release.md |
| scripts/package-skill.sh | repo-tools/package-skill.sh |
| scripts/check-doc-parity.js | repo-tools/check-doc-parity.js |
| scripts/check-plan-delivery.js | repo-tools/check-plan-delivery.js |
| scripts/check-layout-sync.js | repo-tools/check-layout-sync.js |
| scripts/check-role-completeness.js | repo-tools/check-role-completeness.js |
| scripts/check-coding-hygiene.js | repo-tools/check-coding-hygiene.js |

Remaining in scripts/: `verify_governance.js`, `check-lock.js`, `check-git-policy.js`, `check-secrets.js`, `check-sync.js`, `check-doc-freshness.js`, `check-doc-consistency.js`, `release-manager.js` (8 INSTALLED) + `generate-governance.js` (SKILL-INTERNAL).

#### 4. Cross-reference repair

- **`skill-release.md` becomes self-contained.** It stops citing `release.md`: SemVer judging rules (Major/Minor/Patch boundary, forbidden heuristics, 0.x), the tiered review table and the transactionality clauses are carried over as text. Controlled duplication is accepted (adjudicated: the two documents describe two different release flows of one system; the shared behavior lives in `release-manager.js`, so only the rule text duplicates). Its dependency set becomes: `package.json`, `CHANGELOG.md`, `SKILL.md`, `references/init-spec.json`, `scripts/generate-governance.js`, `repo-tools/package-skill.sh`, repo-tools gates.
- **Usage boundary after the move (the semantic contract this plan declares, and the review's key gap):** working FROM the source repository, use `repo-workflows/skill-release.md` to release THIS skill; working INSIDE a governed project installed from the tarball, use `references/workflows/release.md` to release that project; the installed skill does NOT promise to be able to release itself. If an agent inside a governed project looks for a skill-release.md and finds none, that absence is the correct signal — it means it is in a different shape, not that the file was misplaced.
- **`check-doc-consistency.js` parity guard** — it `existsSync`-checks the parity script. After the move the parity script lives at `repo-tools/check-doc-parity.js` in this repo and does not exist in a governed project (where the check is INSTALLED). The guard checks candidate paths in order — `repo-tools/check-doc-parity.js`, then `scripts/check-doc-parity.js` — and no-ops when neither exists, preserving both shapes without hardcoding a repo-only path into installed text.
- **`sub-skills.md` INSTALLED content** — the remaining 本仓库/package.json mentions are reworded to audience-neutral statements (same class as §1 of the content-audience plan; no new paths introduced).
- **Forbidden edges stay enforced by the closure tests** (they keep running against a generated project + tarball; with the moves they become physically unreachable — the tests stay to pin the invariant).
- Path references updated: `SKILL.md:44` + its RELEASE sections, `AGENTS.md` (role examples, protected-files summary, gate table, distribution-role conventions line), `package.json` scripts (`docs:parity`, `docs:layout`, `plans:delivery`, `check`/`check:payload`/`check:all`/`check:skill-release`/`check:repo-release`), `.github/workflows/ci.yml`, `tests/support/helpers.js` (`LAYOUT_CHECK`, `PLAN_DELIVERY`, new `PARITY_CHECK`, `HYGIENE_CHECK`, `ROLE_CHECK` paths), every suite that hardcodes a moved script path, `docs/{en,zh-CN,zh-TW}/architecture.md` (Repository Layout tree + three-roles table + gate table).
- **`check-layout-sync.js` scope** — after the move it is a repo-tool; it keeps scanning `references/` + `scripts/` AND starts scanning `repo-tools/` + `repo-workflows/`, so the trilingual architecture pages (and the index it backs) document the new tree. Its own location no longer collides with what it scans (guards stay as-is; they no longer fire in the shapes that motivated them, but they cost nothing and protect a future file wrongly dropped into scripts/).

#### 5. New verification (the plan's strengthened acceptance criteria)

- **T5.1 full-manifest tarball test** (payload.test.js): from the repo root run `bash repo-tools/package-skill.sh <temp-version>` (the OLD invocation `bash scripts/package-skill.sh` would itself run a moved path and must be caught by the post-move path scan), then read the COMPLETE member list with `tar -tzf` — not just the top-level entries. **Normalization (fixed so different implementations compute the same set):** (i) every tar member is normalized — leading `./` stripped, separators forced to `/`, directory entries (trailing `/`) dropped, `./` entries dropped; (ii) `artifacts[*].source` is a FILE path, never a directory or glob — a directory source is a stale-declaration data defect covered by the role gate and must not occur; (iii) `SKILL.md` and `LICENSE` are ALWAYS in the allow-set, on top of the declared file set; (iv) duplicate sources (the same file declared twice) are a defect, not a set member; (v) an artifact `source` pointing under `repo-tools/` or `repo-workflows/` fails the role gate's reverse check before T5.1 runs. Two assertions, both REQUIRED: (a) **equality** — the member set equals the declared allow-set `{SKILL.md, LICENSE} ∪ artifacts[*].source ∪ distribution.skillInternal` (unpacked to files), so a repo-tool file slipped INTO `references/` or `scripts/` makes the sets differ and fails the test; (b) **forbidden** — no member under `repo-tools/`, `repo-workflows/`, `docs/`, `tests/`, `.github/`, and no `package.json` / `AGENTS.md` node. Top-level-only checks were verifiably insufficient: `references/workflows/skill-release.md` and every repo gate sat BELOW the four roots while the top looked clean. A negative assertion on paths inside the shipped dirs is what catches a future re-introduction.
- **T5.2 role-gate reversal test**: drop a dummy file under `repo-tools/`, declare it in `skillInternal` via a temp fixture, run the gate, expect fail; undeclared dummy under `repo-tools/` must still pass (repo-tools is outside the classified set).
- **T5.3 layout gate covers the new dirs**: a file added under `repo-tools/` without an architecture.md entry fails the layout gate.
- **T5.4 clean-target chain (already exists, rerun)**: tarball → extract → INIT `--phase A/B/C` → closure tests (3a/3c). The release executor is exercised in ISOLATED temp git repositories only: `plan` runs read-only against a temp fixture; `execute` runs against a SECOND isolated temp git repo (init + commit + minimal `.governance/` fixture) and the test asserts the WRITES it is expected to perform (annotated tag creation) — `execute` is write-capable by design and must never run against this repository's working tree.
- **T5.5 mutation check**: reintroduce the L53/L57 dependency in skill-release.md → a new reference test fails (skill-release.md cites nothing outside its sanctioned dependency set).
- **T5.6 declaration-vs-manifest consistency**: the role gate (declaration layer) and T5.1 (material layer) are asserted against the SAME allow-set — declared `skillInternal` ∪ `artifacts[*].source` — so a change to one that desynchronizes the other fails either the gate or the manifest test. This is the mechanical pair that replaces "roles are declared" with "roles and packaging are the same fact".
- Gate evidence: `npm test`, `npm run check`, `npm run check:skill-release` (except the pending-archive advisories), plus the clean-target script all record real output.

#### 5b. Boundary discipline (a standing risk, stated on purpose)

Directory placement is the DEFAULT distribution boundary, not a proof of audience-correctness. A new file under `references/` or `scripts/` ships automatically, so it must additionally pass: the role declaration alone is not a guarantee — (i) declared (INSTALLED source or SKILL-INTERNAL; an undeclared file fails the role gate), (ii) portable (its references resolve in a governed project; the closure tests assert this), (iii) target-chain-verified (T5.4 runs the generated artifacts). "It sits in scripts/" is not evidence of anything; the declaration and the closure are.

#### 5a. Dependencies and positioning (what this plan does NOT re-do)

**Hard precondition.** `content-audience-portability` must be fully COMMITTED (its files carry no uncommitted work-tree changes) and pass its gate group — including the 3a/3c closure tests — before this plan's Step 0 begins. If implementation time finds it uncommitted, the first action is completing that batch's commit; this plan may NOT start on top of an uncommitted predecessor whose closure is unproven. This plan's own T5.4 reruns the closure tests at the end, so a content-layer leak that somehow survives the switch is still caught here.

Content-level closure — INSTALLED rule-text leaks, the Phase A contract (N20), the 3a/3c closure tests — was delivered by `content-audience-portability` (implemented), and this plan builds ON that batch: it fixes the STRUCTURAL layer the content batch could not (a repo-only file can sit inside references/ with perfectly portable prose). It deliberately does NOT re-audit rule bodies; that audit's closure tests keep running. If this plan uncovers a fresh content leak during the move (e.g. a moved file's own prose), that defect belongs to the content batch's closure tests and is fixed there, not silently re-patched here. `sub-skills.md`'s residual repo mentions are the one content item this plan owns (§4, reviewed and accepted).

#### 6. Not doing

- Not adding a role/tarball switch — the fourth dimension — anywhere. No per-file packaging filter in `package-skill.sh`; directory boundaries replace per-file decisions.
- Not re-classifying by sub-role. The three-word vocabulary stays; REPO-ONLY just becomes a directory property rather than a list.
- Not touching the INSTALLED script set, the policy files' rule bodies (they moved through the content-audience plan already), or the three distribution-role words themselves.
- Not consolidating the duplicated SemVer text into a third shared file. Two documents, one behavior source (`release-manager.js`); anything more reintroduces a doc-authority split.

### Verification (evidence tiers)

- **Step 0 of the change set: the full-repo path scan** — `git mv` alone does not prepare a move. Every reference to the seven old paths (identified by a full scan that already found ~60 hits across AGENTS.md, CHANGELOG, trilingual architecture/roadmap/CONTRIBUTING, package.json, init-spec.json, tests, and the moved files themselves) must be resolved: updated to the new path, or explicitly kept (docs/archive, design-decisions, historical plan bodies, the moved files' own headers). The scan runs again at the end and must return zero production hits.
- Each move is verified by git mv + full path re-scan: no production/config/test file may still reference the old path (mechanical grep).
- T5.1-T5.6 tests are mutation-verified (each fails when its invariant is reintroduced).
- tarball → INIT → target-chain re-run with real output (mechanical).
- Trilingual architecture edits pass parity + layout + terminology gates (mechanical).
- `check-role-completeness` (moved) proves: references/+scripts/ fully classified, skillInternal equals the three-file set, repo-tools/repo-workflows produce no distributed declarations.

### Affected Files

**payload (distribution content and behaviour):**

- `references/init-spec.json` — §2: `distribution.skillInternal` reduced to three entries; no artifact path changes
- `scripts/generate-governance.js` — no behavioural change expected; verified, not assumed
- `scripts/check-doc-consistency.js` — §4 parity-guard candidate paths (repo-tools first, then scripts)
- `references/templates/sub-skills.md` — §4 remaining audience-neutral rewording
- `references/workflows/release.md` — NOT moved, NOT edited beyond confirming no skill-release reference remains (it has none — verified one-way)

**repo-infra (moves, wiring, docs, tests):**

- `repo-workflows/skill-release.md` — moved from references/workflows/ + §4 self-containment (SemVer, tiered review, transactionality as text; four release.md citations removed)
- `repo-tools/package-skill.sh` — moved from scripts/
- `repo-tools/check-doc-parity.js` — moved from scripts/
- `repo-tools/check-plan-delivery.js` — moved from scripts/
- `repo-tools/check-layout-sync.js` — moved from scripts/ + §4 scans four dirs
- `repo-tools/check-role-completeness.js` — moved from scripts/ + §2 reversal check
- `repo-tools/check-coding-hygiene.js` — moved from scripts/
- `package.json` — §4 script paths
- `.github/workflows/ci.yml` — §4 gate paths
- `tests/support/helpers.js` — §4 path constants
- `tests/suites/` — path replacements where a moved script is named; T5.1/T5.2/T5.3/T5.5 new tests (payload.test.js / docs.test.js / hygiene.test.js as appropriate)
- `AGENTS.md` — §4: role examples, protected-files summary (add repo-tools//repo-workflows/), gate table, distribution conventions
- `SKILL.md` — §4 citation paths (:44, RELEASE sections) — declared here explicitly: the plan DOES edit it (review flagged its absence from the file list)
- `CONTRIBUTING.md` — trilingual, `check-doc-parity.js` citation path (found by the post-move path scan)
- `docs/{en,zh-CN,zh-TW}/roadmap.md` — trilingual, mechanism references to the two moved gates (found by the same scan)
- `docs/{en,zh-CN,zh-TW}/architecture.md` — §1 tree, §2 role wording, gate table
- `docs/archive/` and historical plan / ADR files — NOT edited: they record the historical state, old paths are part of that record
- `docs/{en,zh-CN,zh-TW}/plans/repository-boundary-split.md` — this plan
- `CHANGELOG.md` — Changed entry
