# Contributing

[English](CONTRIBUTING.md) · [简体中文](docs/zh-CN/CONTRIBUTING.md) · [繁體中文](docs/zh-TW/CONTRIBUTING.md)

## Development

```bash
npm test        # or node tests/run-tests.js
```

The test suite covers: empty project (exit 1), full default structure (exit 0, 21 checks), custom doc root via manifest (manifest mode), missing governance_version (exit 1), `--json` output, `--help`, no legacy `.agent` leakage, optional `validation.json`, CHANGELOG format check, lock check (no state / unlocked / held), git policy check (invalid policy / protected-branch blocked / feature-branch ok), secret scan (hit exit 1 without leaking token / clean exit 0 / missing gate fails validator), sync groups check (unsynced exit 1 / synced exit 0 / missing gate fails validator), release planning (SemVer classification: docs/refactor → patch, CLI → minor, deleted API → major, uncertainty → clarification, `--file` input), approval gate (unapproved → no tag, approved → annotated tag), generate-governance (Phase A file tree / determinism / placeholder resolution / manifest types / dry-run / json output / missing args), plus doc parity (parallel trees exit 0 / heading drift exit 1 / missing file exit 1), doc freshness (stale/very-stale detection via git log dates), doc consistency (clean exit 0 / stale version example flagged / broken link flagged), and --json score (1.0 full / 0.95 partial). CI runs it on every push/PR.

## Where Things Live

| Path | Purpose |
| --- | --- |
| `SKILL.md` | skill entry point / product spec — INIT/AUDIT/RELEASE orchestration |
| `references/` | skill body — the only place skill behavior lives: `templates/` (generation templates) · `policies/` (`*.policy.md` rules copied into governed `docs/rules/`) · `workflows/` (CI + release specs) |
| `scripts/verify_governance.js` | validator source, copied into governed projects |
| `scripts/release-manager.js` | release tool: `plan` (read-only) + `execute` (approval-gated) |
| `scripts/generate-governance.js` | INIT generator: deterministic bootstrap scaffolding (spec: `references/init-spec.json`) |
| `references/init-spec.json` | machine-readable INIT spec (single source of truth for generated output) |
| `tests/run-tests.js` | test harness |
| `docs/en/` `docs/zh-CN/` `docs/zh-TW/` | project knowledge — developer-maintained, read by developers and agents working here (how to use the skill: trigger words, plans, roadmap), one tree per language; NOT part of the skill payload |
| `docs/glossary.md` | trilingual terminology table (single source of truth for terms) |
| `docs/design-decisions/` | architecture decision records (shared, single-language 简体中文) |
| `docs/archive/` | completed plan archives (shared, single-language, never translated) |

**Where does a new file go?** If deleting the file would break agent execution (INIT/AUDIT/RELEASE read it) → `references/`. If it is project knowledge — how to use, maintain or contribute, read by developers AND agents working in this repo — → `docs/<language>/`.

## Language Policy (by audience)

- **Agent-facing files are single-language** — `SKILL.md`, `AGENTS.md`, `references/**`, and the bodies of generated artifacts (AGENTS.md, rules, sub-skills) never carry a second language section. Convention: this skill's own execution docs (`SKILL.md`, `references/policies`, `references/workflows`) are 中文; auto-loaded agent guidance (`AGENTS.md`, template bodies) is English.
- **Developer-facing files are trilingual and split** - the root keeps only the English landing files (`README.md`, `CONTRIBUTING.md`); the 简体中文/繁體中文 translations live inside their trees (`docs/zh-CN/README.md`, `docs/zh-TW/README.md`, ...). **简体中文 (zh-CN) is the canonical source** - edits originate there, then propagate to English and 繁體中文 (Taiwan usage). Editing one language requires updating the other two in the same change (stable docs). In-flight drafts may defer translation until they stabilize, but the parity gate must pass before push/release. Parity mapping: the English entry files are the root `README.md`/`CONTRIBUTING.md` (not duplicated under `docs/en/`). Structural parity is enforced by `repo-tools/check-doc-parity.js` (CI + release precondition `docs.parity_passed`).
- **Terminology** — before introducing a term, check `docs/glossary.md` and add the trilingual entry if missing; keep renderings consistent across all files.

## Changing Governance Artifacts

`SKILL.md`, `references/`, `scripts/` define the governance framework itself. Changes follow the release policy (see `references/workflows/release.md`):

1. Update `CHANGELOG.md` (classify: doc-only → none; fix → Fixed; feature → Added; breaking → Changed)
2. Bump `package.json` version (SemVer: breaking → MAJOR, feature → MINOR, fix → PATCH)
3. Keep version consistency: package.json · CHANGELOG · tag
4. Run `npm test` before pushing
5. Release only with the `release-manager` flow (preconditions → version sync → validate → tag → push → GitHub Release)

## Commit Conventions

Conventional Commits in English: `feat(scope): subject` / `fix(scope): subject`. Never commit generated runtime outputs (`.governance/validation.json`, `.governance/drift-report.json`, `.governance/release-proposal.json` are git-ignored).
