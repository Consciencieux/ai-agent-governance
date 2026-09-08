# Agent Operating Lifecycle

[English](lifecycle.md) · [简体中文](../zh-CN/lifecycle.md) · [繁體中文](../zh-TW/lifecycle.md)

Every development task performed by any agent in a governed project follows a six-phase lifecycle: **Understand → Plan → Implement → Validate → Synchronize → Report**. Scope tiers decide how much applies: small changes (single file, <50 lines, no public-interface change) run Understand → Implement → Validate → Report only; medium/large changes run the full six phases with a TASK plan.

**The full spec lives in the skill body** — `references/policies/lifecycle.policy.md` — which is copied into governed projects as `docs/rules/lifecycle.md`. This page is a developer summary only.

The full lifecycle also includes Change Hygiene (current/compatibility/history surface checks for high-impact changes) and Rule Capture (explicit adjudication before persistent developer requirements enter the rule files); both are defined in the same policy.

### Change classification (when CHANGELOG is written)

| Change | CHANGELOG action |
| --- | --- |
| doc-only / comment / typo | no entry |
| bug fix | `Fixed` |
| new capability | `Added` |
| architecture / behavior / breaking | `Changed` |

### Definition of Done

Code + tests + all quality gates + CHANGELOG + docs sync. Anything missing = not done.

### Maturity levels (INIT strategy)

| Level | Judgement | Strategy |
| --- | --- | --- |
| L0 empty repo | README only / no source | full governance skeleton |
| L1 prototype | some source, no tests/CI/docs system | full skeleton + adopt existing files (merge, never overwrite) |
| L2 active | source + tests + partial CI/docs | incremental — only create missing items |
| L3 production | many files + existing conventions | audit mode — gap report + minimal patches only |

---
