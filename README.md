# AI Agent Governance

> A repository-native governance system for AI coding agents.
> Treat AI agent behavior as repository infrastructure.

[![CI](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml/badge.svg)](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Consciencieux/ai-agent-governance)](https://github.com/Consciencieux/ai-agent-governance/releases)

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

## What it is

AI Agent Governance is not just a prompt pack or an `AGENTS.md` generator. It turns agent behavior, repository constraints, and verification mechanisms into tracked, continuously validated repository infrastructure — governance that lives in the repository rather than only in chat context or documentation.

## Why this exists

AI coding agents act on a repository quickly, but they do not automatically inherit engineering context, architecture constraints, or maintenance mechanisms. The failure chain is real:

```
an agent changes code
→ forgets to synchronize related files
→ bypasses the rules
→ degrades repository state
→ the next agent continues from the degraded state
→ the problem grows
```

This project originated from a real multi-agent GitHub collaboration workflow where prompt-only coordination repeatedly failed to preserve repository constraints and state consistency. It has since evolved from a small agent instruction into a repository-level governance system.

## How it works

The governance lifecycle runs inside the repository, across five stages:

| Stage | What happens |
| --- | --- |
| INIT | Inspect the environment, generate rules, `AGENTS.md`, feature registry, CI and validator, then record initial state. |
| OPERATE | The generated `AGENTS.md` and sub-skills govern every agent session; a per-project lock serializes multi-agent work. |
| VALIDATE | A zero-dependency validator checks repository health; drift detection compares manifest (desired) against reality (observed). |
| AUDIT | Audit aggregates the activity trail and validates all governance facts — from doc consistency to rule capture. |
| RELEASE | A human-in-the-loop flow analyzes change history, proposes a SemVer version, and publishes — with evidence, not fabrication. |

The Spec / Status / Health state model behind these stages is documented in [docs/product/en/governance-model.md](docs/product/en/governance-model.md).

This is the repository-level governance lifecycle. The per-task agent operating lifecycle (six phases) is documented separately in [docs/product/en/lifecycle.md](docs/product/en/lifecycle.md).

```
   AI Agent
      │
      ▼
 Governance Rules          rules · policies · agent guidance
      │
      ▼
 Repository State          desired state · current state · repository knowledge
      │
      ▼
 Verification              validation · drift detection · testing · audit
      │
      ▼
 Human-controlled Release  review · approval · versioning
      │
      └──────────────► back into the repository
```

## What it governs

| Domain | Examples |
| --- | --- |
| Agent behavior | permission matrix, multi-agent locking, rule priority |
| Repository state | manifest (desired) · state (current) · validation (observed) |
| Docs & knowledge | feature registry, plans, rules, translation freshness |
| Git operations | protected branches, branch-based development, controlled rollback |
| Release | SemVer proposal, human approval, tag-version consistency |

## What makes it different

| Dimension | Meaning |
| --- | --- |
| Repository-native | governance lives in the repo, not in chat context or an external platform |
| Lifecycle-based | rules are maintained and audited across the whole project lifecycle |
| Fail-closed | gates stop the flow when a promised mechanism did not actually run |
| Tool-neutral | the core speaks `AGENTS.md`; per-tool adapters serve specific agents |

Through one initialization the governance environment is established; continuous validation keeps it intact and consistent.

```
initialize project governance
```

See [docs/product/en/commands.md](docs/product/en/commands.md) for the complete list of available prompts.

## Quick Start

Install the skill where your coding agent discovers skills — use the release payload tarball:

```bash
mkdir -p ~/.agents/skills/ai-agent-governance
curl -L https://github.com/Consciencieux/ai-agent-governance/releases/latest/download/ai-agent-governance-skill.tar.gz \
  | tar -xz -C ~/.agents/skills/ai-agent-governance
```

This is a chat prompt, not a shell command. In your AI coding agent chat, ask:

```text
initialize project governance
```

**Before** — a plain project:

```text
my-project/
├── src/
└── package.json
```

**After** — the governance environment is established (representative structure):

```text
my-project/
├── AGENTS.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── plans/
│   └── rules/
├── .governance/
├── scripts/
└── .github/workflows/
```

Complete annotated initialization output: [docs/product/en/bootstrap-output.md](docs/product/en/bootstrap-output.md).

## Generated Environment

INIT generates a governance skeleton whose exact contract — inputs, artifacts, installed scripts, rule files and generated sub-skills — is defined in [references/init-spec.json](references/init-spec.json) and [references/templates/sub-skills.md](references/templates/sub-skills.md).

## Documentation

- [docs/README.md](docs/README.md) — documentation knowledge architecture: doc-type boundaries, language policy, lifecycle overview
- [docs/product/en/skill-discovery.md](docs/product/en/skill-discovery.md) — how agents discover and trigger the skill
- [docs/product/en/commands.md](docs/product/en/commands.md) — complete prompt list and runtime components
- [docs/product/en/bootstrap-output.md](docs/product/en/bootstrap-output.md) — complete annotated initialization output
- [docs/product/en/governance-model.md](docs/product/en/governance-model.md) — the Spec / Status / Health state model
- [docs/product/en/architecture.md](docs/product/en/architecture.md) — repository layout and three distribution roles
- [docs/product/en/anti-regression.md](docs/product/en/anti-regression.md) — anti-regression mechanisms in full
- [docs/product/en/lifecycle.md](docs/product/en/lifecycle.md) — the 6-phase agent operating lifecycle
- [docs/product/en/validator.md](docs/product/en/validator.md) — validator usage and checks
- [docs/plans/roadmap/en.md](docs/plans/roadmap/en.md) — roadmap with status and design docs
- [docs/design-decisions/](docs/design-decisions/) — architecture decision records (简体中文)
- [docs/glossary.md](docs/glossary.md) — trilingual terminology table
- [CONTRIBUTING.md](CONTRIBUTING.md) — development guide
- [CHANGELOG.md](CHANGELOG.md) — release history

## Current version

**v2.0** is the installable, usable must-ship slice: INIT / AUDIT / RELEASE run on a clean target, and this repo's CI blocking authority is `npm run check:must-ship`. Generation 1 (1.x) remains the historical baseline. Follow-on work (PLAN-0037 extraction and later items) starts after 2.0. See [CHANGELOG.md](CHANGELOG.md) and [docs/plans/roadmap/en.md](docs/plans/roadmap/en.md).

## License

[MIT](LICENSE) © 2026 Consciencieux
