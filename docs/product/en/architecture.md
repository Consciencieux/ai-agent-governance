# Architecture

[English](architecture.md) · [简体中文](../zh-CN/architecture.md) · [繁體中文](../zh-TW/architecture.md)

This page is the repository layout — a developer-facing map of what each directory is FOR in this skill repo.

The skill's behavior (operating modes INIT/AUDIT/RELEASE, lifecycle pipeline, design principles) is defined in the skill body, not here: see [SKILL.md](../../../SKILL.md) and `references/`. This page only records where things live.

### Three distribution roles

Every file belongs to exactly one role. `references/init-spec.json` is the machine-readable authority; `repo-tools/check-role-completeness.js --gate` catches omissions.

| Role | Definition | Examples |
| --- | --- | --- |
| **INSTALLED** | INIT writes it into the governed project. The project's agents read it at runtime. | `references/policies/coding.policy.md` → `docs/rules/coding.md`; `scripts/check-secrets.js`; `agents-md.template.md` → `AGENTS.md` |
| **SKILL-INTERNAL** | Ships in the tarball; the skill executor reads it — but INIT never installs it into governed projects. | `references/init-spec.json`, `references/workflows/release.md`, `scripts/generate-governance.js`, `references/principles/*` |
| **REPO-ONLY** | Never in the tarball. Governs work on THIS repository only. | `repo-tools/**`, `repo-workflows/**`, `AGENTS.md`, `docs/**`, `tests/**`, `package.json`, `.github/**` |

Hard rules:

1. **SKILL-INTERNAL files must never be cited as rules for a governed project** — it does not have them. Sub-skill and generated-AGENTS text may only point at INSTALLED paths (`docs/rules/*`, `scripts/*`).
2. **SKILL-INTERNAL scripts must no-op outside this repo's shape** (report `applicable: false` when the expected layout is absent).

### Portability (where a file GOES vs whether its content HOLDS there)

| Audience | Reads it where | Content must be |
| --- | --- | --- |
| skill executor | in the skill package | skill-portable — may name `references/…`, never repo-only paths |
| governed-project agent | in the target project | project-portable — every path/command/script must exist THERE |
| this-repo contributor | in this repository | repo-specific — may name anything here |
| generator | reads templates, writes target files | output must be project-portable at the stage that writes it |

Hard rules:

1. **INSTALLED content must be project-portable.** Reference siblings by the path the TARGET has (`docs/rules/*.md`); repo-specific commands belong in repo files only.
2. **Validate in the execution environment, not the authoring one.** Generate a real project and resolve there.
3. **Stage-portability matters.** A Phase A artifact must not command a Phase B script. The generated `AGENTS.md` prunes clauses per stage (`<!-- phase:A/B+/C -->`).

### Construction provenance (repo knowledge vs skill contract)

| Belongs to | May cite | Must NOT appear in skill payload |
| --- | --- | --- |
| **This repo (producer)** | `PLAN-*`, `ADR-*`, `FINDING-*`, `RESEARCH-*`, repo paths, npm scripts | — |
| **Skill product** | Product language (`judgment`/`mechanical`, `CTRL-*` controls, install paths) | `PLAN-*`, `ADR-*`, `FINDING-*`, `RESEARCH-*`, pointers into this repo's `docs/` |

Decision record: [ADR-0020](../../design-decisions/ADR-0020-producer-product-governance-separation.md) invariant I5.

### Directory Roles

| Path | Role | Reader | Language |
| --- | --- | --- | --- |
| `SKILL.md` | Thin always-on entry (identity · modes · invariants · capability routing) | agents (skill users) | single |
| `references/` | **Skill body — the only place skill behavior lives.** Mixed INSTALLED + SKILL-INTERNAL. | agents (skill users) | single |
| `scripts/` | Skill runtime scripts. Mixed INSTALLED + SKILL-INTERNAL. | agents/CI | code |
| `LICENSE` | MIT license — travels with the tarball | installers | — |
| `docs/` | **Project knowledge. REPO-ONLY.** | developers + agents | mixed by knowledge type |
| `tests/`, `package.json`, `.github/`, `CHANGELOG.md`, `README*.md`, `CONTRIBUTING*.md`, `AGENTS.md`, `.gitattributes` | REPO-ONLY infrastructure | repo maintainers | per file |

### Repository Layout

```
ai-agent-governance/
├── SKILL.md                    # thin always-on entry + capability routing
├── references/                 # skill body — the only place skill behavior lives
│   ├── init-spec.json          # machine-readable INIT spec (source for generate-governance.js)
│   ├── instruction/                # executable instruction sources (not templates)
│   │   ├── agents-md.template.md   # AGENTS.md runtime contract source
│   │   └── sub-skills.md           # source for generated skills
│   ├── templates/                  # materialization only (bootstrap / machine-state)
│   │   ├── feature-doc.template.md / env-example.template.md / gitmessage.template.md
│   │   ├── git-policy.template.md / githooks-template.md / sync-rules.template.md
│   ├── policies/
│   │   ├── lifecycle.policy.md / git.policy.md / security.policy.md / coding.policy.md / testing.policy.md
│   │   ├── runtime-invariants.policy.md / governance-files.policy.md
│   ├── capabilities/               # task how-to leaves — NOT a feature directory (see overview.md); hard rules stay in policies/
│   │   ├── enforcement.v0.json     # obligation classification inventory (leaf may be policy or capability)
│   │   ├── audit-drift.md / deterministic-init.md / generated-subskill-lifecycle.md / governance-state.md
│   │   ├── plan-sync.md / release-orchestration.md / release-risk-tiering.md / review-mechanism.md / skill-execution.md / sync-groups.md
│   │   └── subskills/
│   │       ├── subskill-ci-generator.md / subskill-drift-check.md / subskill-governance-validator.md / subskill-plan-manager.md
│   │       └── subskill-release-manager.md / subskill-repository-inspection.md / subskill-review-manager.md / subskill-state-manager.md
│   ├── principles/                 # portable methodology (SKILL-INTERNAL — not INIT-installed)
│   │   ├── entry.md / instruction-architecture.md / document-model.md / metadata-policy.md
│   │   └── capability-model.md / decision-records.md / migration-method.md / control-shape.md / enforcement-semantics.md
│   ├── contracts/
│   │   └── sibling-closure.example.json
│   └── workflows/
│       ├── ci.md               # CI templates (capability detection + degradation)
│       └── release.md          # release preconditions + version consistency (governed projects)
├── scripts/                    # skill runtime scripts — INSTALLED into governed projects + the generator
│   ├── verify_governance.js    # validator (manifest-driven paths + governance_version)
│   ├── check-lock.js / check-git-consent.js / check-sibling-closure.js / check-file-size-budget.js
│   ├── migrate-governance.js / check-git-policy.js / check-secrets.js / check-sync.js
│   ├── lib/
│   │   ├── git-facts.js / md-link-facts.js / plan-status.js / secret-scan-facts.js
│   │   ├── doc-consistency/
│   │   │   ├── run.js / shared.js
│   │   │   ├── changelog-coverage.js / version-examples.js / protected-files.js
│   │   │   ├── principles-index.js / plan-status.js
│   │   │   └── broken-links.js / prompt-sync.js
│   │   └── generate/
│   │       └── run.js              # INIT generator body (SKILL-INTERNAL)
│   ├── evaluators/
│   │   ├── ctrl-0001-secret-protection.js / ctrl-0002-git-write-consent.js
│   │   ├── ctrl-0003-doc-freshness.js / ctrl-0004-translation-freshness.js
│   │   └── ctrl-0006-broken-links.js
│   ├── check-doc-freshness.js / check-doc-consistency.js / check-plan-sync.js
│   ├── generate-governance.js      # thin INIT CLI (SKILL-INTERNAL)
│   └── release-manager.js          # plan (read-only) + execute (approval-gated) release tool
├── LICENSE                     # MIT
│
│  ▼ Install payload ends here — everything below is repo infrastructure.
│    package-skill.sh copies only SKILL.md + references/ + scripts/ + LICENSE.
│
├── repo-tools/                 # THIS repo's own gates and packaging — never distributed
│   ├── check-doc-parity.js / check-layout-sync.js / check-plan-delivery.js
│   ├── check-role-completeness.js / check-coding-hygiene.js / check-file-size-budget.js
│   ├── check-daily-check-surface.js / daily-check-surface.v0.json
│   ├── check-secrets.js
│   ├── check-must-ship.js / check-must-ship-carriers.js
│   ├── lib/
│   │   └── routing.js
│   ├── routing-graph.v0.json
│   ├── script-inventory.v0.json / oracle-inventory.v0.json / route-task.js
│   ├── export-installed-scripts.js  # paper fixtures: copy INSTALLED gates (--ref pin)
│   └── package-skill.sh        # release payload tarball packaging
├── repo-workflows/             # THIS repo's own process docs — never distributed
│   ├── principles-index.md     # governance principles pointer table (AGENTS routes here)
│   ├── agent-change.md         # edit / protect / validate for this repo
│   ├── conventions.md          # repo construction conventions
│   ├── changelog-policy.md
│   └── skill-release.md
│
├── docs/                       # project knowledge — developer-maintained
│   ├── glossary.md             # trilingual terminology table
│   ├── product/                # user-facing docs — trilingual (en / zh-CN / zh-TW)
│   ├── plans/                  # execution plans (zh-CN canonical)
│   │   ├── roadmap/            # trilingual
│   │   └── archive/
│   ├── findings/               # issue/finding archive (zh-CN)
│   ├── research/               # research knowledge base (zh-CN)
│   └── design-decisions/       # architecture decision records (zh-CN)
├── README.md / README.zh-CN.md / README.zh-TW.md
├── CONTRIBUTING.md / CONTRIBUTING.zh-CN.md / CONTRIBUTING.zh-TW.md
├── AGENTS.md / CHANGELOG.md / package.json
├── .github/                    # CI: must-ship gate + skill-payload-release on version tags
└── tests/
    ├── run-tests.js            # single discovery entry
    ├── support/helpers.js
    └── suites/                 # domain suites (validator, security, consistency, docs, etc.)
```

Release scratch `repo-tools/.release/proposal.json` is gitignored and intentionally not listed above.

Install payload = `SKILL.md` + `references/` + `scripts/` + `LICENSE` only. Everything below the split is repository infrastructure — do NOT copy it into skill installations.
