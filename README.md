# AI Agent Governance

> Repository-native governance for AI coding agents — rules, validation and release controls that live in the repo, not in chat context.

[![CI](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml/badge.svg)](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Consciencieux/ai-agent-governance)](https://github.com/Consciencieux/ai-agent-governance/releases)

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

## Quick Start

**1. Install the skill payload** into your agent's skill directory (not a git clone):

| Agent | Install path |
| --- | --- |
| Cursor | `.cursor/skills/ai-agent-governance/` or personal Agent Store `skills/` |
| Claude Code / opencode (shared) | `~/.agents/skills/ai-agent-governance/` or project `.agents/skills/…` |
| Claude Code only | `.claude/skills/ai-agent-governance/` |
| opencode only | `.opencode/skills/ai-agent-governance/` |

```bash
# Example: shared ~/.agents path — swap the directory for your agent
DEST=~/.agents/skills/ai-agent-governance
mkdir -p "$DEST"
curl -fsSL -o /tmp/ai-agent-governance-skill.tar.gz \
  https://github.com/Consciencieux/ai-agent-governance/releases/latest/download/ai-agent-governance-skill.tar.gz
# Verify (SHA-256 is in the Release notes):
# shasum -a 256 /tmp/ai-agent-governance-skill.tar.gz
tar -xzf /tmp/ai-agent-governance-skill.tar.gz -C "$DEST"
```

Do **not** clone this repository into a skills folder — only the tarball payload (`SKILL.md` + `references/` + `scripts/` + `LICENSE`) is the install artifact. Full discovery notes: [skill-discovery.md](docs/product/en/skill-discovery.md).

**2. In the project you want to govern**, open your coding agent and send:

```text
initialize project governance
```

**3. After initialization**, common follow-ups:

| Prompt | What it does |
| --- | --- |
| `audit governance` | Health-check a governed project, detect drift |
| `release` | Human-in-the-loop versioned release with evidence |
| `governance check` | Quick validation pass |

Full prompt list → [commands.md](docs/product/en/commands.md).

## What It Does

AI coding agents act fast but don't automatically inherit architecture constraints, sync rules, or maintenance workflows. Changes degrade silently; the next agent continues from the degraded state.

This project generates a governance environment inside your repository — tracked rules, automated validation, drift detection, and a human-controlled release flow — so that constraints survive across agent sessions.

## What INIT Generates

A governance skeleton (representative paths — [full annotated list](docs/product/en/bootstrap-output.md)):

```text
my-project/
├── AGENTS.md                      # agent rules (from template)
├── CHANGELOG.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── features/                  # feature registry
│   ├── plans/                     # development plans
│   └── rules/                     # governance rules (lifecycle, git, security, …)
├── .governance/
│   ├── manifest.json              # desired state
│   ├── state.json                 # current state
│   └── generated/skills/          # sub-skills for ongoing agent work
├── scripts/                       # validators, secret scanner, release manager
└── .github/workflows/ci.yml       # CI gate
```

The exact contract (inputs, artifacts, scripts, rules) is defined in [init-spec.json](references/init-spec.json) and [sub-skills.md](references/instruction/sub-skills.md).

## Governance Lifecycle

| Stage | What happens |
| --- | --- |
| **INIT** | Inspect environment → generate rules, AGENTS.md, feature registry, CI, validators → record initial state |
| **OPERATE** | Generated rules and sub-skills govern every agent session; per-project lock serializes multi-agent work |
| **VALIDATE** | Zero-dependency validator checks repo health; drift detection compares manifest vs reality |
| **AUDIT** | Aggregate activity trail, validate all governance facts |
| **RELEASE** | Human-in-the-loop: analyze changes → SemVer proposal → approval → publish with evidence |

State model: [governance-model.md](docs/product/en/governance-model.md). Agent operating lifecycle (6 phases): [lifecycle.md](docs/product/en/lifecycle.md).

## Key Properties

- **Repository-native** — governance lives in the repo, versioned alongside code
- **Lifecycle-based** — rules are maintained and audited across the whole project lifecycle
- **Fail-closed** — gates block when a required mechanism did not actually run
- **Tool-neutral** — core speaks `AGENTS.md`; per-tool adapters serve Cursor, Claude Code, opencode, Codex

## Documentation

- [overview.md](docs/product/en/overview.md) — what this skill governs and how each concern lands
- [commands.md](docs/product/en/commands.md) — all available prompts
- [bootstrap-output.md](docs/product/en/bootstrap-output.md) — annotated INIT output
- [governance-model.md](docs/product/en/governance-model.md) — Spec / Status / Health state model
- [architecture.md](docs/product/en/architecture.md) — repository layout and distribution roles
- [lifecycle.md](docs/product/en/lifecycle.md) — agent operating lifecycle
- [validator.md](docs/product/en/validator.md) — validator usage and checks
- [anti-regression.md](docs/product/en/anti-regression.md) — anti-regression mechanisms
- [skill-discovery.md](docs/product/en/skill-discovery.md) — how agents discover the skill
- [docs/README.md](docs/README.md) — documentation knowledge architecture
- [glossary.md](docs/glossary.md) — trilingual terminology table
- [roadmap](docs/plans/roadmap/en.md) · [design decisions](docs/design-decisions/) · [CHANGELOG](CHANGELOG.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). CI blocking authority for this repo: `npm run check:must-ship`.

## License

[MIT](LICENSE) © 2026 Consciencieux
