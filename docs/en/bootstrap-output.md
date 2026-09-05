# Bootstrap Output

[English](bootstrap-output.md) · [简体中文](../zh-CN/bootstrap-output.md) · [繁體中文](../zh-TW/bootstrap-output.md)

The INIT scripted generator (`scripts/generate-governance.js`) produces a deterministic bootstrap file tree for governed projects. The machine-readable single source of truth is `references/init-spec.json`; this page summarizes it for humans — when they differ, the spec wins.

## Phase A — static skeleton

| Path | Source |
| --- | --- |
| docs/rules/lifecycle.md | references/policies/lifecycle.policy.md |
| docs/rules/git-policy.md | references/policies/git.policy.md |
| docs/rules/security.md | references/policies/security.policy.md |
| docs/rules/coding.md | references/policies/coding.policy.md |
| docs/rules/testing.md | references/policies/testing.policy.md |
| docs/rules/governance-files.md | references/policies/governance-files.policy.md |
| AGENTS.md | references/templates/agents-md.template.md (placeholders resolved) |
| CHANGELOG.md | static (Keep a Changelog, Unreleased section) |
| README.md | static bootstrap with documentation index |
| docs/features/ | dir placeholder + _TEMPLATE.md (feature template with anti-fabrication rules) |
| docs/plans/ + docs/plans/archive/ | dirs (archive per Lifecycle Phase 5) |
| docs/plans/DEVELOPMENT_PLAN.md | static milestone plan |
| docs/ARCHITECTURE.md | static skeleton (component registry + ADRs) |

## Phase B — config, state and scripts

| Path | Source |
| --- | --- |
| .gitignore | generated (security baseline, deterministic) |
| .env.example | references/templates/env-example.template.md |
| .gitmessage.txt | references/templates/gitmessage.template.md |
| .governance/ + .governance/README.md | dir + static explanation |
| .governance/manifest.json | generated last — lists only artifacts that exist on disk |
| .governance/state.json / preflight.json | generated (deterministic; preflight fields empty until Phase 0 inspection) |
| .governance/git-policy.json / sync-rules.json | templates (JSON extracted from code block) |
| scripts/verify-governance.js + 4 gate scripts | copied verbatim from this skill |

## Phase C — adaptive output and optional hooks

| Path | Source |
| --- | --- |
| .github/workflows/ci.yml (or .gitlab-ci.yml) | selected from references/workflows/ci.md |
| scripts/check-doc-freshness.js + check-doc-consistency.js | copied verbatim from this skill |
| .governance/generated/skills/ | generated from references/templates/sub-skills.md |
| .githooks/pre-commit + .githooks/commit-msg | references/templates/githooks-template.md; executable, opt-in, never enabled by INIT |

## Determinism and validation

- Same inputs produce byte-identical outputs (no timestamps, no randomness).
- Existing files are skipped, never overwritten (merge-not-overwrite arrives in Phase C).
- A Phase B output passes `scripts/verify-governance.js` (manifest mode) — covered by the end-to-end test in `tests/run-tests.js`.

CI workflow selection, tool-detected entry files, README language layout, and structure-adaptive mode (existing doc roots) remain agent-driven decisions; the listed Phase C artifacts are generated when their inputs are selected.
