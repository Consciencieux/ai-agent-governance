# Architecture

[English](architecture.md) · [简体中文](../zh-CN/architecture.md) · [繁體中文](../zh-TW/architecture.md)

This page is the repository layout — a developer-facing map of what each directory is FOR in this skill repo.

The skill's behavior (operating modes INIT/AUDIT/RELEASE, lifecycle pipeline, design principles) is defined in the skill body, not here: see [SKILL.md](../../SKILL.md) and `references/`. This page only records where things live.

### Three distribution roles (read this before classifying any file)

"Payload" used to mean three different things, which is exactly how a repo-only tool got
labelled "NOT payload" while sitting in `scripts/`, and how a sub-skill ended up citing a
workflow file governed projects never receive. Use these three role names instead — they
are mutually exclusive, and `references/init-spec.json` is the machine-readable authority
for which role a file has:

| Role | Definition | How to verify | Examples |
| --- | --- | --- | --- |
| **INSTALLED** | INIT writes it into the governed project (copy / template / generated). The governed project's agents read it at runtime. | listed as a `source` in `init-spec.json` (see `check-role-completeness.js --gate` for current counts) | `references/policies/coding.policy.md` → `docs/rules/coding.md`; `scripts/check-secrets.js`; `agents-md.template.md` → `AGENTS.md` |
| **SKILL-INTERNAL** | Ships inside the tarball (packaging copies `references/` + `scripts/` wholesale) and the SKILL EXECUTOR reads it — but INIT never installs it, so a governed project never has this file. | listed in `init-spec.json` `distribution.skillInternal` | exactly three: `references/init-spec.json`, `references/workflows/release.md`, `scripts/generate-governance.js` |
| **REPO-ONLY** | Never in the tarball at all. Governs work on THIS repository. | outside `references/`/`scripts/`/`SKILL.md`/`LICENSE` | `repo-tools/**`, `repo-workflows/**`, `AGENTS.md`, `docs/**`, `tests/**`, `package.json`, `.github/**`, `.gitattributes` |

Roles are **human decisions, never inferred**: `copy`/`template`/`generated`, renames
(`lifecycle.policy.md` → `docs/rules/lifecycle.md`, `verify_governance.js` →
`verify-governance.js`), one-to-many outputs (`githooks-template.md` → `pre-commit` +
`commit-msg`) and the inline-content artifacts (`type: "static"`) all encode contract decisions a
generator cannot recover from the file tree. What IS mechanical is catching omissions:
`repo-tools/check-role-completeness.js --gate` fails on an unclassified file, a file in both
sets, a declared path that no longer exists, or a role claim that `package-skill.sh` does
not actually ship. Files whose role is genuinely unresolved sit in
`distribution.undecided` with the open question recorded, and keep that gate red until
adjudicated. Both items initially placed there have been resolved in the same change that
introduced the role table: `governance-files.policy.md` (an INSTALLED check reads it, so it
is now installed as `docs/rules/governance-files.md`) and `feature-doc.template.md`
(SKILL.md tells agents to copy it, so it is now installed as `docs/features/_TEMPLATE.md`).

Two rules follow, and both were violated before this table existed:

1. **A SKILL-INTERNAL file must never be cited as a source of rules for a governed
   project** (it is not there). Sub-skill and generated-AGENTS text may only point at
   INSTALLED paths — `docs/rules/*`, the governed project's own `AGENTS.md`, or copied
   `scripts/*`.
2. **A SKILL-INTERNAL script must no-op outside this repo's shape**, because packaging
   still ships it. `check-coding-hygiene.js` does this by reporting `applicable: false`
   when the suite layout is absent.

### The second axis: portability (where a file GOES vs whether its content HOLDS there)

The distribution role answers *where the file is delivered*. It does not answer *who reads
it* or *whether its statements are true in the place it is read*. Those are a separate
axis, and conflating the two produced a class of real defects: files correctly classified
as INSTALLED whose text told a governed project to run `npm run check` (no package.json
there), pointed at `references/…` siblings (renamed or never installed by INIT), or
assumed a trilingual docs tree.

| Audience | Reads it where | Portability the content must have |
| --- | --- | --- |
| skill executor | in the skill package | skill-portable — may name payload paths (`references/…`), never repo-only ones (`docs/`, `package.json`) |
| governed-project agent | in the target project | project-portable — every path, command and script named must exist THERE |
| this-repo contributor | in this repository | repo-specific — may name anything here |
| generator | reads templates, writes target files | output must be project-portable at the stage that writes it |

Per-file examples: `SKILL.md` = skill-portable · `lifecycle.policy.md` = project-portable
(installed as `docs/rules/lifecycle.md`) · `release.md` = governed-project-portable ·
`skill-release.md` = skill-repo-specific · `check-doc-parity.js` and the other repo-only
gates = repo-specific · `AGENTS.md` (this repo's) = repo-specific.

Three rules follow:

1. **INSTALLED content must be project-portable.** An INSTALLED file references its
   siblings by the path the TARGET has (`docs/rules/*.md`), or states the fact without a
   path. A repo-specific command or path fact belongs in a repo file, never in installed
   rule text.
2. **Validate in the execution environment, not the authoring one.** The authoring repo
   resolves references the target cannot; correctness is judged by generating a real
   project and resolving there. "Looks repo-specific" is the wrong filter — it catches
   `本仓库` and misses every reference that reads normally but simply is not installed.
   Defects distribute by resolvability, not by suspicious wording.
3. **Stage-portability is part of it.** A Phase A artifact may not command a script that
   Phase B installs. The generated `AGENTS.md` prunes its clauses per stage
   (`<!-- phase:A -->` / `<!-- phase:B+ -->` / `<!-- phase:C -->`) and later stages
   upgrade the file in place, so the rules a project holds always match the scripts it has.

### Directory Roles

| Path | Role | Reader | Language |
| --- | --- | --- | --- |
| `SKILL.md` | Skill entry point / product spec | agents (skill users) | single |
| `references/` | **Skill body — the only place skill behavior lives.** Mixed INSTALLED + SKILL-INTERNAL (see the role table). | agents (skill users) | single |
| `scripts/` | Skill runtime scripts. Mixed too: 7 are INSTALLED (copied into governed projects), the rest are SKILL-INTERNAL tools that only ever run here. | agents/CI | code |
| `LICENSE` | MIT license — travels with the tarball | installers | — |
| `docs/` | **Project knowledge. REPO-ONLY.** Developer-maintained; read by developers AND agents working in this repo: how to use the skill (trigger words in `commands.md`), design plans (`plans/`), roadmap, glossary. | developers + agents | trilingual |
| `tests/`, `package.json`, `.github/`, `CHANGELOG.md`, `CONTRIBUTING.md`, `README.md`, `AGENTS.md`, `.gitattributes` | REPO-ONLY infrastructure: CI, release flow, change log, contributor guide | repo maintainers | per file |

### Repository Layout

```
ai-agent-governance/
├── SKILL.md                    # skill entry point / product spec
├── references/                 # skill body — the only place skill behavior lives
│   ├── init-spec.json          # machine-readable INIT spec (source for generate-governance.js)
│   ├── templates/
│   │   ├── agents-md.template.md   # AGENTS.md template
│   │   ├── feature-doc.template.md # feature doc template (anti-fabrication rules)
│   │   ├── sub-skills.md           # source for generated skills; each becomes .governance/generated/skills/<name>/SKILL.md, not a script
│   │   ├── env-example.template.md # .env.example template (placeholders, dependency-trimmed)
│   │   ├── gitmessage.template.md  # .gitmessage.txt template (commit conventions)
│   │   ├── git-policy.template.md  # .governance/git-policy.json template (Git workflow policy)
│   │   ├── githooks-template.md     # opt-in .githooks/pre-commit + commit-msg templates
│   │   └── sync-rules.template.md  # .governance/sync-rules.json template (sync groups)
│   ├── policies/
│   │   ├── lifecycle.policy.md / git.policy.md / security.policy.md / coding.policy.md / testing.policy.md
│   │   └── governance-files.policy.md   # protected files + .governance git-tracking policy
│   └── workflows/
│       ├── ci.md               # CI templates (capability detection + degradation)
│       └── release.md          # release preconditions + version consistency (governed projects)
├── scripts/                    # skill runtime scripts — INSTALLED into governed projects + the generator
│   ├── verify_governance.js    # validator (manifest-driven paths + governance_version)
│   ├── check-lock.js           # multi-agent lock check (read-only, exit 1 = lock held)
│   ├── check-git-policy.js     # Git workflow gate (protected branch + directPush=false → exit 1)
│   ├── check-secrets.js        # secret scan gate (staged diff, never prints the secret)
│   ├── check-sync.js           # sync groups gate (watch/require reconciliation, exit 1)
│   ├── check-doc-freshness.js  # doc staleness + translation freshness (git log dates; advisory, --release-gate blocks stale/draft translations)
│   ├── check-doc-consistency.js # cross-doc contradictions + consent/protected-list/principles-index/plan-status/terminology clusters (advisory default; --gate/--release-gate fail-closed; changelog coverage fail-closed only in --release-gate)
│   ├── generate-governance.js  # INIT scripted generator (SKILL-INTERNAL; spec: references/init-spec.json)
│   └── release-manager.js      # plan (read-only) + execute (approval-gated) release tool
├── LICENSE                     # MIT
│
│  ▼ install payload ends here — everything below is repo infrastructure,
│    NOT copied into skill installations. The boundary is PHYSICAL: package-skill.sh
│    copies SKILL.md + references/ + scripts/ + LICENSE, so a file placed below this
│    line cannot reach a tarball no matter what role it declares.
│
├── repo-tools/                 # THIS repo's own gates and packaging — never distributed
│   ├── check-doc-parity.js     # trilingual tree parity (CI + release precondition)
│   ├── check-layout-sync.js    # architecture.md Repository Layout vs the four scanned dirs (fail-closed gate)
│   ├── check-plan-delivery.js  # plan declarations vs actual delivery (gate before archiving)
│   ├── check-role-completeness.js # distribution-role completeness (unclassified/overlap/stale/packaging + repo-only reverse check)
│   ├── check-coding-hygiene.js # coding hygiene (test-ownership + residue markers)
│   └── package-skill.sh        # release payload tarball packaging
├── repo-workflows/             # THIS repo's own process docs — never distributed
│   └── skill-release.md        # skill repo release flow (three version places + tag, tarball build)
│
├── docs/                       # project knowledge — developer-maintained, read by developers & agents (trigger words, plans, roadmap)
│   ├── glossary.md             # trilingual terminology table (shared)
│   ├── design-decisions/       # architecture decision records (shared, single-language 简体中文)
│   ├── archive/                # completed plan archives (shared, single-language)
│   ├── en/                     # English tree
│   │   ├── architecture.md     # this page
│   │   ├── governance-model.md # Spec / Status / Health concept summary
│   │   ├── anti-regression.md  # developer map of anti-regression mechanisms
│   │   ├── lifecycle.md        # 6-phase lifecycle developer summary
│   │   ├── validator.md        # validator usage manual
│   │   ├── skill-discovery.md  # how agents discover and trigger the skill
│   │   ├── commands.md         # full prompt reference (user-facing commands)
│   │   ├── bootstrap-output.md # complete annotated initialization output
│   │   ├── roadmap.md          # planned features and status
│   │   └── plans/              # design plans (TASK format)
│   ├── zh-CN/                  # 简体中文 tree (canonical source)
│   └── zh-TW/                  # 繁體中文 tree (Taiwan)
├── README.md                   # English landing (translations: docs/zh-CN/README.md, docs/zh-TW/README.md)
├── CONTRIBUTING.md             # development guide (translations: docs/zh-CN/CONTRIBUTING.md, docs/zh-TW/CONTRIBUTING.md)
├── AGENTS.md                   # agent guidelines for working on this repo
├── CHANGELOG.md                # release history
├── package.json                # npm scripts (test, check)
├── .github/                    # CI workflows
└── tests/
    ├── run-tests.js            # single discovery entry: runner + summary only
    ├── support/helpers.js      # shared fixtures, git helpers, script paths, temp-root lifecycle
    └── suites/                 # domain suites (validator, security, consistency, docs,
                                # release, generator, payload, hygiene) — see anti-patch plan §3
```

Install payload = `SKILL.md` + `references/` + `scripts/` + `LICENSE` only. Everything below the split (`docs/`, `tests/`, `package.json`, `.github/`, README, CONTRIBUTING, CHANGELOG, AGENTS.md) is repository infrastructure — do NOT copy it into skill installations. One nuance: `repo-tools/check-coding-hygiene.js` travels inside the tarball (packaging copies `scripts/` wholesale) but is NOT declared in `references/init-spec.json`, so INIT never installs or runs it; run outside this repo's layout it reports "not applicable" and exits 0.
