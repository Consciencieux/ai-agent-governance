# Commands

[English](commands.md) · [简体中文](../zh-CN/commands.md) · [繁體中文](../zh-TW/commands.md)

All prompts below are chat prompts for AI coding agents, not shell commands. They follow the governance lifecycle: **Initialize → Develop → Maintain → Release**.

### Available Prompts

| Scenario | Prompt | Aliases |
| --- | --- | --- |
| New repository / first-time setup | `initialize project governance` | `initialize governance` · `setup project for AI agents` · `create AGENTS.md framework` |
| Planning a development task | `plan this task` | `create task plan` · `update development plan` · `check off milestone` · `mark task completed` |
| Existing governed repository maintenance | `audit governance` | `governance health check` · `fix governance drift` |
| Governance drift report | `check governance drift` | `governance health report` · `is governance intact` |
| Repository inspection | `inspect the repo` | `what is the stack` · `check environment` |
| CI setup | `setup CI` | `add CI` · `create workflow` |
| Governance validation | `governance check` | `verify governance` · `validate AGENTS` |
| State recording | `update state` | `record progress` |
| Reviewing changes or the project | `review this` | `review the changes` · `audit recent changes` · `review my changes` · `审核一下` · `review the whole project` · `deep review` |
| Preparing a release | `release` | `publish version` · `create release` · `/release vX.Y.Z` |

Git Workflow Governance has no prompt of its own — it takes effect automatically as a runtime rule: `scripts/check-git-policy.js` runs before work starts and gates direct pushes on protected branches when `.governance/git-policy.json` sets `directPush: false`. Git write operations (`commit` / `push` / `tag`) require explicit user consent — a write instruction or IDE stage-commit-push confirm counts as consent; the agent executes and reports afterward (see `docs/rules/git-policy.md`).

### Key Prompts

#### initialize project governance

Bootstraps governance for a repository: AGENTS.md, rules, feature registry, governance state, validators, CI.

```
Repository inspection → Generate foundation → Create state → Configure rules → Setup validation → Setup CI → Report
```

Detailed output: [bootstrap-output.md](bootstrap-output.md).

#### audit governance

Health-checks a governed project: detects drift, validates artifacts, applies minimal fixes.

#### release

Human-in-the-loop versioned release. The Proposal includes a risk level (low / medium / high).

```
Analyze changes → SemVer proposal + risk level → Approval → Tag → Push approved branch + tag (GitHub Release per project convention)
```

#### review this

Review across depth × scope: lightweight (`review this`) or full (`deep review`); default = change set, append a path or `review the whole project` to change scope.

### Generated Skills

INIT generates sub-skills under `.governance/generated/skills/<name>/SKILL.md`; the project's `AGENTS.md` contains the runtime registry. Users interact through the prompts above.

| Component | Triggers | Responsibility |
| --- | --- | --- |
| drift-check | `check governance drift` · `governance health report` · `is governance intact` | Compares manifest vs reality; modes: activity-report, freshness, consistency |
| governance-validator | `governance check` · `verify governance` · `validate AGENTS` | Runs the validator, records `validation.json` |
| ci-generator | `setup CI` · `add CI` · `create workflow` | Generates CI pipeline for the detected stack |
| repository-inspection | `inspect the repo` · `what is the stack` · `check environment` | Inspects environment, returns stack report |
| state-manager | `update state` · `record progress` | Persists progress to `.governance/state.json` |
| plan-manager | `plan this task` · `create task plan` · `update development plan` · `check off milestone` · `mark task completed` · `archive completed plan` | Creates TASK plans, checks milestones, archives on release |
| review-manager | `review this` · `review the changes` · `audit recent changes` · `review my changes` · `审核一下` · `deep review` · `full review` · `全面审查` · `彻底审查` · `逐行审查` · `review the whole project` · `全项目审核` · `audit everything` · `全项目彻查` | Depth × scope review (lightweight/full × change set/path/whole project) |
| release-manager | `release` · `publish version` · `create release` · `/release vX.Y.Z` | Executes the approval-gated release flow |

### Execution Rules

Any prompt with an uncertain outcome pauses and asks for clarification — never a silent guess.

---
