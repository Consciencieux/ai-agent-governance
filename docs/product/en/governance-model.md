# Governance Model

[English](governance-model.md) · [简体中文](../zh-CN/governance-model.md) · [繁體中文](../zh-TW/governance-model.md)

The three-state model behind "Governance as Code": desired / current / observed state, tracked as version-controlled files inside the repository.

**The full machine-state specification lives in the skill body** — [SKILL.md](../../SKILL.md) (".governance/ 机器可读状态" section). This page is a developer summary of the concept.

### Spec / Status / Health

A Kubernetes-like Spec / Status / Health split:

| File | Role | Git |
| --- | --- | --- |
| `manifest.json` | desired state — unique index of all governance artifacts (path, `kind`, `type`, version) | tracked |
| `state.json` | current state — maturity, phase, agent identity, locks, completed/blocked | tracked |
| `preflight.json` | rollback snapshot taken before INIT writes | tracked |
| `generated/skills/` | generated agent modules (drift-check, release-manager, ...) | tracked |
| `validation.json` | observed state — last validator run | ignored (runtime output) |
| `drift-report.json` | drift report | ignored (runtime output) |

### Versioning

- `schema_version` — the data format version of the manifest
- `governance_version` — the governance framework version

They are separate. Bumping the framework does not require a schema change.

### Where the rest lives

MIGRATE flow, path resolution, runtime outputs and the activity audit trail are skill behavior — see [SKILL.md](../../SKILL.md) and `references/` (the generated state-manager sub-skill writes `.governance/activity.jsonl`).

---
