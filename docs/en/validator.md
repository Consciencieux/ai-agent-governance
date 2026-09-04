# Validator

[English](validator.md) · [简体中文](../zh-CN/validator.md) · [繁體中文](../zh-TW/validator.md)

The governance validator is a zero-dependency plain-Node script generated into each governed project as `scripts/verify-governance.js` (source: this repo's `scripts/verify_governance.js`). This page is a developer usage manual; the check list itself is defined by the script, not restated here.

### Usage

```bash
node scripts/verify-governance.js          # human-readable report, exit code = pass/fail
node scripts/verify-governance.js --json   # machine-readable JSON report
node scripts/verify-governance.js --help   # usage
```

Exit code 0 when every governance artifact exists, 1 otherwise.

### Modes

- **Manifest mode** — when `.governance/manifest.json` declares a non-empty `artifacts` array, paths are resolved from it (structure-adaptive). Adds manifest-specific checks (schema, artifact kinds, governance version, optional release metadata).
- **Defaults mode** — without a manifest, a built-in defaults list is checked (AGENTS.md, CHANGELOG format, architecture/features/plans/rules dirs, .gitignore, .env.example, CI workflow, scripts, .governance/ state files, governance version).
- **Generated-skills checks (both modes)** — when `.governance/generated/skills/` exists, one check per skill directory asserts a real `SKILL.md` inside the project tree (a symlinked file, or a skill directory linked out of the tree, is rejected). These append to the mode's list, so `M` in `N/M checks passed` grows with the number of generated skills.

Artifact paths are containment-checked: a manifest entry that escapes the project root (or resolves outside it through a link) is reported as failed rather than stat'ed out-of-tree.

The authoritative check list lives in `scripts/verify_governance.js` (the `DEFAULTS` array); `check-doc-consistency.js` cross-checks numeric claims in docs against it. Runtime outputs `validation.json` / `drift-report.json` are NOT required artifacts — a fresh checkout passes without them.

### Governance badge (optional)

The CI governance job produces a shields.io `endpoint`-format artifact (`governance-badge.json`: `{ "schemaVersion": 1, "label": "governance", "message": "N/M", "color": "green|yellow|red" }`). Host it at a public URL of your choice and reference it in the README:

```markdown
[![Governance](https://img.shields.io/endpoint?url=<YOUR_HOSTED_URL>/governance-badge.json)](scripts/verify-governance.js)
```

`score` (passed/total, unweighted v1) in `--json` output is the composite the badge and future dashboards consume. Color thresholds: 100% green, ≥80% yellow, otherwise red.

### Report

Human mode prints `✓/✗ <name> (<path>)` per check plus `N/M checks passed.`. JSON mode returns `{ mode, governance_version, total, passed, failed, score (passed/total), passedAll, results[] }`. Governance checks must pass before a task can be declared done, and before RELEASE.

---
