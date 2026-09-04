# Architecture

[English](architecture.md) · [简体中文](../zh-CN/architecture.md) · [繁體中文](../zh-TW/architecture.md)

This page is the repository layout — a developer-facing map of what each directory is FOR in this skill repo.

The skill's behavior (operating modes INIT/AUDIT/RELEASE, lifecycle pipeline, design principles) is defined in the skill body, not here: see [SKILL.md](../../SKILL.md) and `references/`. This page only records where things live.

### Directory Roles

| Path | Role | Reader | Language |
| --- | --- | --- | --- |
| `SKILL.md` | Skill entry point / product spec | agents (skill users) | single |
| `references/` | **Skill body — the only place skill behavior lives.** Policies, templates, workflows that get copied into governed projects or define how the skill acts. | agents (skill users) | single |
| `scripts/` | Skill runtime scripts (validator, checks, generators, release tool) — part of the install payload | agents/CI | code |
| `LICENSE` | MIT license — part of the install payload | installers | — |
| `docs/` | **Project knowledge. NOT part of the skill payload.** Developer-maintained; read by developers AND agents working in this repo: how to use the skill (trigger words in `commands.md`), design plans (`plans/`), roadmap, glossary. | developers + agents | trilingual |
| `tests/`, `package.json`, `.github/`, `CHANGELOG.md`, `CONTRIBUTING.md`, `README.md`, `AGENTS.md` | Repo infrastructure: CI, release flow, change log, contributor guide | repo maintainers | per file |

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
│       └── release.md          # release preconditions + version consistency
├── scripts/                    # skill runtime scripts
│   ├── verify_governance.js    # validator (manifest-driven paths + governance_version)
│   ├── check-lock.js           # multi-agent lock check (read-only, exit 1 = lock held)
│   ├── check-git-policy.js     # Git workflow gate (protected branch + directPush=false → exit 1)
│   ├── check-secrets.js        # secret scan gate (staged diff, never prints the secret)
│   ├── check-sync.js           # sync groups gate (watch/require reconciliation, exit 1)
│   ├── check-doc-freshness.js  # doc staleness + translation freshness (git log dates; advisory, --release-gate blocks stale/draft translations)
│   ├── check-doc-consistency.js # cross-doc contradictions + consent/protected-list/principles-index/plan-status/terminology clusters (advisory default; --gate/--release-gate fail-closed; changelog coverage fail-closed only in --release-gate)
│   ├── check-doc-parity.js     # trilingual tree parity (CI + release precondition)
│   ├── check-layout-sync.js    # architecture.md Repository Layout vs references/ + scripts/ (fail-closed gate)
│   ├── check-plan-delivery.js  # plan declarations vs actual delivery (gate before archiving)
│   ├── generate-governance.js  # INIT scripted generator (deterministic bootstrap, spec: references/init-spec.json)
│   ├── package-skill.sh        # release payload tarball packaging
│   └── release-manager.js      # plan (read-only) + execute (approval-gated) release tool
├── LICENSE                     # MIT
│
│  ▼ install payload ends here — everything below is repo infrastructure,
│    NOT copied into skill installations (same rule as the README Install section)
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
    └── run-tests.js            # test suite
```

Install payload = `SKILL.md` + `references/` + `scripts/` + `LICENSE` only. Everything below the split (`docs/`, `tests/`, `package.json`, `.github/`, README, CONTRIBUTING, CHANGELOG, AGENTS.md) is repository infrastructure — do NOT copy it into skill installations.
