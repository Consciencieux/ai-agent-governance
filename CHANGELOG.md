# Changelog

All notable changes to this project will be documented here.

## [Unreleased]

### Changed

- **The distribution boundary is now physical, not declarative — repo maintenance content no longer ships to users** — `package-skill.sh` copies `references/` and `scripts/` wholesale, so a file shipped to every tarball user purely by living in one of those directories, whatever role `init-spec.json` declared for it. Measured before the fix: 45% of the tarball by weight (7 files, ~51 KB) was this repository's own maintenance content — `skill-release.md` (which names this repo's npm scripts, its `package.json`, its trilingual roadmap and its archive), `package-skill.sh` (hardcodes THIS skill's tarball name) and five gates no executor reference ever mentions (`check-doc-parity`, `check-plan-delivery`, `check-layout-sync`, `check-role-completeness`, `check-coding-hygiene`). `check-role-completeness` had been proving the wrong thing: "the declared roles are consistent with a directory-based copy", never "the tarball carries only what should be distributed". The seven files moved to two new repo-only trees — `repo-tools/` (gates + packaging) and `repo-workflows/` (this repo's release flow) — which the packaging step physically cannot reach. `distribution.skillInternal` shrank from 10 entries to 3 (`references/init-spec.json`, `references/workflows/release.md`, `scripts/generate-governance.js`). Packaging stays a plain directory copy: no per-file role filter was added, because the directory layout is now the boundary itself.
- **Two mechanical assertions now keep declarations and packaging the same fact** — the role gate gained a REVERSE check (any file under `repo-tools/` or `repo-workflows/` appearing in `artifacts` or `distribution.skillInternal` fails), and a new payload test compares the COMPLETE tar member list against the declared allow-set `{SKILL.md, LICENSE} ∪ artifacts[*].source ∪ distribution.skillInternal` — equality in both directions, plus a forbidden-prefix assertion that is recursive rather than top-level (every pre-split leak sat BELOW the four shipped roots while the top level looked clean). Verified by mutation: putting a repo-only file back under `references/`, or declaring a `repo-tools/` file as distributed, each turns two tests red. The layout gate now scans `repo-tools/` and `repo-workflows/` too, so repo tooling cannot accumulate undocumented.
- **`skill-release.md` is self-contained and its usage boundary is stated** — it no longer cites the governed-project `release.md` for SemVer judging or the tiered review gate (both are now inline text; the shared behaviour stays in `release-manager.js`). The contract it now declares: from the source repository, `repo-workflows/skill-release.md` releases THIS skill; inside a governed project installed from the tarball, `references/workflows/release.md` releases that project; the installed skill does not promise to be able to release itself. `check-plan-delivery` resolves historical declarations of the moved paths to their new homes, so archived plans stay verifiable without rewriting history.

- **The release flow is split by audience: `release.md` (governed projects) and `skill-release.md` (this repo)** — one document carried three intents (release this skill · release a governed project · repo maintenance), and the seams showed as self-exemptions inside a policy meant for targets: a `validator.passed` row that exempted this repo, a version-sync step naming this repo's generator defaults, and a packaging step running `package-skill.sh`. `release.md` is now Governed Project Release only and contains no "this repo" clause; `references/workflows/skill-release.md` (NEW, SKILL-INTERNAL) carries the skill repo's own flow — three version places + tag (no `.governance/manifest.json`), the ADR-0006 statement that `verify_governance.js` is expected to exit 1 here **and must not be satisfied by fabricating a `.governance/`**, the archive-collision rule (a plan exists in three language trees, the 简体中文 copy is the archive candidate), the tarball whitelist + SHA-256 checksum, and the transactionality clauses. `npm run check:release` is now an alias for `check:skill-release`; `check:repo-release` covers repo maintenance.
- **Two INSTALLED release requirements no longer hard-gate on scripts a governed project does not have** — `plan.delivery_verified` demanded `check-plan-delivery.js` exit 0 with ❌ 停止发布, and `docs.parity_passed` named `check-doc-parity.js`; both are SKILL-INTERNAL, so a target following its own installed rule was told to run a file it does not possess. Both are now stated as the obligation (delivery is reconciled; multi-language trees are parallel) with the mechanical checker as a conditional, matching the hedging the sub-skill already used. Same repair in Phase 4 step 3.
- **The two-axis model (distribution role vs portability) is documented** — `docs/{en,zh-CN,zh-TW}/architecture.md` now separates *where a file goes* from *whether its content holds where it is read*, with the four-audience table, per-file portability examples, and the three rules that follow (INSTALLED content must be project-portable · validate in the execution environment, never the authoring one · stage-portability is part of it).

- **Reference-closure check is now a stated obligation, not a lesson learned twice** — asked whether this repo's rules and the governed-project rules were mixed together, two successive answers classified files, named single sources of truth, reported green gates and concluded the boundary was sound. The third question — "does every reference resolve in the target environment?" — found 18 real defects. The difference was not diligence: nothing in `AGENTS.md`, `SKILL.md` or the policies had ever asked for a reference closure, so a directory inventory satisfied the letter of the rules. Three landing points now require the route to be walked instead of the map to be read: `AGENTS.md` § Reference-closure check (repo contributors — reference closure, stage closure, clean-target verification, forbidden reverse edges, plus the standing warning that gates verify declarations and never closure), `SKILL.md` § Audit 流程 step 3 (a skill executor auditing a governed project must confirm that what `AGENTS.md` / `docs/rules/*` / the generated sub-skills reference actually resolves THERE — artifact-existence checking does not cover a rule file that exists in full and points at nothing), and the principles index so the rule is discoverable at all.

### Fixed

- **A Phase A project received an `AGENTS.md` commanding scripts that Phase B installs** — the artifact is written at Phase A while `verify-governance.js`, `check-lock.js`, `check-git-policy.js`, `check-secrets.js` and `check-sync.js` arrive at Phase B and the doc gates at Phase C, so a freshly bootstrapped project's own rules ordered the agent to run files that did not exist. The generated `AGENTS.md` is now pruned per stage (`<!-- phase:A -->` / `<!-- phase:B+ -->` / `<!-- phase:C -->`) and Phase A states plainly that initialization is incomplete. Because the six `docs/rules/*.md` policies are Phase A **copies** (verbatim, unprunable) that legitimately describe the standard verification sequence, the Phase A banner also rules on them: their script obligations are **deferred, not waived** — a missing gate is never a passed gate.
- **The first version of that fix silently froze every project at its bootstrap state** — templates are written with `writeIfAbsent`, so the Phase A rendering survived every later stage: measured, an A → B → C sequence still displayed the "initialization is incomplete" banner and still lacked every gate requirement whose scripts Phase B and C had just installed. Staged artifacts are now upgraded in place, but only when the file on disk is byte-identical to an earlier phase's rendering of the same template; a locally modified file is never overwritten and is reported as such. An incremental A → B → C now produces a file byte-identical to a fresh Phase C install.
- **The phase-marker grammar failed silently in three ways** — an unclosed marker dropped the entire remainder of the file (taking "never force push" and the protected-file list with it) while reporting success; a nested block's closing marker resurrected content the enclosing block excluded; and a typo like `phase:A+` was accepted and excluded from every stage. The grammar is now strict — unknown spec, stray close and unclosed block are hard errors reported as artifact errors (no stack trace, nothing written for that file) — and the phase-dependent skill registry is rendered per phase so the upgrade comparison cannot miss.
- **`--file` input ignored its own phase for template rendering** — a `{"phase":"C"}` input installed the Phase C artifacts but rendered `AGENTS.md` with the CLI default, producing a project whose rules and installed scripts disagreed within a single run.
- **The release-only clusters stopped being fail-closed at the moment they were needed** — the `check:release` split pointed the release entry at `--gate`-level checks, so pending-archive, archived-plan-status, changelog-coverage and translation staleness became advisory during release, while `AGENTS.md` still promised they were fail-closed. `check:skill-release` runs `check-doc-consistency.js --release-gate`, `check-doc-freshness.js --release-gate` and `check-plan-delivery.js --gate` again. The tests that should have caught this had been relaxed to bare substring matches (one asserted a `--release-gate` flag in a comment while asserting nothing about it in code, and the "repo-maintenance only" negative could be bypassed by nesting the forbidden gate behind `npm run check`); they now resolve npm aliases transitively before asserting, and a mutation guard covers the resolver itself.
- **Two shape guards hid the defects they were meant to tolerate** — `check-layout-sync.js` keyed "not applicable" on a missing `references/`, which also disabled the per-directory half-scan protection added in the same audit: deleting `references/` in this repo turned the gate green. It now keys on the three `docs/<lang>/architecture.md` trees. `check-role-completeness.js` treated a missing `references/init-spec.json` as "not this repo's shape", so deleting the distribution declaration passed the gate; it now distinguishes no-`references/` (not applicable) from `references/`-without-spec (a defect).
- **`SKILL.md` pointed the skill's own version rule at the governed-project document** — it cited `release.md`'s five-place consistency rule (which includes a `.governance/manifest.json` this repo does not have) instead of `skill-release.md`'s three places + tag.

- **The protected-files cluster was inert and is now a real check** — `check-doc-consistency.js` scoped the policy table with `slice(0, search(/\n## /))`, but the policy's own `## 受保护文件` heading precedes its table, so the window closed before the first row: `protectedPaths` was permanently empty and the entire enumeration cluster never executed — in this repo and in every governed project. The gate AGENTS.md advertised as "always-on" had been passing vacuously. Root cause was two-layered: after fixing the parse, the blanket pointer exemption still swallowed every remaining file, so the cluster stayed at zero enforcement. The check is now **declaration-correctness**, not completeness: a pure pointer is skipped; a partial list plus a pointer may omit entries but every entry it DOES declare must exist in the authoritative list; an enumeration without a pointer must be complete; a declared path that is renamed, removed or never existed always fails. Declarations are parsed from fenced code blocks, tables and lists alike (SKILL.md and the AGENTS.md template use code blocks, which were previously invisible). A policy source that yields zero rows now reports a parse defect instead of passing green. Four regression tests use the real document shape and were verified to fail against the pre-fix script.
- **`check:payload` skipped the gate that guards payload edits** — the tier AGENTS.md documents for `references/` + `SKILL.md` changes omitted `check-doc-consistency --gate`, the cluster owning the consent markers and protected-files list that live in exactly those files; deleting a consent clause and running the documented tier returned green. `check:docs` symmetrically omitted `docs:layout`. Both compositions now match the scope table and a test pins them.
- **CI ran 2 of 6 gates** — the workflow ran only `npm test` + `docs:parity`, so layout, consistency, hygiene and role-completeness never blocked a build while AGENTS.md claimed "fails CI … enforced, not optional". CI now runs `npm run check`; the `verify_governance.js` badge step keeps `|| true` by design (ADR-0006).
- **`plans:delivery` never gated** — `npm run plans:delivery` ran without `--gate`, so `check:all` could not fail on an undelivered plan declaration despite release.md requiring `plan.delivery_verified`.
- **SKILL.md frontmatter version had no backstop** — the version regex required quoted forms, so unquoted YAML `version: X.Y.Z` never matched and a release could ship a stale skill version through every gate. The frontmatter block is now parsed and compared, fail-closed.
- **Archived plans could keep claiming they were pending archive** — the plan-status cluster scanned only `docs/*/plans/`, so 19 of 21 files in `docs/archive/` carried a non-canonical or missing Status line (several still read 已实现（待 Release 归档）— a pending-archive claim inside the archive). `docs/archive/` is now scanned under the rule "archiving asserts completion" and all 21 files were normalized, preserving prior status text as a parenthetical note.
- **The release flow a governed project actually executes was the deficient copy** — `release.md` is SKILL-INTERNAL, so the operative version is the release-manager section of `sub-skills.md`, which carried 3 of 6 requirement markers (`docs.parity_passed`, `sync.passed`, `plan.delivery_verified` missing) and a Phase 4 without the release-only gates or the packaging step. Both are restored and a test asserts the marker set stays a superset.
- **zh-CN/zh-TW architecture pages asserted the opposite of the English page** — both stated the role-completeness gate is currently red pending adjudication of two files; those were resolved when the role table shipped and `undecided` is empty. The stale count "13 static inline-content artifacts" (actually the number of artifacts without a `source`) was replaced with a type reference in all three trees.
- **Two governance rules had two authorities each** — `governance-files.policy.md` carried a `.governance/README.md` template that nothing consumes (the generator emits the `init-spec.json` variant), now reduced to a pointer; the `governance-validator` sub-skill's Checks line omitted five of the validator's DEFAULTS entries (lock, git policy + its json, secret scan, sync groups), now complete with a pointer to `DEFAULTS` as the authority.
- **The permission matrix disagreed with itself** — the generated AGENTS.md template carried a "Modify 3+ Files at Once | confirmation required" row that SKILL.md's matrix (the indexed authority) lacked, though the rule is real (`lifecycle.policy.md` § 规模分级). The row is now in both and a test keeps them equal.
- **`initialize project governance` was advertised but never declared** — the three commands.md manuals promoted it as the primary INIT trigger while SKILL.md's description declared only `initialize governance`; found by the new reverse prompt-sync check and fixed at the source.
- **`check-plan-delivery.js` ignored `##`-level Affected Files sections** — the section anchor was the literal `###`, which matches inside `####` but never inside `##`, so a plan using an H2 heading had every declaration silently dropped while the script still printed "every declared path/identifier delivered". The shipped plan template uses H2, so plans written to this skill's own template were unverifiable in governed projects. Heading levels H2-H4 are now accepted, with the stop-boundary scoped per level so deeper subsections stay in scope.
- **`check-secrets.js` reported "clean" for content it never read** — git prints `Binary files … differ` instead of content for blobs it treats as binary, whether auto-detected (NUL bytes) or declared via `.gitattributes` (`binary` / `-diff`), so a staged secret in such a file passed the gate. Verified: a key in a `-diff` marked file, a `binary` marked file, and a real NUL-byte blob all returned clean. The staged blob is now read back with `git show :<path>` and scanned; anything still unreadable is reported as UNSCANNED instead of counting toward a clean result.
- **`check-sync.js` could never satisfy the default feature-registry group** — the template documents a trailing-slash directory form and the shipped default config uses it (`require: ["docs/features/"]`), but `globMatch` never implemented it, so that group produced a permanent false BLOCK in every INITed project. Trailing-slash prefixes now match. Additionally, wildcard-segment patterns (`packages/*/src/**`, `**/*.ts`, `src/*.ts`) silently matched nothing — a rule the project believed it had but that could never fire; unsupported forms now block loudly instead of passing green.
- **`check-layout-sync.js` half-scanned after a directory rename** — the emptiness guard fired only when BOTH roots vanished, so renaming `references/` left `scripts/` alone carrying the check while the gate still printed a confident green line with a plausible file count. Each configured root must now contribute files.
- **The installed release-manager sub-skill told governed projects to run scripts they do not have** — this change set initially added `check-plan-delivery.js`, `check-doc-parity.js` and `package-skill.sh` calls to `references/templates/sub-skills.md`, which is INSTALLED; all three are SKILL-INTERNAL and absent from a governed project, and one of them sat in a hard "all exit 0 before anything is written" gate. They are now expressed as obligations (reconcile Affected Files, use the project's own packaging command) rather than commands, and a test pins the rule that sub-skills.md must not invoke a SKILL-INTERNAL script.
- **`check-plan-delivery.js` scanned only the first Affected Files section** — the first repair accepted H2-H4 but returned on the first matching level, so a plan carrying both `## Affected Files` and a later `### Affected Files` had its H2 declarations silently dropped, and a second same-level section was never read. All matching sections at all three levels are now scanned and concatenated, each stopping at its own same-or-higher-level boundary.
- **Every generated project's protected-files summary was unverifiable** — `references/templates/agents-md.template.md` wrote its list as a comma-separated prose sentence, a shape the declaration parser could not see, so the summary in every INITed project could drift from the policy with the gate staying green. The template now emits a Markdown list (same 19 entries, verified one-to-one against the policy), and an end-to-end test generates a project, renames one entry in the installed `docs/rules/governance-files.md` and asserts the gate turns red.
- **Declaration parsing covered only three of seven shapes** — ordered lists, inline prose enumerations, indented code blocks and any second block in the same section all evaded the protected-files check; because an unparsed shape yields "declares nothing", it also collapsed the completeness rule, not just the stale-entry rule. All four shapes are now parsed. The governance-path matcher also stopped under-matching (`verify_governance.js` and any script not named `check-*`/`verify-*` were invisible) and over-matching (`.github/workflows-backup/` was swept in), and directory coverage now handles a slash-less `docs/rules**`.
- **`references/` was never in the consistency scan set** — the file list was four top-level files plus `docs/`, so the INSTALLED policy and template bodies — including the agents-md template that becomes every governed project's AGENTS.md — were never examined by any cluster. This, not wording or block shape, was why the template stayed exempt after its section already parsed correctly. Adding the tree immediately surfaced a real stale version example in `references/workflows/release.md` (0.8.0), now fixed.

### Changed

- **`scripts/release-manager.js` adjudicated from SKILL-INTERNAL to INSTALLED** — the generated release-manager sub-skill invokes it three times, but INIT never installed it, so a governed project's release flow stopped at the tag step on a missing file. The script requires no sibling module and reads nothing from the skill repo (its only `references/` mention is a comment), so it satisfies the self-containment invariant and the classification was simply wrong. Removing the calls instead was rejected: it would have taken `--yes`, the headSha binding and the clean-tree recheck out of the release path, i.e. traded a broken flow for a weakened one. Roles are now INSTALLED 23 / SKILL-INTERNAL 9 / undecided 0.
- **prompt-sync is now a gate cluster and checks both directions (ADR-0008)** — the trigger inventory in `commands.md` was simultaneously forbidden by AGENTS.md's "never restate skill content" rule and mandated by the sync-group rule, while the check itself was advisory and only detected missing entries. ADR-0008 adjudicates the conflict: the inventory is a deliberate, controlled copy with authority staying in the skill sources. The cluster is fail-closed under `--gate` and now also reports a trigger the manual advertises that no skill source declares. Main-skill mode triggers (`SKILL.md`) and sub-skill triggers (`sub-skills.md`) are both recognized as authorities.
- **AGENTS.md gate-cluster inventory updated** — six always-on clusters (adds prompt-sync and the frontmatter version sync point) and an archived-plan-status cluster at release; the "never restate" rule now names the trigger-inventory exception explicitly.
- **`npm run check:release`** — the release-only clusters (pending-archive, archived-plan status, changelog coverage, translation staleness) previously ran only when a human typed `--release-gate` while following release.md prose. The new entry makes that documented step a runnable command. It is deliberately NOT wired into CI: pending-archive is legal in the window between task completion and the release commit.
- **`release-manager.js execute` no longer lets a signed tag imply "reviewed"** — `reviewStatus` is a caller-supplied string and `plan` never emits `completed`, so the high-risk guard verifies a declaration, not that a review happened. It now says so explicitly on stderr. Binding it to verifiable review evidence needs a review-evidence artifact and workflow, which today's requirement does not independently justify — deferred rather than invented.

## [0.13.0] - 2026-09-05

### Added

- **Repository-owned line endings** — new `.gitattributes` (`* text=auto eol=lf`, `*.sh` forced LF, binary suffixes marked) plus the matching rule in `references/policies/coding.policy.md`. The index was already 100% LF, but only because contributors happened to have compatible `core.autocrlf` values — a machine configured differently could commit CRLF blobs and turn later diffs into whole-file changes.
- **Distribution-role completeness gate** — new `scripts/check-role-completeness.js` (SKILL-INTERNAL, wired into `npm run check` via `--gate`): every file under `references/` + `scripts/` must be classified as INSTALLED (in `init-spec.json` artifact `source`) or SKILL-INTERNAL (in `distribution.skillInternal`); no overlap, no stale declarations, and the packaging boundary (`package-skill.sh` copy list) must match the union of both roles. Two previously unclassified files (`governance-files.policy.md`, `feature-doc.template.md`) adjudicated into INSTALLED — the former is the protected-files list that the installed `check-doc-consistency.js` reads at runtime (now also installed as `docs/rules/governance-files.md`), the latter is the feature-doc template `SKILL.md` already tells agents to copy.
- **Scope-tiered verification entries** — `npm run check:docs` / `check:payload` / `check:tests` / `check:full` supplement the full `npm run check`, so agents can run only the gates relevant to their change scope. `AGENTS.md` validation section rewritten with a scope table, evidence tiers (mechanical / human-attested / unverified), and an "escalate on uncertain scope" rule.

### Changed

- **Test helper consolidation (anti-patch plan §3, batch 2)** — the 17 helper functions and 7 path/text constants that batch 1 left duplicated between `tests/run-tests.js` and the suites now live once in `tests/support/helpers.js`; the entry is down to 56 lines (runner + summary + support mirroring) and every duplicate definition is gone (verified: 0 duplicate helpers, 0 duplicate consts).
- **`check-doc-consistency.js` evidence tiers** — `--json` output now includes an `evidence` field mapping each cluster to `mechanical` / `human-attested` / `unverified`. Responsibility frozen: new checks may only be added when existing scripts cannot host them.
- **`docs/{en,zh-CN,zh-TW}/architecture.md`** — distribution-role table no longer carries hand-maintained counts (point to `check-role-completeness.js --gate` output instead). `docs/{en,zh-CN,zh-TW}/bootstrap-output.md` — Phase A artifact table updated to reflect the two new INSTALLED files.

### Fixed

- **`check-doc-consistency.js` principles-index false positive** — check 9 scanned every Markdown table row in `AGENTS.md` for backticked paths, so the scope-tiering table's `architecture.md` (a bare filename in a "when to use" cell, not a pointer) was read as a broken index pointer and turned `npm run check` red. The scan is now scoped to rows whose Scope column holds a known value (`payload` / `both` / `repo`), which is what distinguishes the principles index from the other tables in the file.

## [0.12.0] - 2026-09-04

### Added

- **Terminology gate** — `docs/glossary.md` gains optional `Forbidden zh-CN` / `Forbidden zh-TW` columns registering renderings that must not appear in that language tree (e.g. protocol: zh-TW uses 協定, never 協議). `scripts/check-doc-consistency.js` scans the language trees and reports `terminology_usage`, fail-closed under `--gate`/`--release-gate`, with a per-line escape hatch `<!-- i18n: allow X -->` for deliberate source-form quotes (trigger words stay unregistered by policy). Structural parity could never catch this class: term drift and simplified/traditional leaks are structurally identical. No glossary (governed projects) → the check no-ops.
- **Coding hygiene gate** — new `scripts/check-coding-hygiene.js`, wired into `npm run check`: fail-closed on monolith test registration in `tests/run-tests.js` (any quote style) and on an empty `tests/suites/*.test.js` (tests lost during migration); ownerless `TODO`/`FIXME`/`HACK` markers are advisory only. It ships inside the tarball because packaging copies `scripts/` wholesale, but is NOT declared in `init-spec.json` — run outside this repo's suite layout it reports `applicable: false` and exits 0. Anti-patch plan §5 mechanical subset; the non-mechanizable claims (root cause correctness, semantic quality of a fix) are explicitly refused rather than faked.
- **Translation freshness** — `scripts/check-doc-freshness.js` derives per-pair translation status from git instead of a handwritten manifest: 简体中文 is the source, `docs/en/**` and `docs/zh-TW/**` its translations. A source committed after its translation — or carrying uncommitted edits — marks the translation `stale`; a same-commit pair reports "synchronized commit" and explicitly does NOT claim translation correctness. `<!-- i18n-status: draft -->` marks in-flight work (tolerated daily, blocked at release) and `<!-- i18n-reviewed: <sha> -->` records a human verdict for pairs where the source moved but the translation was already correct. New `--release-gate` mode exits 1 on stale or draft translations; the default stays advisory (exit 0). Projects without trilingual trees no-op.
- **Engineering restraint (machinery test)** — `references/policies/coding.policy.md` gains a compact Engineering Restraint / Machinery Test section: unapproved machinery must justify itself ("if this did not exist today, would current requirements independently justify it?"), approved requirements always win (conflicts escalate, never silently trim), and semantic seams stay legal. `SKILL.md` points at it. Deliberately no new gate, field, review step, plan section, or distribution surface — the section ships through the existing docs/rules copy channel.
- **Root-cause repair protocol + failure budget** — `references/policies/lifecycle.policy.md` gains the repair-domain protocol (anti-patch plan §1–2): reproduction-first plan fields for medium/large bug fixes, regression test must fail before the fix, `repairSessionId` binding (attempts grouped, reset only by developer adjudication), failure budget with escalation levels (1st re-understand, 2nd expand + review-manager, 3rd stop and re-plan), and evidence-based success criteria (gates pass with real output, not "last command green"). Ships to governed projects via docs/rules/lifecycle.md.

### Changed

- **Test architecture split** — the 2503-line `tests/run-tests.js` monolith became a single discovery entry (runner + shared helpers + summary) plus eight domain suites under `tests/suites/` (validator, security, consistency, docs, release, generator, payload, hygiene). Migration was verbatim and set-reconciled: the 180 pre-split test names match the post-split set exactly (0 missing, 0 extra), then grew to 193 with the hygiene, role-completeness and payload coverage. Batch 2 (consolidating shared helpers into `tests/support/`) is deliberately deferred — the shared scope is preserved so behavior and output stay identical. Anti-patch plan §3.
- **ADR-0007** records the governance-plan architecture: engineering restraint and anti-patch stay independent with orthogonal trigger conditions (adding machinery vs handling repeated failure), bridged by boundary clauses only — no hierarchy, no third authority source.

### Fixed

- zh-TW simplified-character leaks corrected (模板→範本 in architecture/bootstrap-output, 检查→檢查 and 安装→安裝/扫描→掃描/意图→意圖 in skill-discovery and the skill-lifecycle plan) — surfaced by the terminology registration scan; the gate itself flagged the 模板-class leak on its first run.
- `docs/en/commands.md` was left out of the v0.11.3 trigger realignment; it is now recorded as reviewed against the source commit.
- SKILL.md embedded manifest examples still showed 0.11.2 after the v0.11.3 release.
- **Review fixes for both gates** (each verified by mutation or probe):
  - Translation freshness no longer false-blocks the documented workflow — source and translation edited in ONE uncommitted changeset are "in flight", not stale (previously every pre-commit release-gate run of a normal doc task failed).
  - An untracked translation reports its own `uncommitted` status instead of silently passing as `translated`; a recorded `i18n-reviewed` marker that no longer covers the source goes `stale` again; `reviewCoversSource` now uses `merge-base --is-ancestor`, so a descendant or bogus SHA can never claim coverage.
  - The glossary parser is fail-closed: aligned separator rows (`:---:`) are no longer misregistered as forbidden variants, each table re-declares its header, and a glossary that exists but cannot be parsed is REPORTED as a governance data defect instead of silently disabling the gate. The report gains a `termsRegistered` count (positive proof the parser ran).
  - Root `README.md` / `CONTRIBUTING.md` (the English landing files per the language policy) are now freshness-paired with their zh-CN originals.
  - Docs sync: drift-check freshness/consistency mode text no longer claims "NEVER a gate / exit 0 always"; lifecycle, AGENTS.md and init-spec labels state the fail-closed forms; the glossary documents the trigger-word registration policy and the in-table limitation of the exemption marker; the plan ×3 reflect the delivered enforcement strength.
  - Tests: the two vacuous assertions (same-commit `why`, positive parser-run marker) fixed; 8 tests added covering stale-release-gate blocking, bogus SHA, untracked translation, same-changeset workflow, zh-CN leg, preceding-line exemption, malformed glossary and the aligned-separator regression.

## [0.11.3] - 2026-09-04

### Added

- **Generated-skill integrity check** — `scripts/verify_governance.js` now verifies every subdirectory of `.governance/generated/skills/` carries its `SKILL.md` (via `lstat`, so a symlinked SKILL.md is not counted); deleting one skill's file is no longer masked by a directory-only manifest entry. Manifest artifact paths are also containment-checked via `realpath`, so a crafted `.governance/manifest.json` cannot turn the validator into an out-of-tree stat or let an in-tree symlink point outside ROOT.
- **Doc-only exemption in changelog coverage** — a change touching only project knowledge docs (`docs/**` — **not** `docs/rules/**`, which are governed-project rule files), README, CONTRIBUTING, AGENTS.md, CHANGELOG or LICENSE no longer triggers the "changelog required" report (repo rule: doc-only edits carry no CHANGELOG entry); mechanism changes (`references/`, `scripts/`, `SKILL.md`, `package.json`, `.github/`, `docs/rules/` in governed projects) still require it.

### Fixed

- **Phased-init contract** — the generated skill registry now states that skill files under `.governance/generated/skills/` are written in Phase C (entries are reference-only until a complete init), instead of silently advertising unloadable entries after Phase A/B.
- **Script-runtime guidance in generated AGENTS.md** — scripts are run when the selected skill, AGENTS.md or the operating lifecycle rules require them (the lifecycle validation phase itself invokes gate scripts), not "only when a skill instructs".
- **`release-manager` tool boundary** — `scripts/release-manager.js` is documented as the tag executor (tag creation only; GitHub Release, packaging and uploads are orchestrated by the release-manager sub-skill).
- **Registry density** — generated skill registry rows keep a one-clause purpose and up to three main triggers; the full trigger inventory stays in each generated `SKILL.md`.
- **Changelog-coverage cluster attribution** — the changelog coverage check is fail-closed only in `--release-gate`; docs (architecture.md, roadmap.md) now state that accurately.
- **Whole-project review findings** (lightweight audit, 5 domains — all verified before fixing):
  - *Fixed*: `init-spec.json` `governance_version` default 0.10.1 → 0.11.2 (fresh INITs were stamped with an outdated version; the generator's sentinel was subordinated to the spec default).
  - *Fixed*: `.gitignore` now carries the full `check-git-policy.js` required patterns (`!.env.example`, `credentials.json`, `secrets.*`) — the repo matches the baseline it enforces.
  - *Fixed*: `governance-files.policy.md` — `sync-rules.json` added to the tracked-governance-state table; `check-doc-freshness.js` added to the protected-files list (+ synced into `git.policy.md` and the generated AGENTS.md protected list; the generated AGENTS.md permission matrix now points at the protection flow for governance files).
  - *Fixed*: `release-manager.js` sanitises the tag message summary (control chars stripped, bounded length); `check-lock.js` strips control characters from echoed lock values.
  - *Fixed*: `check-plan-delivery.js` no longer matches a bare path prefix (`.governance/validation.json.bak` was accepted as the artifact).
  - *Fixed*: `generate-governance.js` `--file` input phase is respected unless `--phase` is explicitly passed.
  - *Fixed*: `check-doc-freshness.js` validates `doc_root` containment (absolute/`..`-escaping manifests fall back to `docs`).
  - *Docs*: zh-TW commands.md trigger list aligned with the source trigger (`审核一下`), simplified-vs-traditional leak in zh-TW workflow lines corrected; README "Next up" re-aligned with the roadmap (all four listed features already shipped); roadmap maintenance rule + Done-section `[x]` consistency cleaned (horizon chain no longer references the removed 5th horizon).
  - *Tests*: `generic-connection-string`, `github_pat_` form, modified-file hunk line numbers, and `check-sync --advisory` are now covered (the first two are payload scripts shipped to every governed project).
- **Second-pass review: regressions from the first pass, fixed** (each reproduced before fixing):
  - *Fixed*: validator containment no longer fails a project reached through a symlinked/junctioned root — the baseline is realpath'd too (previously 6/23 checks passed via a junction, 23/23 direct). Escape detection is segment-based, so a legitimate `..config.yml` is no longer rejected.
  - *Fixed*: changelog coverage is an allowlist again (`SKILL.md`, `package.json`, `references/`, `scripts/`, `.github/`, `docs/rules/`, `.governance/`, `.githooks/`). The first pass had inverted it into a denylist, which made an ordinary `src/` edit — or a single untracked scratch file — fail the release gate in governed projects.
  - *Fixed*: generated-skill checks now reject a skill DIRECTORY linked out of the tree (`lstat` alone only guarded the final path component, and `Dirent.isDirectory()` silently dropped junction entries instead of failing them). The skills-tree read is also wrapped: an unreadable tree is a governance verdict, not a crash.
  - *Fixed*: `--file` phase now actually drives generation (the resolved phase feeds artifact filtering, the registry note and the JSON report; previously it was written to the inputs object and never read).
  - *Fixed*: registry trigger capping handles both `,` and `·` separators, and the purpose clause has a hard character cap — the longest row (review-manager) had escaped truncation entirely.
  - *Fixed*: the Phase C availability note keys off disk state, so a phased `A` → `C` init no longer strands a stale "pending" note in a completed project.
  - *Fixed*: plan-delivery matches directory artifacts by path boundary (`frag + "/"`), restoring descendants of `.governance/generated/skills` while still rejecting `…/validation.json.bak`.
  - *Fixed*: control-character sanitisation covers every interpolated field (`check-lock` agent_id/task_id, validator artifact names) and the tag message now also strips U+0085/U+2028/U+2029 and slices on a code-point boundary.
  - *Docs*: the always-on gate cluster count corrected to four (principles-index was missing) in AGENTS.md + architecture.md/roadmap.md ×3; `sync-rules.json` added to the policy's own `.governance/README.md` template; SKILL.md protected summary re-synced; `.gitlab-ci.yml` added to the single source of truth; CONTRIBUTING's "where does a file go" rule no longer contradicts the docs classification ×3; validator.md documents the generated-skills checks ×3; the release flow now lists the two generator version defaults as sync points; the release-manager tool boundary no longer cites a workflow file governed projects never receive.

## [0.11.2] - 2026-09-03

### Fixed

- **Consistency-gate changelog coverage is section-scoped** — the required change category must sit *inside* the section that carries the record (daily: the `[Unreleased]` section; release time: the topmost versioned section after the standard `[Unreleased]` → `[X.Y.Z]` rename). A category in an older section no longer satisfies an empty newest section — previously the gate passed vacuously when an old versioned section carried any category (found during v0.11.1 release validation and re-audited afterward).

## [0.11.1] - 2026-09-03

### Added

- **Planned Archive Gate** — canonical, machine-readable TASK-plan status keywords (`design plan, not implemented` / `Active` / `implemented` / `Completed` / `archived`, contract in `references/policies/lifecycle.policy.md` Phase 2): an unknown status fails the always-on consistency gate; an implemented/Completed plan still sitting in `docs/*/plans/` is pending-archive — advisory in everyday checks (the documented lifecycle lets it wait for the release commit), fail-closed only in the new `--release-gate` mode wired into release.md Phase 4 step 3. `check-doc-consistency.js --json` gains a per-plan status classification plus a pending-archive count (machine-queryable completion-progress view). The delivery gate's Affected-Files extraction no longer truncates at `####` subsections (previously such sections extracted as empty and their declarations were verified vacuously).

### Fixed

- **Governance protection and secret-scan documentation alignment** — `scripts/check-doc-consistency.js` is now included in the protected-file list and all synchronized summaries. Clarified that the repository's `tests/` secret fixtures avoid regex matches by construction; the scanner does not grant a path-based `tests/` exemption.
- **Git policy security baseline** — `scripts/check-git-policy.js` now fails closed when a governed project `.gitignore` omits required environment, key, certificate, or credential patterns.
- **Release documentation coverage** — the consistency checker now reports governance/payload changes without an `[Unreleased]` CHANGELOG category and enforces that requirement during `--release-gate`.

## [0.11.0] - 2026-08-30

### Added

- **Opt-in commit-consistency hooks** — INIT now generates executable `.githooks/pre-commit` and `.githooks/commit-msg` scripts that fail closed without `.governance/consent.json`, preserve Unicode/space filenames through NUL-delimited Git output, and verify the confirmed commit message. INIT never enables `core.hooksPath`.

### Changed

- **Rule capture and change hygiene** — governed-project agents now collect developer-stated persistent requirements for explicit adjudication before rule-file writes, preserve resumable candidates in `state.json`, and apply current/compatibility/history surface checks across deletion, rename, migration, replacement, deprecation, API/config and generated-artifact changes.
- **Secret scanning coverage** — staged-diff scanning now covers Slack, Google, Stripe, Azure, JWT, base64/PEM material, connection strings, and punctuated credential values; force-added `.env` files are scanned, `tests/` is not a global bypass, and reports include real added-line numbers.
- **Fail-closed state handling** — malformed lock, sync-rule, or Git-policy JSON is no longer treated as an absent/safe configuration.
- **CI validation** — an empty `.github/workflows/` directory no longer satisfies the default CI workflow check.
- **Release risk gating** — Release Proposals now include risk/review metadata; high-risk execution requires completed review evidence or explicit item-by-item risk approval, and malformed JSON inputs fail with controlled errors.
- **Generated security baseline** — INIT-generated `.gitignore` now covers certificate bundles, private keys, credential files, secret filenames, logs, and other policy-declared sensitive artifacts.

### Fixed

- **Sync and documentation edge cases** — sync checks now handle untracked, renamed, Unicode, and space-containing paths; archive Markdown links are checked on Windows and stale archive links were corrected.
- **Generator version drift** — generated manifests use the skill package version by default, and fenced-template extraction stops at the first matching fence.

## [0.10.1] - 2026-08-29

### Fixed

- **review-manager audit (whole-project, lightweight): 17 confirmed defects fixed** — a full audit surfaced 23 findings; each was verified against its source and 17 were confirmed real and fixed, the rest evaluated as non-issues or intentionally-deferred. Script-logic fixes: `verify_governance.js`'s manifest-mode "Sync groups check" assigned the `isFile` function reference instead of calling it, so it always passed even when `scripts/check-sync.js` was missing (a fixture relied on that always-pass; it now copies the script); `check-lock.js` treated `"locked": false` as a held lock and falsely blocked — it is now normalised to "no lock"; `check-sync.js` wrote an empty `checked_at` timestamp and mis-parsed rename entries (`R old -> new`), now both fixed; `generate-governance.js` defaulted `governance_version` to a stale `"0.9.0"` (two sites) and `readJSON` threw an unhelpful raw stack on malformed input; `check-layout-sync.js` crashed on a missing `references/`/`scripts/` dir instead of failing closed. Version consistency: `references/init-spec.json`'s `governance_version` default was `0.9.0`; generated `.gitignore` and `.governance/README.md` omitted `activity.jsonl` from git-ignored despite the policy declaring it so. Governance-alignment: `SKILL.md` and `references/templates/agents-md.template.md` protected-file lists now include `scripts/check-secrets.js` and `scripts/check-sync.js` to match the single source of truth; `references/policies/governance-files.policy.md` gained the `scripts/check-sync.js` row the template already claimed. Docs: `review-this`/`deep-review` added to the Available Prompts main table in all three `commands.md`; the badge link in the three `validator.md` files pointed at a non-existent `docs/validator.md` (now links the validator script); `references/templates/sub-skills.md` section 8 used a 3-backtick fence while every other sub-skill uses 4 (latent parse-break risk). CI: `.github/workflows/ci.yml` gained a `permissions: contents: read` block. Tests: 4 check-secrets pattern classes (github-pat / openai-style-key / private-key-header / credential-assignment) added; a bilingual consent-marker regression test added (exercised the Chinese `回显`/`命令序列`/`意图对齐`/`覆盖`/`非快进` branches). Suite 102 → 107.

- **`check-secrets.js` now ignores the repo's own `tests/` dir** — `run-tests.js` deliberately holds scanner fixtures (`AKIA...`, `ghp_...`, `sk-...`, and private-key-header lines) that must look real to exercise every pattern class, so the staged-diff gate would otherwise block the very tests that safeguard it. `tests/` is repo infrastructure, never shipped in the payload, so a token there is test data. Scoped: no payload or real-source path is exempted.

## [0.10.0] - 2026-08-29

### Added

- **Consent policy rewritten: one confirmation per change set (from `consent-policy-hardening` plan)** — the whole consent structure is rebuilt, not patched. The "each git write op needs per-turn confirmation" main rule and its two exception patches (release-sequence Exception B, explicit-instruction Exception A) are gone; replaced by a single principle: **before committing, echo the full git command sequence (files to add, each commit message with its type prefix, push target) and take ONE confirmation covering `add` → `commit` → `push`**. The user's write instruction ("push") triggers the echo — it is NOT the consent itself; the ambiguity that let the executor treat the instruction as consent is removed. Plan approval is demoted to **intent alignment** (align "what/how", not a commit authorisation); size tiering is demoted to deciding whether a plan document is written, never whether the user confirms. Across all five sync points (`AGENTS.md`, `references/policies/git.policy.md`, `references/policies/lifecycle.policy.md`, `references/templates/agents-md.template.md`, `SKILL.md`). New universal hard constraints: the echo IS the sequence (never deviate); any step fails → stop and report (never retry differently, never improvise); push rejected (non-fast-forward) → stop and report (never pull/rebase yourself); ambiguous remarks ("提交一下") → ask first. Independent confirmation (not covered by the pre-commit echo): `tag`, `reset`, `rebase`, `revert`, `merge`, force push, `clean`, `rm`, `restore`, `stash`, `pull`, checkout carrying uncommitted changes, amend of a pushed commit. `checkout -b` / clean switches are free. Gate sync: the consent-cluster markers now validate **five** sync points — `check-doc-consistency.js --gate` verifies `lifecycle.policy.md` too (its release marker is exempt by design since the lifecycle doc carries no release clause); each marker anchors on its own distinctive wording, so a section heading ("一次确认") or a bare `Approval Gate` mention no longer satisfies it; and markers that live only in git-flow files match the governed rendering by normalised basename, so `docs/rules/git-policy.md` is held to the release/mid-sequence/push markers as well.
- **INIT generator completed (Phase A + B + C)** — the generator now covers all 13 Phase-1 steps: CI workflow selection from `references/workflows/ci.md` by `--stack` (node/python/rust/go/java/cpp/docs-only) and `--ci-platform` (github writes `.github/workflows/ci.yml`, gitlab writes `.gitlab-ci.yml`, none skips); sub-skills generation splits `sub-skills.md` into 8 per-skill `SKILL.md` files under `.governance/generated/skills/`; structure-adaptive behaviour makes `--maturity` actually change strategy (L0/L1 full skeleton, L2 incremental, **L3 audit-only — reports without writing unless `--force-l3`**) and `--doc-root` retargets governance docs into an existing documentation root (manifest paths remapped accordingly). A containment guard now rejects any `--doc-root` whose resolved path escapes the target directory (e.g. `../../escaped`), so a crafted doc root cannot write outside the project.
- **Plan delivery: behavioural declarations** — plans can now declare behaviour that path checks cannot verify: `writes: \`<file>\` in \`<script>\`` / `wires: \`<id>\` in \`<file>\`` (中文：写入/接线). This closes the gap that let the sync-groups plan be archived while its drift-report write was missing — verified by removing the implementation and watching the gate fail.
- **Plan delivery gate** — `scripts/check-plan-delivery.js`: mechanically compares what a TASK plan DECLARED (Affected Files paths, wired identifiers) against what exists in the tree. Runs advisory in `npm run check:all` and **fail-closed before archiving** in the release flow (`release.md` Phase 4 step 3 + `plan.delivery_verified` precondition), so a plan can no longer be archived while parts of it were never delivered. Explicit normalisation table handles the known equivalences (three-language doc trees, runtime artifacts, governed-project-only files, bare filenames) to keep false positives out; plans marked `Status: design plan, not implemented` are skipped by design. Hardened: the identifier corpus excludes the checker's own source and CHANGELOG (a comment or a changelog entry describing a bug is not evidence of wiring); a runtime artifact matches by exact/prefix path or by normalised basename rather than a loose substring; and `--plan <missing>` errors instead of silently passing.
- **ADR-0006: this repo does not dogfood its own framework (P3)** — freezes a decision that was previously re-argued on every discussion and rested on a single line in AGENTS.md. Three reasons, ordered: (1) **risk mismatch** — the validator checks software-project artifact risks, while this repo's four actual incident classes (payload boundary breach, cross-domain rule drift, missing CHANGELOG entries, deletion of shipped artifacts) are covered by none of them, so dogfooding would produce a green validator beside unchanged risk — governance theatre, worse than no governance because it manufactures false assurance; (2) **circular dependency** — if the producer's governance ran on its own product, a product defect would disable the very mechanism meant to catch it (the `_lib.js` incident is the worked example); (3) **shape mismatch** — no `src/`, no registrable features, no component graph, so forcing the artifacts would create hollow ones, violating this framework's own anti-fabrication rule. The ADR also records the corollary: `verify_governance.js` exiting 1 here is a feature, gates are built from this repo's real failure modes rather than copied from the validator's check list, and the correct form of dogfooding is verifying INIT's *output* (the payload integrity gate), not governing this repo with the framework. Conditions for overturning the decision are stated.
- **Governance principles index + a gate that keeps it honest (P2)** — `AGENTS.md` gains a pointers-only index of all 18 governance principles (13 from `SKILL.md`'s policy layer, 4 from `references/workflows/release.md`, 1 from `init-spec.json`'s invariants), each row recording the authoritative source and whether it governs the payload, this repo, or both. The count comes from an actual inventory, not an assumption — an earlier draft asserted "14" from memory and was wrong. Because the index restates nothing, a moved or renamed source would silently turn every row into a false claim, so `check-doc-consistency.js --gate` gains check 9: every file referenced by the index must exist (verified by regression — pointing a row at a non-existent file turns the gate red). Governed projects have no such index and skip the check.
- **`Target` declaration on TASK plans (P2)** — every plan now declares `payload` / `repo-infra` / `both`, and `Target: both` requires enumerating the sync points per domain, so a cross-domain rule cannot be updated in one place only. The impact-face check compares the actual change set against the declared domain: an out-of-domain edit must be explained or reverted. Also codified: filenames written outside a plan's Affected Files section carry no backticks, since the delivery gate treats every backticked token in that section as a delivery declaration.
- **Three-layer judge rule for principle placement (P2)** — `AGENTS.md` now states where a new principle belongs: `SKILL.md` policy layer (what the skill executor must read on every run) vs `references/policies/` (content artifacts copied into governed projects) vs `AGENTS.md` (rules for this repo). Previously this split was inferable only from file roles, which is why "why is the permission matrix here but git policy there" had no answer.
- **Install-payload integrity gate** — 3 tests closing the blind spot that let a broken payload ship with a fully green suite: (1) a static invariant check — artifacts of type `copy` under `scripts/` must contain no relative `require()`, since INIT copies them into governed projects file by file; (2) copy-list vs reality — everything `init-spec.json` declares must actually be written by a Phase-C INIT; (3) an end-to-end load check — for each copied script in a generated project, every declared dependency is resolved on disk **and** the script is executed, asserting no `MODULE_NOT_FOUND`. Both layers were regression-verified by re-injecting the original defect (a sibling `require` absent from the copy list): the suite goes red with two complementary messages, one naming the offending source, one proving the payload is incomplete. Suite 78 → 81.
- **Self-containment invariant documented at its source** — `references/init-spec.json` gains an `invariants` block stating that copied scripts must run standalone (Node builtins only, no sibling `require`, no skill-repo file reads) and that the duplication between them is deliberate; each of the 7 payload scripts now opens with a `PAYLOAD SCRIPT` header carrying the same rule.
- **Validator and layout-gate edge-case tests** — 4 tests covering paths that previously had no coverage: validator with `.governance/` absent, validator with unparseable `manifest.json` (must fall back to defaults and still fail, never silently pass), `check-layout-sync` with a missing `architecture.md`, and `check-layout-sync` with an `architecture.md` that has no Repository Layout block.
- **DEBUG diagnostics on failure-tolerant writes** — the three `.governance/drift-report.json` update sites (`check-doc-freshness.js`, `check-doc-consistency.js`, `check-sync.js`) plus the manifest read in `check-doc-freshness.js` swallowed every error silently by design; they now report the cause under `DEBUG=1`, keeping the same exit-code behaviour.

### Changed

- `references/init-spec.json` — Phase C `shipped` corrected from `"later"` to `"v0.9.1"` (Phase C shipped in v0.9.0/0.9.1; the field was stale metadata).
- **`check-doc-consistency.js` gains `--gate` mode; protected-files trigger tightened** — the script's two mechanically checkable rule clusters (consent-sync and protected-files) are now fail-closed under `--gate` (exit 1 when they fail; the other six heuristics still report but never affect the exit code). This is the delivery of P1 from the governance-rule-sync plan. The consent cluster asserts the five current markers over every sync GROUP with at least one present path — this repo checks 5 groups; a governed project checks the 3 that exist and skips the absent ones, so `--gate` is meaningful in both shapes. The protected-files check now requires the enumeration claim and the "single source of truth" deferral to sit in the same section, so an unrelated mention elsewhere (e.g. the principles index table) no longer disables it; and it no longer flags documents that merely *mention* the protection flow, only those that claim to enumerate the list. `npm run check` now runs the script once with `--gate`; `check:all` drops its duplicate advisory invocation.
- **`release-manager.js` now requires `headSha` on execute** — the release-sequence blanket approval was scoped to a specific commit, but a hand-written proposal lacking `headSha` skipped the HEAD-identity recheck entirely. The field is now mandatory; `execute` aborts if it is absent.
- **`.githooks` pre-commit hook removed before release** — the consent-consistency hook (`references/templates/githooks-template.md` + its `init-spec.json` artifact) was drawn up but pulled from the release. It was off by default and gate-verifiable, but its credential file was not git-ignored, it failed open when `consent.json` was missing, and it ignored the commit message — enough security-bearing false claims that it should not ship. Re-doing it is a separate plan; the removal keeps the payload clean.

### Fixed

- **L3 audit mode still wrote the manifest** — the manifest is generated after the artifact loop and never consulted the audit flag, so `--maturity LEVEL_3_PRODUCTION` (documented as report-only) silently wrote `.governance/manifest.json` into a production repo. Now honours audit mode; `--force-l3` still writes.
- **Idempotency was unverifiable** — `ensureDir` unconditionally reported `created-dir`, so a second identical generator run claimed `generated 4 files` when it created nothing. Existing directories now report `skipped`; a repeat run is provably `0 created`.
- **Manifest under-reported the CI artifact on GitLab** — the CI artifact is declared as `.github/workflows/ci.yml`, but `--ci-platform gitlab` writes `.gitlab-ci.yml`, and the manifest's existence filter dropped it, leaving a real governance artifact unrecorded. The manifest now records the platform-specific path.
- **sync-groups plan: two undelivered promises** — (1) `check-sync.js` never wrote the `sync` section into `.governance/drift-report.json` (declared in the archived plan's Output); now written, git-ignored, failure-tolerant. (2) The resume scenario (`task_start_sha` already recorded → not recomputed) had no regression test despite being the plan's stated main risk; added, along with a drift-report write test.
- **SKILL.md Phase 1 duplicated the generator** — the 13-step prose restated what `init-spec.json` already defines (the single-source-drift risk the plan itself flagged). Phase 1 is now: Agent judgement (detection → generator inputs) → run the generator → Agent fallback for judgement-dependent parts (CLAUDE.md/tool entries, README language layout, real feature/architecture content, CI degradation, L2/L3 merging) → confirmation gates. Artifact lists live only in `references/init-spec.json`.
- **Missing `sync.passed` release precondition** — the archived `sync-groups-mechanical-check` plan declared it in Affected Files but it was never added to `release_requirements`; releases therefore never verified sync groups. Added, together with `plan.delivery_verified`.
- **Unimplemented generators silently passed** — `generate-governance.js --phase C` reported `1 skipped` with exit 0, making an unimplemented sub-skills generator look like success. Stub generators now exit 1 unless `--allow-stub` is passed explicitly.
- **Plan status was not machine-readable** — `rule-capture` carried no status marker, so delivery verification could not tell design-only plans from undelivered work. Plans now use an explicit `Status: design plan, not implemented` marker.
- **Obsolete declaration in an archived plan** — `governed-project-sync-groups` cited `sync-rules.template.json`; the delivered file is `sync-rules.template.md`. Corrected.
- **Install payload was broken by a shared-library refactor (reverted)** — an unreleased change extracted `argValue`/`readJSON`/`walk` into `scripts/_lib.js` and rewired 5 scripts to `require('./_lib.js')`, but `_lib.js` was never added to `references/init-spec.json`'s copy list. Every governed project created by INIT got scripts that die with `MODULE_NOT_FOUND` on first run. The full 82-test suite stayed green throughout. Reverted rather than patched: `init-spec.json` copies those scripts **file by file**, so self-containment is a load-bearing invariant and the duplicated helpers are its deliberate price. Also reverted in the same batch: a CI rewrite that deleted the v0.8.0 governance-badge artifact; `release-manager --force` (an undeclared bypass of protected-branch enforcement); `--version` (resolves `../package.json`); and two secret patterns shipped with no test coverage.

## [0.9.1] - 2026-08-21

### Fixed

- **Turn-scoped consent vs release sequence contradiction** — AGENTS.md / `references/policies/git.policy.md` / `references/templates/agents-md.template.md` stated that every git write op needs fresh per-turn confirmation (and explicitly that saying 发布吧 is not enough), while `references/workflows/release.md` states 批准覆盖本次 release 序列的全部写操作. The three consent clauses now carry the release-sequence exception: one Approval Gate approval covers the whole sequence (version sync → archive → commit → tag → push → release → asset upload), conditional on the shown Proposal and an unchanged working tree/HEAD. Surfaced by a real v0.9.0 release run where the agent asked for confirmation 6 times instead of once.

## [0.9.0] - 2026-08-21

### Added

- **Impact-face check** — before touching any public interface/module/file, agents must search its references (`rg`) and include found files in the Affected Files plan (Phase 2/3); at task end, Phase 6 compares actual changed files against the planned list (listed-but-unchanged → fix or justify; changed-but-not-listed → explain). Mitigates AI "skipped file" lapses; wired into lifecycle.policy.md, agents-md.template.md, AGENTS.md
- **Review manager sub-skill (implemented)** — 8th sub-skill template in `sub-skills.md`: multi-agent deep review of a change set (5 fixed review domains: correctness, consistency, security, performance, maintainability), severity-ranked findings, review scope = the planned `git diff` change set; wired into `commands.md` (Runtime Components prompt), `SKILL.md` sub-skill list, and `architecture.md`
- **Sync groups L2 mechanical check** — `scripts/check-sync.js` (zero-dependency, read-only): compares the task change set (commits since `state.json` `task_start_sha` plus uncommitted changes) against `.governance/sync-rules.json`; watch hit without require file = BLOCKED (exit 1), `--advisory` downgrades to exit 0, `--json` for CI; wired into `verify_governance.js` default and manifest check lists
- **Repository layout sync gate** — `scripts/check-layout-sync.js` (fail-closed, part of `npm run check`): verifies the Repository Layout tree in all three `docs/{en,zh-CN,zh-TW}/architecture.md` lists every file under `references/` + `scripts/`. Prevents the regression where skill files are added but the architecture doc (and any agent relying on it) goes stale; wired into the gate group so CI blocks instead of relying on agent diligence. AGENTS.md now mandates reading the layout before touching anything.
- **Developer docs reclassified (skill content out of docs)** — `docs/{en,zh-CN,zh-TW}/architecture.md` trimmed to repository layout only (concept map / operating modes / lifecycle pipeline / design principles moved to the skill body in `SKILL.md` / `references/`); `lifecycle.md` / `governance-model.md` / `anti-regression.md` reduced to developer summaries that point to the skill sources; `validator.md` keeps usage and defers the check list to `scripts/verify_governance.js`. The rule is now explicit in AGENTS.md: skill behavior lives only in `references/`; docs may summarize but must reference, never restate.
- **Governed-project anti-乱改 hardening (existing mechanisms only)** — 完善被治理项目的既有防乱改机制（不新增）：(1) AGENTS.md 模板 Documentation Map 增加内容分类（运行规则只在 AGENTS.md + docs/rules/，其余 docs 只引用不复述）；(2) 权限矩阵增加 Modify 3+ files at once → confirmation required；(3) lifecycle Phase 1 硬性要求未读完架构/feature 文档不得开始修改；(4) Phase 2 中/大型 TASK 计划须用户确认后才进实现；(5) Phase 4 验证必须附真实命令+输出摘录证据；(6) Phase 5 增加文档引用规则、不复述规则；(7) plan-manager 子技能增加计划展示+用户确认步骤；(8) tiered review gate 高风险默认强制 review-manager 全量审查。对应 skill 仓库侧已落地的同源问题：AI 弄不清架构、乱改已有内容、乱找地方写新内容。
- **Architecture doc content gate (fix wrong-but-present)** — verify-governance.js 的 Architecture doc 检查从 isFile 升级为 hasRealArchitecture：ARCHITECTURE.md 必须存在且不是 INIT 模板骨架（无占位符残留、Component Registry 有真实数据行），否则默认模式校验失败。堵住「架构文档存在但内容仍是空模板」的漏洞（缺陷 A/B 的机械部分）。sync-rules.template.md 默认组 watch 扩展至常见源码目录（src/lib/app/apps/services/packages/modules），防止非默认布局下架构联动不触发（缺陷 C）。
- **INIT scripted generator** — `scripts/generate-governance.js` (zero-dependency, deterministic): Phase A static skeleton (5 rules, AGENTS.md with resolved placeholders, CHANGELOG, README bootstrap, features/plans/ARCHITECTURE skeletons) + Phase B config/state/scripts (.gitignore, .env.example, .gitmessage, .governance/ state files with valid JSON, 5 scripts); reads `references/init-spec.json` (single source of truth); `--dry-run`/`--json`/`--phase A|B|C`; existing files skipped never overwritten; manifest generated last listing only artifacts that exist on disk, release field omitted for fresh INIT; e2e-tested (Phase B output passes verify-governance.js, byte-identical determinism on full trees)

### Changed

- **Scope-tiered lifecycle** — small changes (single file, <50 lines, no public-interface change) run Understand → Implement → Validate → Report only (skip Plan/Synchronize); medium/large run the full six-phase lifecycle with a TASK plan. Aligns with mainstream practice (tier by size, not one-size-fits-all)
- **CHANGELOG timing** — written at merge/release boundaries (per release flow), not per commit/task; small changes carry no entry
- **Tiered review gate** — release Proposal now carries `Risk level` (low/medium/high) + `Review recommendation` (none/suggested/required); high-risk changes (security/permissions/deletion protection/governance files) require review-manager or item-by-item confirmation; lightweight gates always run
- **Governed-project sync groups (L1)** — INIT generates `.governance/sync-rules.json` (declarative watch/require groups); Phase 5 mandates group-by-group reconciliation (watch hit + require missing = task not done); added to protected-files lists across all sync points (caught by the consistency check)
- **Review manager v2 — dual mode** — the 8th sub-skill now splits into lightweight (existing triggers: `review this` / `review the changes` / `audit recent changes` / `review my changes` / `审核一下`: 5 fixed domains, severity-sorted, fix + gates) and full audit (new triggers: `deep review` / `full review` / `audit everything` / `全面审查` / `彻底审查` / `逐行审查`: exhaustive change-set enumeration, line-by-line read of every changed file, dev-plan cross-reference, execution-level verification, distrust of gates, evidence-form report). Fixes the v1 gap where a review of just-written code could miss everything (confirmation bias + trusted-but-false gate results).
- **Review manager v3 — depth × scope（二维正交）** — 深度（轻量/全量）与范围（本次变更集/指定路径/全项目）拆成两个独立维度，消除 deep review 的语义歧义（此前只表示深度，直觉上易误解为全项目）。新增范围触发词 `review the whole project`·`全项目审核`（轻量+全项目）与 `全项目彻查`（全量+全项目，`audit everything` 归入此格）；指定路径通过附加路径参数表达（review <path> / 审核 <路径>）。scope 判定步骤写明三种取集方式；新增成本护栏（全项目×全量须先报文件数与预计耗时并等确认；全项目×轻量以机械检查+抽样为主，不承诺逐行）。release.md 高风险门禁明确为「全量深度 × 变更集范围」。
- **载荷路径口径统一：skill 主体一律按被治理项目结构** — 明确 `references/**`（含 plan-manager 子技能、release.md 发布规范）中的所有路径都按被治理项目结构书写（`docs/plans/`、`docs/plans/archive/`、`docs/rules/`、`DEVELOPMENT_PLAN.md`），载荷不承载 skill 仓库自身的目录差异；skill 仓库自身与之不同的路径映射（三语树 `docs/{lang}/plans/` → `docs/archive/` 共享单语归档、里程碑用 `docs/en/roadmap.md`）收口在 AGENTS.md（仓库基础设施，不随安装复制）。避免发布时按错路径归档。

## [0.8.0] - 2026-08-16

### Added

- **Governance score** — `verify-governance.js --json` outputs `score` (passed/total, unweighted v1); CI produces a shields.io `governance-badge.json` endpoint artifact (green ≥100% / yellow ≥80% / red otherwise)
- **Doc freshness check** — `scripts/check-doc-freshness.js` flags stale governance docs via `git log` commit dates (30d stale / 90d very stale, code-activity-aware; advisory only, exit 0 always); drift-check sub-skill template gains the `freshness` mode; results appended to `.governance/drift-report.json`
- **Doc consistency check** — `scripts/check-doc-consistency.js` flags cross-document contradictions (stale version examples, fragmented protected-file lists, stale ADR statuses, expired roadmap targets, broken links, wrong numeric claims; trilingual tree parity delegated to `check-doc-parity.js`); advisory only, exit 0 always; drift-check sub-skill template gains the `consistency` mode; results appended to `.governance/drift-report.json`
- **Standard verification procedure** — `npm run check` (gate group: tests + doc parity) and `npm run check:all` (gates + advisory freshness/consistency); lifecycle Phase 4 defines the governed-project validation sequence (lock → git policy → secrets → validator → test/lint/build → advisory)
- **Prompt-sync check** — `check-doc-consistency.js` now verifies every sub-skill trigger in `sub-skills.md` appears in all three `commands.md` (prevents new sub-skills/modes from silently missing their prompts); AGENTS.md documents the sync group (sub-skills → commands.md/validator.md/CHANGELOG in one change)
- **Roadmap decoupled from version numbers** — roadmap/README use time horizons only (near/mid/long-term), no `Target: vX.Y.Z` fields; versions are decided by actual delivery at release time (SemVer), not by plan commitments
- **5 new plan docs** — review-manager (8th sub-skill, multi-agent deep review), tiered-review-gate (risk-tiered release review), governed-project sync groups (L1 declarative + L2 mechanical check); commands.md prompt coverage completed (all 23 sub-skill triggers documented)

### Fixed

- Stale version examples in `SKILL.md` (0.5.1 → 0.7.1), missing `check-secrets.js` in anti-regression and agents-md.template protected-file lists — caught by the new consistency check during development
- INIT copy list now includes the advisory scripts (`check-doc-freshness.js`, `check-doc-consistency.js`; `check-doc-parity.js` on multi-language trees); drift-check template consistency mode no longer references scripts the governed project lacks
- `check-doc-consistency.js`: semantic version compare for roadmap targets (string compare misjudged v0.10.0 < v0.9.0); manifest `release.version` included in version-example scan; parity delegated check reports "unavailable"/"error" instead of falsely claiming pass; validator filename fallback (`verify-governance.js`)
- `check-doc-freshness.js`: ghost paths (in git history but not on disk) are skipped

## [0.7.1] - 2026-08-14

### Fixed

- `scripts/package-skill.sh` - builds the release payload tarball (`dist/ai-agent-governance-skill.tar.gz`, version-stable name) containing only `SKILL.md` + `references/` + `scripts/` + `LICENSE`; `.gitignore` ignores `dist/`
- Install payload defined in `SKILL.md` (the file every installing agent must read); README install sections rewritten with tarball-first flow; release flow gains step 10 (package + upload the payload asset with content verification)

## [0.7.0] - 2026-08-14

### Added

- `docs/glossary.md` - trilingual terminology table (single source of truth for term renderings)
- ADR-0005: trilingual split documentation (supersedes ADR-0003's single-file bilingual layout for developer-facing files)
- `scripts/check-doc-parity.js` - read-only structural parity check for the three language trees (heading/code-block/table/list signatures); wired into CI, `npm run docs:parity`, and the release precondition `docs.parity_passed`; covered by 3 tests
- Install payload defined - the skill is `SKILL.md` + `references/` + `scripts/` + `LICENSE` only; docs/tests/package.json/.github/README/CONTRIBUTING/CHANGELOG/AGENTS.md are repo infrastructure and must not be copied into skill installations (README, skill-discovery, AGENTS.md)

### Changed

- **Trilingual documentation split (ADR-0005)** - developer-facing docs split into three language trees (`docs/en/` + `docs/zh-CN/` canonical + `docs/zh-TW/` Taiwan usage); the root keeps only the English landing files (`README.md`, `CONTRIBUTING.md`), translations live in their trees; ADR decision history (`docs/design-decisions/`) and completed-plan archives (`docs/archive/`) moved to a shared single-language (简体中文) space; three trees are fully parallel
- **Governed-project language policy** - INIT now generates a split README by default (root `README.md` English landing + `docs/README.zh-CN.md` translation); language-variant files never pile up in the project root; multi-language doc trees only on explicit project convention; historical records (archives, ADRs) are never translated; glossary optional for multilingual projects; draft-exception rule (stable docs sync same-commit, in-flight drafts may defer until push/release)

### Fixed

- Archive files converted to single-language 简体中文 (were bilingual frozen copies); zh-TW code-block/comment translations completed; architecture/roadmap stale path references fixed; glossary expanded with high-frequency terms
- `check-doc-parity.js` boundary fixes - table signatures flush correctly after headings/code fences; missing trees/entry files reported gracefully instead of crashing

## [0.6.0] - 2026-08-13

### Added

- **Agent activity audit** — `.governance/activity.jsonl` append-only per-task audit trail (written by state-manager; `action` vocabulary v1; secret redaction mandatory); drift-check gains `activity-report` mode (per agent / per action / failed only)
- **Secret scanning gate** — `scripts/check-secrets.js` read-only staged-diff scanner (AWS/GitHub/OpenAI-style/private-key/credential-assignment patterns; reports `file:line` + pattern class, never the secret); validator default checks 19 → 20; mandatory pre-commit step in git policy

### Changed

- `activity.jsonl` declared as git-ignored runtime output; `scripts/check-secrets.js` added to the protected-files list

### Tests

- Test suite 23 → 26 (secret hit exit 1 without leaking token, clean diff exit 0, missing check-secrets validator failure)

## [0.5.2] - 2026-08-13

### Added

- SKILL.md frontmatter gains `version` (synced with releases) and update-check triggers (`check skill update` / `update this skill`): the agent reads the local version, compares against the latest GitHub release, and reports the CHANGELOG delta — never auto-updates
- Version consistency rule extended to five places: package.json · CHANGELOG · manifest `governance_version` · SKILL.md frontmatter `version` · tag

## [0.5.1] - 2026-08-13

### Fixed

- Synced stale version examples (0.3.3 → 0.5.1) in SKILL.md manifest example and `references/workflows/release.md`
- Added 3 missing protected files (`.governance/git-policy.json`, `scripts/check-lock.js`, `scripts/check-git-policy.js`) to 4 summary lists (SKILL.md governance protection, docs/anti-regression.md, agents-md.template.md, git.policy.md)
- Fixed stale ADR-0004 status (`Accepted (Unreleased)` → `Accepted (v0.4.0)`) and expired skill-lifecycle target version (v0.5.0 → v0.6.0)

### Docs

- Added 6 feature plan docs (agent-activity-audit / secret-scanning-gate / knowledge-freshness / governance-score / init-scripted-generator / content-consistency), reordered roadmap with time horizons (near/mid/long/very-long-term) and added the rolling re-baseline maintenance rule

## [0.5.0] - 2026-08-12

### Added

- **Git Workflow Governance** — INIT generates `.governance/git-policy.json` (protected branches, no direct push, require review, no force push) and `scripts/check-git-policy.js` (read-only gate: blocked on protected branch when `directPush=false`); branch-based development (`feature/agent-<date>-<summary>`) with small-change exemption
- `references/templates/git-policy.template.md` — git policy template + field semantics + generation rules
- Validator default checks 17 → 19: adds Git policy (JSON valid + field types) and `scripts/check-git-policy.js`; manifest mode adds the Git policy check (12 total)
- `git-policy.json` / `check-git-policy.js` added to the protected-files list and tracked `.governance` state

### Changed

- `references/policies/git.policy.md` gains the Branch Workflow section; `references/templates/agents-md.template.md` gains the Git Workflow Governance summary
- New 7th generated sub-skill `plan-manager` (TASK creation, milestone check-off, completion marking; archiving stays in release-manager) — sub-skills template, SKILL.md Phase 1, commands.md runtime components
- MIGRATE flow: explicit upgrade path for governed projects whose `governance_version` lags (migration list = validator missing artifacts + CHANGELOG entries; user-confirmed, never auto-upgrade; verified by validator exit 0) — SKILL.md AUDIT section, governance-model.md

### Tests

- Test suite 20 → 23: invalid git-policy exits 1, protected branch blocked exits 1, feature branch passes exits 0

## [0.4.1] - 2026-08-12

### Added

- `references/templates/env-example.template.md` and `references/templates/gitmessage.template.md` — INIT now generates `.env.example` / `.gitmessage.txt` from concrete templates instead of ad-hoc
- CI templates: full GitLab CI pipeline (format / lint / test / build / governance), docs-only project pipeline (markdownlint + link check), `dependabot.yml` template in `references/workflows/ci.md`
- `scripts/release-manager.js plan --file <path>` — read JSON input from a file (avoids shell quoting issues)
- `scripts/check-lock.js` — read-only multi-agent lock check for `.governance/state.json` (exit 1 = another agent holds a lock); INIT now copies it next to the validator, and the validator checks for it

### Fixed

- `state.json` example in SKILL.md used `phase: "CI_SETUP"`, inconsistent with the six-phase state machine — corrected to a valid lifecycle phase
- Roadmap targets updated: Skill lifecycle management moved to v0.5.0 (v0.4.0 shipped without it)

### Changed

- Validator default checks 15 → 17: adds CHANGELOG format (Keep a Changelog version section) and `scripts/check-lock.js`; manifest mode adds CHANGELOG format and manifest `artifacts[].kind` validity
- Lifecycle Phase 5 archive rule (two-phase): completion checks off milestones in `DEVELOPMENT_PLAN.md` and marks the TASK `Status` as Completed; RELEASE archives the version's completed milestones (aggregated into `docs/plans/archive/vX.Y.Z.md`) and completed `TASK_<name>.md` files (moved as individual files); original entries preserved, never deleted; unfinished items stay in `docs/plans/`
- Fixed release flow ordering: version sync + plan archival now precede the release commit; the annotated tag is created AFTER the commit (tag points to a HEAD containing version and archive changes); proposal `headSha` is refreshed before execute
- Refined SemVer Minor rule: Minor requires a **user-perceivable** new capability; internal tooling/mechanism improvements (lock checks, content validation, template additions, flow ordering, internal flags) are Patch
- Roadmap gains two planned items: multi-agent lock enforcement, validator content checks
- Test suite extended 15 → 20 (lock check ×3, CHANGELOG format, `--file` plan input)

## [0.4.0] - 2026-08-12

### Added

- Human-in-the-loop release flow: Analyze → Release Proposal → Developer Approval → Create Git Tag → Create Release (proposal + approval gate formalized in `references/workflows/release.md`)
- `scripts/release-manager.js` — zero-dependency release tool: `plan` (read-only SemVer 2.0.0 classification + Release Proposal) and `execute` (approval-gated annotated tag creation with pre-execution re-verification of clean tree and HEAD)
- SemVer 2.0.0 version-decision rules: Major only for real breaking changes (external/API/CLI/protocol impact), Minor only for backward-compatible capabilities, Patch otherwise; forbidden heuristics (diff size / commit count / file count / code volume)
- 0.x rule: breaking changes never auto-bump to 1.0.0 — only an explicit developer request
- `release.proposal_approved` precondition; `release-proposal.json` recorded as git-ignored runtime approval evidence (ADR-0004)

### Changed

- `release-manager` sub-skill template rewritten around the approval-gated flow; `git tag` moved to the confirmation-required list in `references/policies/git.policy.md`
- Lifecycle Phase 5 (Synchronize) now mandates updating `docs/plans/DEVELOPMENT_PLAN.md` (milestone check-off / status / acceptance) when a corresponding milestone exists (`references/policies/lifecycle.policy.md`, `references/templates/agents-md.template.md`)

### Tests

- Test suite extended 8 → 15: SemVer classification (docs → patch, refactor → patch, CLI command → minor, deleted API → major), clarification request (exit 2), unapproved execute creates no tag, approved execute creates annotated tag

## [0.3.3] - 2026-08-10

### Added

- INIT generates a basic bilingual `README.md` (English first, then 简体中文, anchor-switched via `[English](#english) · [简体中文](#chinese)`) when the project has none; existing READMEs are only merged with the index/badge, never overwritten
- CI templates expanded to Node/TS, Python, Rust, Go, Java (Maven), and C++ (CMake/CTest), each with an explicit format step (Prettier / ruff format / cargo fmt / gofmt / spotless:check / clang-format)
- C++ INIT generates a `.clang-format` style baseline (Attach braces, 4-space indent, 120-col) consumed by CI's `clang-format --dry-run`
- Java CI requires spotless in `pom.xml` (google-java-format) — INIT writes the plugin; Node/TS and Python documented as optional-config (Prettier default / ruff default)

## [0.3.2] - 2026-08-10

### Fixed

- Validator no longer requires `.governance/validation.json`: it is a git-ignored runtime output, so fresh-checkout CI passes without it (default checks 16 → 15)
- Restored separation between tracked governance state (`manifest.json` / `state.json` / `preflight.json` / `generated/`) and runtime outputs (`validation.json` / `drift-report.json`)
- Updated documentation and tests to reflect runtime output semantics (absent → OK, present → OK)

## [0.3.1] - 2026-08-10

### Fixed

- Aligned manifest version examples with the v0.3.1 release.
- Removed remaining runtime ambiguity around legacy `.agent` paths.
- Added regression test ensuring the governance runtime only uses `.governance`.

### Tests

- All tests passing (7/7).

## [0.3.0] - 2026-08-10

### Added

- RELEASE governance mode, completing the lifecycle: INIT → Runtime → AUDIT → RELEASE
- Generated `release-manager` sub-skill (enforces preconditions, version-synced, transactional release)
- Centralized release policy (`references/workflows/release.md`): release requirements, version consistency rules, release workflow, transactional guarantee
- Optional `release` metadata in `manifest.json` (`version` / `tag` / `validated`)

### Changed

- Validator validates release metadata when declared (Release metadata check in manifest mode)
- Updated documentation: Governance Flow, architecture diagrams, feature overview, Roadmap

### Lifecycle

AI Agent Governance now supports:

```
INIT → Runtime → AUDIT → RELEASE
```

## [0.2.0] - 2026-08-10

### Changed

- Rename governance state directory from `.agent/` to `.governance/` to avoid confusion with the `.agents/` skill installation directory
- Move generated agent modules to `.governance/generated/skills/` (clear separation from the `.agents/skills` install layer)
- Rename `reference/` → `references/`, `test/` → `tests/` for ecosystem consistency
- Strengthen `manifest.json` as the single desired-state index: artifacts gain a semantic `type` (policy / documentation / script / ci / state) alongside the filesystem `kind`; `type` is documentation metadata and does not affect filesystem validation
- Add `schema_version` to `manifest.json` (data-format version) distinct from `governance_version` (framework version)
- Track `.governance/manifest.json`, `state.json`, `generated/` in git (Governance as Code); ignore only runtime outputs (`validation.json`, `drift-report.json`)
- Add `references/policies/governance-files.policy.md` as the single source for protected files and `.governance/` git-tracking policy
- Align SKILL.md Phase 2 check list with the validator's default checks (validator is the source of truth)
- Add `--help` to `verify-governance.js`; INIT now generates `.governance/README.md`
- Test suite now covers `--help` (6 tests)

### Migration

- Existing `.governance/skills` directories should migrate to `.governance/generated/skills`.
- Existing `.agent/` state directories should migrate to `.governance/` (manifest keeps `governance_version`; add `schema_version: "1.0"`).

## [0.1.0] - 2026-08-10

### Added

- AI Agent governance framework (SKILL.md-based, tool-agnostic)
- One-instruction INIT workflow: Inspect → Build → Validate → Report
- AGENTS.md generation with `@`-referenced rule files
- Rule system templates: lifecycle / git-policy / security / coding / testing
- Architecture doc + ADR + component registry template
- Feature registry with anti-fabrication placeholder strategy
- Git permission model (push forbidden, delete/dependency/commit require confirmation)
- Zero-dependency governance validator (`scripts/verify-governance.js`, manifest-driven paths)
- Audit workflow: health check + drift detection + minimal fixes
- Machine-readable `.agent/` state (manifest / state / validation / preflight)
- Capability-detected CI templates with graceful degradation
- Generated agent modules (repository-inspection / ci-generator / governance-validator / state-manager / drift-check)
- Test suite (6 tests: empty / default / custom-manifest / missing version / json output / help)
