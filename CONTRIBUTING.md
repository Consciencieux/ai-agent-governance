# Contributing

[English](CONTRIBUTING.md) · [简体中文](CONTRIBUTING.zh-CN.md) · [繁體中文](CONTRIBUTING.zh-TW.md)

## Development

```bash
npm test                 # or node tests/run-tests.js
npm run check:must-ship  # CI blocking gate (must-ship mechanical set)
```

CI (ADR-0014 Migration Mode **EXITED**): blocking authority on all branches / PRs is `npm run check:must-ship`. Gen1 `npm run check` is observational (`continue-on-error`) and does not block merge. Releases follow `repo-workflows/skill-release.md`.

## Where Things Live

The full repository layout — every directory and its role, down to individual scripts — is documented in [docs/product/en/architecture.md](docs/product/en/architecture.md) (Repository Layout, single source of truth). Pointers only:

| Path | Where documented |
| --- | --- |
| `SKILL.md` · `references/` · `scripts/` | `docs/product/en/architecture.md` § Repository Layout |
| `tests/run-tests.js` | test harness — run with `npm test` |
| `docs/` trees · `docs/glossary.md` · `docs/design-decisions/` · `docs/plans/archive/` | per-language docs, glossary, ADRs, archives |

**Where does a new file go?** Judge the knowledge type first, then the path and language (do not pick a language directory first):

- Repository knowledge objects (Product / Research / Finding / ADR / Roadmap / Plan / Glossary) → the routing table in `docs/README.md`
- Skill install artifacts and materialization sources → `SKILL.md`, `references/`, `scripts/`, placed by distribution role in `docs/product/en/architecture.md`. Being a generator input is **not** a semantic class; `references/templates/` is the current home of materialization templates, not a license to treat executable instruction sources as templates (FINDING-0026)
- Tests, CI and other development infrastructure → `tests/`, `.github/`, …

## Language Policy (by audience)

- **Agent-facing files are single-language** — `SKILL.md`, `AGENTS.md`, `references/**`, and the bodies of generated artifacts (AGENTS.md, rules, sub-skills) never carry a second language section. Convention: this skill's own execution docs (`SKILL.md`, `references/policies`, `references/workflows`) are 中文; auto-loaded agent guidance (`AGENTS.md`, template bodies) is English.
- **Within `docs/`, language follows knowledge type, not the whole tree.** **User-facing product docs** are trilingual and split — the six README/CONTRIBUTING entry files live at the repository root (`README.md`, `README.zh-CN.md`, `README.zh-TW.md`, `CONTRIBUTING.md`, `CONTRIBUTING.zh-CN.md`, `CONTRIBUTING.zh-TW.md`); the remaining product documentation lives in `docs/product/{en,zh-CN,zh-TW}/`. **简体中文 (zh-CN) is the canonical source** — edits originate there, then propagate to English and 繁體中文 (Taiwan usage). Editing one language requires updating the other two in the same change (stable docs). In-flight drafts may defer translation until they stabilize, but the parity gate must pass before push/release. Structural parity is enforced by `repo-tools/check-doc-parity.js` (CI + release precondition `docs.parity_passed`). **Roadmap** (`docs/plans/roadmap/`) is trilingual. **Plans / findings / research / ADR** are 简体中文 canonical single-language and are not part of the trilingual parity check.
- **Terminology** — before introducing a term, check `docs/glossary.md` and add the trilingual entry if missing; keep renderings consistent across all files.

## Changing Governance Artifacts

`SKILL.md`, `references/`, `scripts/` define the governance framework itself. Releases of this skill repo follow their own flow (see `repo-workflows/skill-release.md`):

1. Update `CHANGELOG.md` (classify: doc-only → none; fix → Fixed; feature → Added; breaking → Changed)
2. Bump `package.json` version (SemVer: breaking → MAJOR, feature → MINOR, fix → PATCH)
3. Keep version consistency: package.json · CHANGELOG · SKILL.md frontmatter · `references/init-spec.json` default · `scripts/generate-governance.js` sentinel · tag
4. Run `npm test` before pushing; `npm run check:must-ship` must be green before merging to `main`
5. Release only with the `release-manager` flow (preconditions include `gates.must_ship` → version sync → archive → validate → tag → push → GitHub Release)

## Development Workflow

1. Branch off `main` (short-lived, one logical change per branch)
2. Inspect the affected surface: read the files the change touches and their references; classify the change (documentation / governance mechanism / script-validator / tests / CI-release) — the classification decides the validation scope
3. Make the change, keeping the language and parity rules above
4. Run the checks that match the change scope (see Validation Requirements); `npm run check:must-ship` must be green before merge
5. Review your own diff before committing: staged files, no generated outputs, no unrelated edits
6. Commit with a Conventional Commit message (see Commit Conventions), push the branch, open a PR

## Validation Requirements

| Check | Role | When |
| --- | --- | --- |
| `npm run check:must-ship` | CI blocking | required green before merge to `main` / release (ADR-0024 must-ship set) |
| `npm run check:docs` | Gate | documentation (`docs/`, README, CONTRIBUTING) changes |
| `npm run check:payload` | Gate | `references/` / `scripts/` / `SKILL.md` / LICENSE changes |
| `npm run check:tests` | Gate | `tests/` changes |
| `npm run check` | Observational | Gen1 full set; CI does not block merge |
| `npm run check:all` | Audit | before audit, or explicit full audit |
| `npm run check:skill-release` | Release | before a release, per `repo-workflows/skill-release.md` |

The narrower entries are gate-fail-closed for their scope; when in doubt, escalate to the larger scope — never narrow the verification. **Product blocking authority is `check:must-ship`**; Gen1 `npm run check` is observational. Which gates are advisory vs fail-closed, and what each pass means, is described in `AGENTS.md` § Validation.

## Commit Conventions

Conventional Commits in English: `feat(scope): subject` / `fix(scope): subject`. Never commit generated runtime outputs (`.governance/validation.json`, `.governance/drift-report.json`, `.governance/release-proposal.json` are git-ignored).

## AI-Assisted Contributions

AI-assisted development is welcome. Contributors remain responsible for understanding, testing, reviewing, and validating generated changes. AI output does not override repository source-of-truth files, governance policies, or validation requirements.

For potentially sensitive security issues, please avoid posting secrets or exploit details in public issues.

## License

[MIT](LICENSE) © 2026 Consciencieux
