# Anti-Regression System

[English](anti-regression.md) · [简体中文](../zh-CN/anti-regression.md) · [繁體中文](../zh-TW/anti-regression.md)

Governance doesn't stop at bootstrap — it constrains every agent on every task, so a second AI (or a new teammate's AI) cannot destroy what a previous agent built. This page is a developer-facing map of the anti-regression mechanisms; each one's full spec lives in the skill body (below).

- **Auto-loaded entry points** — `AGENTS.md` / `CLAUDE.md` / `.cursor/rules/` are read at session start (see `references/templates/agents-md.template.md`)
- **6-phase operating lifecycle** — Understand → Plan → Implement → Validate → Synchronize → Report (see `references/policies/lifecycle.policy.md`)
- **Code modification / deletion protection** — context analysis + ownership first; deletion needs reason + reference search + migration plan (see `references/policies/coding.policy.md`)
- **Change placement and residue cleanup** — for delete/rename/move/replace/deprecate/split/merge/config/API/generated-artifact changes, classify current/compatibility/history surfaces and leave no unexplained residue (see `references/policies/lifecycle.policy.md`)
- **Rule capture** — developer-stated persistent requirements are classified and explicitly adjudicated before they enter `AGENTS.md` / `docs/rules/**`; unresolved candidates remain resumable state (see `references/policies/lifecycle.policy.md`)
- **Change classification** — doc-only → no entry; fix → `Fixed`; new capability → `Added`; breaking → `Changed` (see `references/policies/lifecycle.policy.md`)
- **Governance file protection** — protected files need reason → CHANGELOG → version bump → validator run. The authoritative list lives in `references/policies/governance-files.policy.md` (single source of truth); this page does not repeat it
- **Rule priority** — System/Platform Safety > Explicit User Request > Governance Integrity > AGENTS.md > docs/rules/ > Existing Code Conventions
- **Agent permission matrix** — read auto; docs auto; code modification allowed but validated; deletion / dependencies / git commit require confirmation; push forbidden (see `references/policies/git.policy.md`)
- **Multi-agent locking** — `.governance/state.json` `locked` field; no parallel edits to the same file; resume from recorded phase (see `references/templates/sub-skills.md` → state-manager)
- **Evidence & recovery** — every report item ✅/⚠️/❌ against real output; `preflight.json` rollback snapshot (see `references/policies/lifecycle.policy.md`)

---
