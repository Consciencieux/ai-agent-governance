# AI Agent Governance

> A repository-native governance system for AI coding agents.
> Treat AI agent behavior as repository infrastructure.

[![CI](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml/badge.svg)](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Consciencieux/ai-agent-governance)](https://github.com/Consciencieux/ai-agent-governance/releases)

[English](README.md) · [简体中文](docs/zh-CN/README.md) · [繁體中文](docs/zh-TW/README.md)

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

The Spec / Status / Health state model behind these stages is documented in [docs/en/governance-model.md](docs/en/governance-model.md).

This is the repository-level governance lifecycle. The per-task agent operating lifecycle (six phases) is documented separately in [docs/en/lifecycle.md](docs/en/lifecycle.md).

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

See [docs/en/commands.md](docs/en/commands.md) for the complete list of available prompts.

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

Complete annotated initialization output: [docs/en/bootstrap-output.md](docs/en/bootstrap-output.md).

## Generated Environment

The v1.0.0 contract surface:

| Contract surface | v1.0.0 | Source |
| --- | ---: | --- |
| INIT inputs | 15 | [references/init-spec.json](references/init-spec.json) |
| Generated artifacts | 38 | [references/init-spec.json](references/init-spec.json) |
| Installed scripts | 9 | [references/init-spec.json](references/init-spec.json) |
| `docs/rules/` policies | 6 | [references/init-spec.json](references/init-spec.json) |
| Generated sub-skills | 8 | [references/templates/sub-skills.md](references/templates/sub-skills.md) |

These figures summarize the v1.0.0 contract. The linked source files are authoritative; this table is a summary only.

## Documentation

- [docs/en/skill-discovery.md](docs/en/skill-discovery.md) — how agents discover and trigger the skill
- [docs/en/commands.md](docs/en/commands.md) — complete prompt list and runtime components
- [docs/en/bootstrap-output.md](docs/en/bootstrap-output.md) — complete annotated initialization output
- [docs/en/governance-model.md](docs/en/governance-model.md) — the Spec / Status / Health state model
- [docs/en/architecture.md](docs/en/architecture.md) — repository layout and three distribution roles
- [docs/en/anti-regression.md](docs/en/anti-regression.md) — anti-regression mechanisms in full
- [docs/en/lifecycle.md](docs/en/lifecycle.md) — the 6-phase agent operating lifecycle
- [docs/en/validator.md](docs/en/validator.md) — validator usage and checks
- [docs/en/roadmap.md](docs/en/roadmap.md) — roadmap with status and design docs
- [docs/design-decisions/](docs/design-decisions/) — architecture decision records (简体中文)
- [docs/glossary.md](docs/glossary.md) — trilingual terminology table
- [CONTRIBUTING.md](CONTRIBUTING.md) — development guide
- [CHANGELOG.md](CHANGELOG.md) — release history

## Post-1.0 directions

v1.0 freezes the core governance contract. Future work will build on it to extend the system's capabilities.

## License

[MIT](LICENSE) © 2026 Consciencieux
