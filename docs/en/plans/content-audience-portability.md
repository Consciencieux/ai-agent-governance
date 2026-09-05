# Content Audience and Portability Boundary (TASK plan)

[English](content-audience-portability.md) · [简体中文](../../zh-CN/plans/content-audience-portability.md) · [繁體中文](../../zh-TW/plans/content-audience-portability.md)

> **Status: design plan, not implemented.** Responds to a read-only audit (2026-09-05) of the release payload: the structural boundary is sound (packaging correct, roles complete and gate-verified), but the CONTENT of INSTALLED rule bodies still mixes audients. Nine confirmed leaks — "npm run check" reaching a target that has no package.json, the skill repo's `docs/archive/` path inside a governed-project rule that itself says `docs/plans/archive/`, hard-coded trilingual obligations, dangling pointers, and two generated sub-skills telling targets to run scripts they do not have.

**Target: both** — `payload` rewrites the leaked rule text (`references/policies/lifecycle.policy.md`, `references/templates/sub-skills.md`, `SKILL.md`, `references/workflows/release.md`, `scripts/check-layout-sync.js`) and adds an init-to-tarball boundary test; `repo-infra` records the two-axis model in docs and glossary and adds the portability checks. The two domains are listed separately under Affected Files.

### Objective

Close the leak between "where a file is distributed" and "what its CONTENT is about". A distribution role (INSTALLED / SKILL-INTERNAL / REPO-ONLY) answers *where the file goes*; it does not answer *who reads it*, *whether its paths exist in the target environment*, or *for which project shape its rules hold*. This plan fixes the content so that the statement below holds everywhere:

> INSTALLED 必须 project-portable；REPO-ONLY 可以使用本仓库路径与命令；SKILL-INTERNAL 不得被生成内容引用为目标项目依赖。

And it adds the two formal distinctions as documented concepts (audience, portability) — without inventing a fourth distribution role or a prohibition-word scanner.

### Current Problem (2026-09-05 audit)

The audit generated the real tarball, installed it, then produced two real governed-project fixtures (`--phase A` and `--phase C --stack node`) and searched the INSTALLED output — not the source. Findings:

**A. INSTALLED rule text that cannot hold in a governed project (all four leaks sit in `references/policies/lifecycle.policy.md`):**

1. **lifecycle.policy.md:113** → installed as `docs/rules/lifecycle.md`: "被治理项目运行其 `verify-governance.js`，本仓库使用 `npm run check`。" The governed project has no `package.json` at all; the `check` script is REPO-ONLY. This is skill-repo maintenance instruction inside a target's Phase 5c.
2. **lifecycle.policy.md:61** → the historical layer row names `docs/archive/` — this repo's archive path. The SAME file, line 121, correctly names `docs/plans/archive/`. The installed rule contradicts itself.
3. **lifecycle.policy.md:66,68** → the change-hygiene verification obligation hard-codes "三语文档" (trilingual docs). That is this repo's en/zh-CN/zh-TW layout; the skill's own language policy says multi-language trees are generated only when the project explicitly adopts them.
4. **lifecycle.policy.md:11** → "审查（review-manager，见 `plans/review-manager.md`）" — that path exists in no domain (not the repo, not the payload, not the fixture).

**B. Generated sub-skills that reference scripts the target does not have:**

5. **sub-skills.md:389** → generated `review-manager/SKILL.md` step 5: "run `npm run check` (tests + parity)". Same defect class as the v0.13.0 CHANGELOG entry that fixed check-plan-delivery/package-skill in the RELEASE flow — this instance in the review flow survived.
6. **sub-skills.md:182** → generated `drift-check/SKILL.md`: "**trilingual tree parity** — delegates to `scripts/check-doc-parity.js`". `check-doc-parity.js` is SKILL-INTERNAL, verifiably absent from a governed project, AND the sibling line 265 was correctly hedged ("only when the project HAS such trees and a parity checker; skip otherwise") — line 182 was missed by the same repair.

**C. SKILL.md pointing to repo-only files:**

7. **SKILL.md:49** → "完整自动化 INSTALL → UPDATE → ROLLBACK 由 ai-skill-manager 提供，见 `docs/zh-CN/plans/skill-lifecycle-management.md`". That file is this repo's trilingual plan tree, present in the repo, ABSENT from the payload. A tarball-only user gets a dead link.

**D. release workflow hard-gates on a script no target has:**

8. **release.md:41** → `plan.delivery_verified`: "`scripts/check-plan-delivery.js` 退出码 0（…）" marked ❌ 停止发布. `check-plan-delivery.js` is SKILL-INTERNAL. The sibling `docs.parity_passed` (line 39) was properly hedged ("仅适用于维护三语文档树的仓库"); line 41 was not.

**E. A SKILL-INTERNAL script violating the no-op rule:**

9. **check-layout-sync.js** — in a governed-project shape it exits 1 with "no files found under references — layout scan would cover only part of the tree". This violates the repo's own documented rule that "a SKILL-INTERNAL script must no-op outside this repo's shape" (AGENTS.md distribution roles, and the pattern other scripts like check-coding-hygiene.js already follow).
10. **governance-files.policy.md:3** → installed as `docs/rules/governance-files.md`: "SKILL.md 的「治理文件保护」节 … 均以本文件为准". A governed project has no SKILL.md (no init-spec artifact emits it), so the paragraph points at a file the target does not possess. Its self-aware parenthetical ("目标项目不引用本仓库文件") does not excuse the preceding clause — it names the SKILL.md section as an authority the target cannot have.

### Proposed Solution

#### 1. Rewrite the leaked INSTALLED text (correct content first — before any detector)

##### 1.1 lifecycle.policy.md — make every statement hold in a governed project

- **Line 113**: replace the repo/npm-run-check contrast with a rule that works for any target: e.g. "被治理项目运行其 `verify-governance.js`；它没有的检查由 [已安装门禁] 覆盖，不依赖技能仓库的命令". The `npm run check` fact belongs in this repository's AGENTS.md (repo-side phase 5 statement), not in the installed rule.
- **Line 61**: `docs/archive/` → `docs/plans/archive/` (the historical layer in a governed project holds the versioned archives there).
- **Lines 66,68**: "三语文档" → "多语言文档（若项目采用了多语言文档树）"; the obligation becomes conditional rather than assumed.
- **Line 11**: remove the dangling `plans/review-manager.md` pointer; reference the generated sub-skill path that actually exists (`.governance/generated/skills/review-manager`) or drop the pointer and state the review step plainly.

##### 1.2 sub-skills.md — aligning the two surviving references

- **Line 389** (review-manager gate verification): replace `npm run check` with the target's own verification command — e.g. "run the project's tests and the installed scoped gates (verify-governance.js, check-secrets.js); record real output".
- **Line 182** (drift-check trilingual parity): hedge it the same way line 265 was hedged — "only when the project HAS such trees and a parity checker; skip otherwise".

##### 1.3 governance-files.policy.md — the "SKILL.md section" pointer

- **Line 3**: "SKILL.md 的「治理文件保护」节、生成的 AGENTS.md（references/templates/agents-md.template.md）、docs/rules/git-policy.md 中的清单均以本文件为准". A governed project has NO SKILL.md (verified: no such init-spec artifact): "SKILL.md 的「治理文件保护」节" points at a file the target does not possess. The self-aware parenthetical ("目标项目不引用本仓库文件") does not excuse the preceding clause. Fix: name only artifacts the target actually has — the generated AGENTS.md (whose protection section derives from the same source) and `docs/rules/*.md` (the installed rules) — and state the provenance fact (this list is the single source for both the skill repo and generated targets) without a SKILL.md pointer.

##### 1.4 SKILL.md — remove the dead plan reference

- **Line 49**: the ai-skill-manager pointer must not cite a repo-only docs path. Either link the GitHub project (URL form) or state that the full automation is provided by ai-skill-manager without a path that only exists in this repo.

##### 1.5 release.md — hard gate needs hardware the target can satisfy

- **Line 41**: `plan.delivery_verified` must not ❌-fail on a SKILL-INTERNAL script. Options, chosen at implementation time (both keep the gate's intent): (a) hedge it conditionally like parity — "when the project's plans use Affected Files declarations and a delivery checker exists"; (b) note that the check is the skill executor's own step (`check-plan-delivery.js` runs in the skill repo), never a target-project requirement.

##### 1.6 check-layout-sync.js — honour the no-op rule

- Add the same shape guard check-coding-hygiene.js and check-role-completeness.js already use: when this repo's shape is absent (no `references/` tree in the cwd layout... in practice: when `scripts/` and `references/` both absent, i.e. a governed project has neither), report `applicable: false` and exit 0 instead of failing on a partial corpus.

#### 2. Record the two-axis model (docs, not mechanisms)

- **docs/{en,zh-CN,zh-TW}/architecture.md**: add the distinction between *distribution role* (where the file goes) and *portability/audience* (who reads it; does its content hold outside the skill repo). Show the four-audience table (skill executor, governed-project agent, this-repo contributor, generator) and the per-file portability column: `SKILL.md` = skill-portable, `lifecycle.policy.md` = project-portable, `release.md` = repo/skill-specific, `check-doc-parity.js` + repo-only gates = repo-specific, `AGENTS.md` = repo-specific.
- **docs/glossary.md**: register `audience` (受众/受眾) and `portability` (可移植性/可移植性) — already added in this change set alongside the plan; the terms were previously unregistered.
- **AGENTS.md**: state the rule that INSTALLED content must be project-portable and that repo-specific command/path facts belong in repo files, so later contributors write portable INSTALLED text.

#### 3. Portability verification (narrow, evidence-driven — NOT a prohibition scanner)

Explicitly NOT building a forbidden-word gate: a blacklist like "INSTALLED must not contain `npm run check`" would have false positives and cannot catch arbitrary new leaks. Instead:

- **3a. Generated-references-resolve check**: after INIT in the existing payload fixture framework, verify every `node scripts/...` / `bash scripts/...` instruction in the generated sub-skills (`docs/rules/*.md`, `AGENTS.md`, `.governance/generated/skills/**`) resolves to a file present in the generated project. Extend the existing payload test `INIT installs the release tag executor the sub-skill invokes` (which already does this for release-manager) to cover ALL generated sub-skills and the review/drift flows, and the AGENTS.md + docs/rules files.
- **3b. Standalone behaviour test for check-layout-sync.js in governed-project shape**: assert exit 0 + `applicable: false` (mirroring the check-coding-hygiene no-op test).
- **3c. Dead-link sweep inside the payload fence**: the existing broken-links cluster in check-doc-consistency.js already resolves relative markdown links; extend its INSTALLED-file inspection (now that `references/` is in the scan set) to also flag a payload file whose link points to a path that cannot exist in a governed project. Advisory-notice level if it can't be made unambiguous; do not turn prose scanning into a gate.

#### 4. Release-flow audience split (governed-project policy stays, skill repo stops borrowing it)

The 2026-09-05 RELEASE-mode evaluation (audited against AGENTS.md:113 and `references/workflows/release.md`) found the same audience mixing in the release FLOW as in the file content: one flow document carries three intents — release this skill, release a governed project, complete repo maintenance. AGENTS.md:113 is the symptom: five "Caveats unique to this repo" + "Path mapping for THIS repo" patch a governed-project policy into a skill-repo release.

**Adoption with one correction.** The evaluation's core proposal is right (stop borrowing the governed-project policy; add a short skill-repo release doc; separate repo maintenance from release validity). But two of its steps are corrected:

- **`release.md` keeps its governed-project content** — it is a payload artifact written FOR governed projects (SKILL-INTERNAL, per AGENTS.md "release.md is payload written for governed projects"). Target-project tests/changelog/manifest/sync-groups/tag/GitHub Release BELONG in it and are NOT removed. Its unconditional references to `check-plan-delivery.js` / `check-doc-parity.js` / `check-layout-sync.js` / repo archive rules DO get fixed — those are this-repo-only capabilities and must become conditional (capability-detected) or drop the hard ❌-block for structures that cannot satisfy them.
- **`check:release` is NOT a "governed-project side" gate.** It is defined in THIS repo's package.json and runs this repo's tests, trilingual docs, plan delivery, archive status, translation freshness and CHANGELOG coverage — all REPO-ONLY content. A governed project has no package.json, no trilingual docs tree, no check-plan-delivery.js. It is a **repo-maintenance** investment check, never a command a target project would run. Re-labeling: `check:release` (kept as-is, but documented as this-repo-specific) or split into `check:skill-release` / `check:repo` / `check:repo-release`. Split only if the naming confusion bites; the semantic doc change comes first.

**Target shape (documented, not built this round):**

- `release.md` = **Governed Project Release** (keep; target-project content stays).
- `skill-release.md` (NEW, SKILL-INTERNAL) = **Skill Repository Release** — skill version sources (SKILL.md frontmatter, package.json, CHANGELOG, init-spec default, generator fallback, tag), skill tests, tarball build, tarball content whitelist, checksum, GitHub Release, user approval.
- `plan/archive/roadmap` = **Repo Maintenance** — run, but never described as "skill artifact validity proof".

**Deliberately NOT abstracting a shared workflow.** The evaluation's earlier step (a shared "release policy" prose both flows reference) is rejected on its own terms: it re-creates "one shared flow + two sets of exceptions + two path mappings". Shared BEHAVIOR (SemVer judgement, headSha binding, workspace check, tag creation, user-confirmation semantics) stays in scripts (`release-manager.js`), and the two documents each describe their own flow. Minor duplication in prose is acceptable.

**C6 stays deferred.** Skill Release requires user approval; `reviewStatus` remains explicitly self-attested; `headSha` stays really bound. No early implementation of review evidence, no cross-contamination from the governed project's review-manager.

#### 5. Dependency-direction rules (the definition layer for checks 1-4)

A follow-up evaluation (2026-09-05) correctly observed that the file-role axis answers only WHERE a file goes, not whether its CONTENT, REFERENCES or EXECUTOR are cross-audience. Its dependency-graph proposal is adopted as the definitional layer — five rules, stated once, that §3's portability verification and §3's release split are instances of:

```text
REPO-ONLY      may describe repo internals and may describe payload        (allowed)
SKILL-INTERNAL may read inside the skill package; never a target-project
               runtime dependency                                          (restricted)
INSTALLED      may depend only on files/commands a governed project HAS   (allowed)
generated target must never depend back on repo docs/tests/package.json  (forbidden)
installed ──> repo-only : forbidden
generated ├> skill-internal : forbidden
```

The audit (see the release-flow findings and the 10 leaks above) already demonstrates each forbidden edge concretely. What this section adds is the general rule and a reference map, so subsequent repairs repeat the reasoning instead of re-deriving it.

**Validate in the EXECUTION environment, never in the authoring one.** This is the methodological rule the whole plan rests on, and the reason the first two attempts at this question produced impressionistic answers. A statement in an INSTALLED file is written in a repo where `references/workflows/release.md` exists; it is READ in a project where that path does not. Correctness therefore cannot be judged by reading the source tree — the authoring environment resolves references the target cannot. Concretely:

- Judging INSTALLED content means generating a real project (`generate-governance.js --target <tmp> --phase C`, and `--phase A`) and resolving every reference THERE.
- Judging what a tarball-only user sees means extracting the tarball and resolving there — `docs/` is REPO-ONLY, so any payload pointer into it is dead for that user even though it resolves in the repo.
- "Looks repo-specific" is the wrong filter. It catches `本仓库` / `三语` / `docs/archive/` and misses every reference that reads perfectly normally but simply is not installed (the 8 `references/…` pointers below). **Defects distribute by resolvability, not by suspicious wording** — so enumerate and resolve, never sample by suspicion.
- `scripts/check-doc-consistency.js` is the reference implementation of this stance: it `existsSync`-guards the parity script, no-ops when the glossary is absent, and treats a consent group as checkable only when at least one of its paths exists. It assumes it may be running somewhere other than where it was written. K9/N3 violate exactly this pattern.

**The `references/…` pointer class — systematic, not incidental.** The completed audit (2026-09-05) established that leak K10 is one instance of a general rule violation: **any INSTALLED file that cites a payload sibling by its `references/` path is broken in the target**, because INIT either renames it (`references/policies/lifecycle.policy.md` → `docs/rules/lifecycle.md`) or does not install it at all. Eight confirmed instances: `git.policy.md:23,64,95,99` (4 — a file the plan did not previously list at all), `sub-skills.md:177,202,286` (3), `lifecycle.policy.md:108,109` (2), `governance-files.policy.md:58` (1). The repair is one rule, applied everywhere: **an INSTALLED file references siblings by the path the TARGET has** (`docs/rules/*.md`), or states the fact without a path.

**Cross-audience audit — DONE (2026-09-05), findings below.** The full cross-reference audit ran over `references/policies/*.md`, `references/templates/*.md`, `SKILL.md`, `references/workflows/*.md`, `init-spec.json`, every INSTALLED and SKILL-INTERNAL script, `package-skill.sh`, the generated sub-skills, and two real fixtures (`--phase A`, `--phase C`) plus the extracted tarball. Result: **all 10 known leaks confirmed against live fixtures; 8 new real defects; 11 confirmed legal dual-use** (the audit's ability to certify correctness is as important as its findings). Classified totals: 12 target-project leaks · 8 skill-internal dependency leaks · 4 wrong paths · 5 duplicate authorities · 3 doc-only-no-executor · 11 legal dual-use.

New defects to fold into §1 (not previously listed):

- **N4/N5** — `git.policy.md:23,64,95,99`, four `references/…` pointers reaching the target as `docs/rules/git-policy.md`. Highest-volume single file; was absent from Affected Files.
- **N6/N7/N9/N10** — the remaining four instances of the same class (`sub-skills.md`, `lifecycle.policy.md`, `governance-files.policy.md`).
- **N1** — `SKILL.md:278` cites `docs/<lang>/bootstrap-output.md`; identical defect to K7 one line away. §1.4 must fix both.
- **N2** — `coding.policy.md:8` points a governed project at "本仓库的 `.gitattributes`" as a template.
- **N3** — `check-role-completeness.js` fails in a governed shape exactly like K9, and already computes `applicable:false` before exiting 1. §1.6 covers both scripts.
- **N29** — the installed `verify-governance.js` carries a usage line naming `verify_governance.js` (underscore); verbatim-copy artifact, the target's own file cites a filename it does not have.
- **N16** — `release_requirements` (11 keys) is enumerated in BOTH `release.md` and `sub-skills.md`, which claims to defer to it and then restates it; the two have **already drifted** (L39/L41 hedged differently from L218/L220). Belongs to §4's release split.
- **K10 is larger than recorded** — the same line also names `references/templates/agents-md.template.md`; fixing only the SKILL.md clause leaves the leak.

**N20/N19 — Phase A contract: ADJUDICATED (option a — stage-conditional generation).**

Measured: `AGENTS.md` is a **Phase A** artifact, but every script it commands is Phase B (`verify-governance.js`, `check-lock.js`, `check-git-policy.js`, `check-secrets.js`, `check-sync.js`) or Phase C (`check-doc-freshness.js`, `check-doc-consistency.js`, `release-manager.js`). The artifact precedes its dependencies by two stages. Verified: `fixA has scripts/? false`, while fixA's `AGENTS.md:102` still reads "Before any `git commit`: run `node scripts/check-secrets.js` — exit 0 required".

**Decision: prune the generated content by stage, AND state the checkpoint status — not one or the other.** Declaring "Phase A is not standalone" while leaving the commands in place does not repair anything: a Phase-A agent that is already loaded starts working and hits instructions naming files that do not exist. The defect is that the ARTIFACT CONTAINS INEXECUTABLE INSTRUCTIONS, not that the manual failed to warn. Documentation alone converts "runs and fails" into "was warned, then runs and fails".

Phase contract:

```text
Phase A = static bootstrap checkpoint      (not a usable governance state)
Phase B = executable governance baseline
Phase C = adaptive completion
```

Phase A output must: generate the static skeleton; state plainly that initialization is incomplete; command NO script that is not yet installed; list no not-yet-installed script as a currently-enforced protected file; make no claim of full governance capability; and remain resumable into B/C from `state.json`. Script-execution requirements, the protected-script list, validator requirements, Git-policy checks and sync checks appear only once Phase B has installed their scripts.

Implementation is minimal — no new state machine. `--phase A/B/C` already carries the condition; the template output is pruned per stage. Three regression tests:

1. Phase A output references no script that Phase A does not install.
2. Phase A output is explicitly marked initialization-incomplete.
3. Phase B/C output does contain the script requirements whose scripts that stage installs.

**Root cause promoted to a rule (stop fixing path-by-path).** This audit proves the plan cannot be maintained as a list of individual path repairs. The rule:

> Every reference in INSTALLED content must resolve in the TARGET PROJECT's execution environment. A path existing in the skill source repository is not evidence that it is usable.

Same-class audit objects, all judged by that one rule: file references · command references · **stage dependencies** · generated-artifact dependencies · the SKILL-INTERNAL / INSTALLED boundary · target-vs-skill-repo path differences.

#### 6. Not doing

- Not re-engineering distribution roles; INSTALLED/SKILL-INTERNAL/REPO-ONLY remains the one axis for file placement.
- Not adding a prohibition-word scanner as primary evidence.
- Not creating a fourth audience/portability state machine; the two axes are documented concepts, not artifacts.
- Not changing release.md's self-exemption lines (38/183) — those are justified: release.md is SKILL-INTERNAL and the skill executor really does read them when releasing this repo.

### Verification (evidence tiers)

- Each rewritten INSTALLED rule text is re-checked by the existing end-to-end: tarball → INIT → generated project → every referenced path resolves (mechanical).
- check-layout-sync.js governed-project no-op test added (mechanical).
- Existing suite stays green; new tests are mutation-verified (they fail when the leak is reintroduced).
- Docs/glossary changes verified by check-doc-parity + terminology gate (mechanical).
- No new prohibition grammar; the portability rule is stated in architecture.md as a documented boundary, not a scanner.

### Affected Files

**payload (INSTALLED / SKILL-INTERNAL content and behaviour):**

- `references/policies/lifecycle.policy.md` — §1.1 (4 leaks) + N9 (2 `references/…` pointers)
- `references/templates/sub-skills.md` — §1.2 (2 surviving references) + N6/N7 (3 `references/…` pointers) + N8 (unconditional glossary)
- `references/policies/governance-files.policy.md` — §1.3 (SKILL.md-section pointer, and the agents-md.template.md clause on the same line) + N10 + N12/N13 (mixed path roots in the tracking table)
- `references/policies/git.policy.md` — **N4/N5: four `references/…` pointers** (L23, L64, L95, L99). Highest-volume single file; absent from the original plan.
- `references/policies/coding.policy.md` — N2 ("本仓库的 `.gitattributes`" as a template pointer)
- `SKILL.md` — §1.4 (dead plan pointer L49 **and** L278's `docs/<lang>/bootstrap-output.md`)
- `references/workflows/release.md` — §1.5 (hard gate L41) + N16 (release_requirements duplicated with sub-skills.md, already drifted)
- `references/templates/agents-md.template.md` — **N20: Phase A contract, adjudicated (a)** — stage-prune the script clauses; Phase A emits the static skeleton + an initialization-incomplete marker only
- `scripts/generate-governance.js` — N20 stage-conditional rendering of the AGENTS.md template (the `--phase` switch already exists; the template output must honour it)
- `references/workflows/ci.md` — N19 (generated ci.yml calls verify-governance.js; unreachable via clean `--phase A` but same contract)
- `scripts/check-layout-sync.js` — §1.6 (no-op guard)
- `scripts/check-role-completeness.js` — **N3: same no-op violation as K9** (already computes `applicable:false`, still exits 1)
- `scripts/verify_governance.js` — N29 (usage line names the underscore filename the target does not have)

**repo-infra (docs, glossary, tests, wiring):**

- `docs/glossary.md` — audience / portability terms (already added in this change set)
- `docs/{en,zh-CN,zh-TW}/architecture.md` — §2 two-axis model
- `AGENTS.md` — §2 portability rule for INSTALLED content
- `tests/suites/payload.test.js` — §3a generated-references-resolve (all sub-skills + rules) + N20's three phase-contract regressions (Phase A references no uninstalled script · Phase A is marked initialization-incomplete · Phase B/C carry the requirements for the scripts that stage installs)
- `tests/suites/docs.test.js` — §3b check-layout-sync no-op; §3c dead-link notice if implemented
- `CHANGELOG.md` — release entry
