# AI Agent Governance

> Treat AI agent behavior as repository infrastructure.

[![CI](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml/badge.svg)](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Consciencieux/ai-agent-governance)](https://github.com/Consciencieux/ai-agent-governance/releases)

[English](README.md) · [简体中文](docs/zh-CN/README.md) · [繁體中文](docs/zh-TW/README.md)

**One command bootstraps a complete AI coding agent environment for your repository — AGENTS.md, rules, feature registry, CI and validator — then keeps it validated and maintained for the whole project lifecycle.**

### Why?

AI coding agents can generate and modify code quickly, but they do not automatically inherit a project's engineering context, architectural constraints, or long-term maintenance mechanisms.

Every new project still requires developers to set up by hand:

- AGENTS.md
- CHANGELOG.md
- Architecture docs
- Feature registry
- Coding rules
- Git workflow
- CI checks
- Security baseline

These rules usually live only in documentation or chat context — and decay with time, team and agent turnover.

This project turns these capabilities into repository-level infrastructure: it bootstraps the governance system on day one and continuously validates, maintains and prevents drift across the whole project lifecycle.

### The Solution

The generated artifacts are repository infrastructure, not static templates — tracked like code (`manifest.json` desired state · `state.json` current state · `validation.json` observed state) and validated continuously by drift detection, validation gates, anti-regression and release lifecycle.

**Initialize first, govern continuously.**

| Existing approach | Limitation |
| --- | --- |
| Prompt packs (CLAUDE.md) | instruction only — no validation, no lifecycle |
| AGENTS.md templates | static bootstrap — no maintenance |
| CI rules | code only |
| Enterprise AI governance | outside the repository |
| **AI Agent Governance** | **one-command bootstrap + lifecycle validation + drift prevention, as repo infrastructure** |

### Install

This is an AI agent skill, not a CLI — install it where your coding agent discovers skills:

```
.agents/skills/ai-agent-governance/SKILL.md
```

**Recommended — install from the release payload tarball** (contains only `SKILL.md` + `references/` + `scripts/` + `LICENSE`, nothing else):

```bash
mkdir -p ~/.agents/skills/ai-agent-governance
curl -L https://github.com/Consciencieux/ai-agent-governance/releases/latest/download/ai-agent-governance-skill.tar.gz \
  | tar -xz -C ~/.agents/skills/ai-agent-governance
```

If the download times out (GitHub release redirects can be slow), use the alternative below.

**Alternative — clone and copy only the payload.** The skill is `SKILL.md` + `references/` + `scripts/` + `LICENSE` only; everything else (`docs/`, `tests/`, `package.json`, `.github/`, `README`, `CONTRIBUTING`, `CHANGELOG`, `AGENTS.md`) is repository infrastructure — do NOT copy it into the skill installation.

```bash
git clone https://github.com/Consciencieux/ai-agent-governance
mkdir -p ~/.agents/skills/ai-agent-governance
cp -R SKILL.md references scripts LICENSE ~/.agents/skills/ai-agent-governance/
```

The skill is discovered through each agent's native skill/rule discovery mechanism. Agent-specific install paths (`.claude/skills`, `.opencode/skills`, ...): [docs/en/skill-discovery.md](docs/en/skill-discovery.md)

### Quick Start

**This is a chat prompt, not a shell command.** In your AI coding agent chat, ask:

```text
initialize project governance
```

**Before:**

```
my-project/
├── src/
└── package.json
```

**After:**

```
my-project/
├── AGENTS.md
├── CLAUDE.md
├── CHANGELOG.md
├── README.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── plans/
│   ├── features/
│   └── rules/
├── .env.example
├── .governance/
├── scripts/
└── .github/workflows/
```

One prompt — your project now has a complete governance environment, ready for any AGENTS.md-compatible agent. See the full generated file set: [docs/en/bootstrap-output.md](docs/en/bootstrap-output.md).

All available prompts (audit, release, drift check, ...) and what they do: [docs/en/commands.md](docs/en/commands.md).

### Common Prompts

| Scenario | Prompt |
| --- | --- |
| First-time setup | `initialize project governance` |
| Plan a development task | `plan this task` |
| Health check on a governed repo | `audit governance` |
| Governance drift report | `check governance drift` |
| Inspect the repo stack | `inspect the repo` |
| Generate CI | `setup CI` |
| Validate governance | `governance check` |
| Record task state | `update state` |
| Cut a release | `release` |


### Core Capabilities

#### Bootstrap & Runtime Governance

- **Governance bootstrap** — one INIT builds the skeleton: repository inspection → rules → AGENTS.md → feature registry → CI → validator → state
- **Runtime governance** — the generated AGENTS.md + per-tool adapters govern every session; multi-language CI with format baselines (Node/TS, Python, Rust, Go, Java, C++)
- **Structural adaptivity** — maturity-adaptive strategy (L0 empty repo → L3 production), merge-only, no forced migration

#### Drift Detection & Validation

- **Drift detection** — `drift-check` compares manifest against reality and reports governance decay
- **Validation gates** — a zero-dependency validator fails CI when governance artifacts are missing
- **Activity audit** — append-only `.governance/activity.jsonl` per-task trail ("which agent did what, when, with what result"), consumable by drift-check reports
- **Secret scanning gate** — `scripts/check-secrets.js` blocks commits containing secret-like material (read-only, never prints the secret)

#### Anti-Regression

Unlike static rule files, AI Agent Governance continuously protects project knowledge from drift:

- **Lifecycle enforcement** — every change follows Understand → Plan → Implement → Validate → Synchronize → Report
- **Protected governance** — governance files cannot be weakened silently (reason → CHANGELOG → version bump → validator run)
- **Evidence-based reporting** — status is based on real validation output, never fabricated

Full mechanisms (permission matrix, deletion protection, rule priority, multi-agent locking): [docs/en/anti-regression.md](docs/en/anti-regression.md)

#### Git Workflow Governance

Guards the place where an agent can do the most irreversible damage — Git operations:

- **Protected branches** — `.governance/git-policy.json` blocks direct pushes to `main`/`master` (`directPush: false`, `allowForcePush: false`)
- **Branch-based development** — agents check the policy, create `feature/agent-<date>-<summary>`, and merge via PR with human approval
- **Controlled rollback** — revert/reset/restore stay the tools, governed by confirmation gates

#### Release Lifecycle

Releases run as a human-in-the-loop flow — **the AI proposes, the developer approves**:

```
Analyze changes → Generate SemVer proposal → Developer approval → Create tag → GitHub Release
```

- **Analyze** — `release-manager` inspects git history and change classifications (SemVer 2.0.0), produces a Release Proposal (current / recommended / release type / reasons / risk level / review recommendation / Release Notes) — read-only
- **Approve** — explicit developer confirmation before any write operation; uncertainty (Potential Breaking Change) pauses the flow and requests clarification
- **Execute** — after approval: annotated tag → push → GitHub Release, with synchronized versions. Spec: [references/workflows/release.md](references/workflows/release.md)

### Supported Agents

Claude Code · Cursor · Codex · opencode — and other AGENTS.md-based agents. The core is tool-neutral; compatibility comes from per-tool adapters (CLAUDE.md, .cursor/rules, copilot-instructions.md, opencode.json).

### Documentation

- [docs/en/skill-discovery.md](docs/en/skill-discovery.md) — how agents discover and trigger the skill
- [docs/en/commands.md](docs/en/commands.md) — user-facing prompts + runtime components
- [docs/en/bootstrap-output.md](docs/en/bootstrap-output.md) — complete annotated initialization output
- [docs/en/governance-model.md](docs/en/governance-model.md) — the Spec / Status / Health state model
- [docs/en/architecture.md](docs/en/architecture.md) — repository layout (what each directory is FOR)
- [docs/en/anti-regression.md](docs/en/anti-regression.md) — anti-regression mechanisms in full
- [docs/en/lifecycle.md](docs/en/lifecycle.md) — the 6-phase agent operating lifecycle
- [docs/en/validator.md](docs/en/validator.md) — validator usage and checks
- [docs/design-decisions/](docs/design-decisions/) — architecture decision records (简体中文)
- [docs/en/roadmap.md](docs/en/roadmap.md) — planned features and status
- [docs/glossary.md](docs/glossary.md) — trilingual terminology table
- [CONTRIBUTING.md](CONTRIBUTING.md) — development guide
- [CHANGELOG.md](CHANGELOG.md) — release history

### Roadmap

Next up: multi-agent coordination protocol · skill lifecycle management · remote governance dashboard · monorepo multi-governance domains.

Full roadmap with status and design docs: [docs/en/roadmap.md](docs/en/roadmap.md)


### License

[MIT](LICENSE) © 2026 Consciencieux
