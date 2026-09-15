# Contributing

[English](CONTRIBUTING.md) · [简体中文](CONTRIBUTING.zh-CN.md) · [繁體中文](CONTRIBUTING.zh-TW.md)

## Development

```bash
npm test                 # or node tests/run-tests.js
npm run check:must-ship  # CI blocking gate (must-ship mechanical set)
```

CI (ADR-0014 Migration Mode **EXITED**; PLAN-0052): blocking authority on all branches / PRs is `npm run check:must-ship`. Local `npm run check` remains for maintainers; it is **not** a CI job. Releases follow `repo-workflows/skill-release.md`.

## Where Things Live

The full repository layout — every directory and its role, down to individual scripts — is documented in [docs/product/en/architecture.md](docs/product/en/architecture.md) (Repository Layout, single source of truth). Pointers only:

| Path | Where documented |
| --- | --- |
| `SKILL.md` · `references/` · `scripts/` | `docs/product/en/architecture.md` § Repository Layout |
| `tests/run-tests.js` | test harness — run with `npm test` |
| `docs/` trees · `docs/glossary.md` · `docs/design-decisions/` · `docs/plans/archive/` | per-language docs, glossary, ADRs, archives |

**Where does a new file go?** Judge the knowledge type first, then the path and language (do not pick a language directory first):

- Repository knowledge objects (Product / Research / Finding / ADR / Roadmap / Plan / Glossary) → the routing table in `docs/README.md`
- Skill install artifacts and materialization sources → `SKILL.md`, `references/`, `scripts/`, placed by distribution role in `docs/product/en/architecture.md`. Directory class follows semantic responsibility (ADR-0026): instruction sources live in `references/instruction/`; `references/templates/` is materialization only.
- Tests, CI and other development infrastructure → `tests/`, `.github/`, …

## Language Policy (by audience)

- **Agent-facing files are single-language** — `SKILL.md`, `AGENTS.md`, `references/**`, and the bodies of generated artifacts (AGENTS.md, rules, sub-skills) never carry a second language section. Convention: this skill's own execution docs (`SKILL.md`, `references/policies`, `references/workflows`) are 中文; auto-loaded agent guidance (`AGENTS.md`, template bodies) is English.
- **Within `docs/`, language follows knowledge type, not the whole tree.** **User-facing product docs** are trilingual and split — the six README/CONTRIBUTING entry files live at the repository root (`README.md`, `README.zh-CN.md`, `README.zh-TW.md`, `CONTRIBUTING.md`, `CONTRIBUTING.zh-CN.md`, `CONTRIBUTING.zh-TW.md`); the remaining product documentation lives in `docs/product/{en,zh-CN,zh-TW}/`. **简体中文 (zh-CN) is the canonical source** — edits originate there, then propagate to English and 繁體中文 (Taiwan usage). Editing one language requires updating the other two in the same change (stable docs). In-flight drafts may defer translation until they stabilize, but the parity gate must pass before push/release. Structural parity is enforced by `repo-tools/check-doc-parity.js` (CI + release precondition `docs.parity_passed`). **Roadmap** (`docs/plans/roadmap/`) is trilingual. **Plans / findings / research / ADR** are 简体中文 canonical single-language and are not part of the trilingual parity check.
- **Terminology** — before introducing a term, check `docs/glossary.md` and add the trilingual entry if missing; keep renderings consistent across all files.

## Changing Governance Artifacts

`SKILL.md`, `references/`, `scripts/` define the governance framework itself. Releases of this skill repo follow their own flow (see `repo-workflows/skill-release.md`):

1. Update `CHANGELOG.md` (classify: doc-only → none; fix → Fixed; feature → Added; breaking → Changed)
2. Bump `package.json` version (SemVer: breaking → MAJOR, feature → MINOR, fix → PATCH)
3. Keep version consistency: package.json · CHANGELOG · SKILL.md frontmatter · `references/init-spec.json` default · `scripts/lib/generate/run.js` sentinel · tag
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

Run the matching gate group before declaring work done; run `npm run check:all` before audit; run `npm run check:skill-release` (adds `--release-gate` fail-closed clusters) before release per `repo-workflows/skill-release.md`. Record real output — never claim "should pass". **CI blocking authority is `npm run check:must-ship`** (ADR-0014 EXITED; ADR-0024; PLAN-0052 removed the Gen1 CI observation job).

### Scope tiering

Match the narrowest row by `git diff --name-only` prefix. When scope is uncertain, escalate — never narrow verification. Entries share fail-closed exit semantics; only the gate set changes.

| Scope | When to use | What it runs |
| --- | --- | --- |
| `npm run check:docs` | `docs/`, `README.md`, `CONTRIBUTING.md`, `architecture.md` changed | test + parity + consistency + layout |
| `npm run check:payload` | `references/`, `scripts/`, `SKILL.md`, `LICENSE` changed | test + layout + consistency + role-completeness + hygiene |
| `npm run check:tests` | `tests/`, `.gitattributes` changed | test + hygiene |
| `npm run check:full` | default, uncertain scope, or explicit full request | test + parity + layout + consistency + hygiene + role-completeness |
| `npm run check:all` | audit, or explicit full audit | check + freshness + plan delivery |
| `npm run check:must-ship` | merge / release CI | must-ship mechanical set only |

### What each gate proves (evidence tiers)

| Gate | Checks | Evidence tier | What pass means |
| --- | --- | --- | --- |
| `npm test` | suites under `tests/suites/*.test.js` | mechanical | conditions for the changed scope hold |
| `check-doc-parity.js` | trilingual tree structure | mechanical | trees are structurally parallel (not semantic equivalence) |
| `check-layout-sync.js` | scanned dirs listed in architecture.md ×3 | mechanical | no file without a documented home |
| `check-doc-consistency.js --gate` | cross-document fact clusters (frozen; new checks prefer standalone scripts) | mechanical | declared facts match sources |
| `check-coding-hygiene.js --gate` | suite ownership, residue markers | mechanical | test architecture intact |
| `check-role-completeness.js --gate` | role classification / packaging | mechanical | distribution contract complete |
| `check-doc-freshness.js` | stale docs / translation lag | mechanical (report; `--release-gate` blocks) | no mechanical staleness detected |
| `check-plan-delivery.js` | plan declarations vs delivered paths | mechanical | declared files/ids present |
| `verify_governance.js` | governance artifact existence | mechanical | default mode here fails by design (ADR-0006) |

Evidence tiers: **mechanical** = marker/path/structure/existence (pass ≠ “behavior correct”); **human-attested** = requires human review (no automated gate emits this today); **unverified claim** = declaration without independent check.

### Impact-face check

Before touching a public interface/module/file, search references (`rg "<name>"`); hits enter Affected Files. At task end, compare `git diff --name-only` to that list: listed-but-unchanged → fix or justify; changed-but-not-listed → explain or revert. Compare also to the plan `Target`: out-of-domain edits must be explained or reverted.

### Reference-closure check

Payload work, and every “is the architecture sound / are rules mixed / is the skill usable” question: impact-face resolves references *inside this repo* — that is not enough for anything that ships. An INSTALLED file is written where `references/workflows/release.md` exists and read where it does not. Green gates do not prove target closure. Walk:

1. **Reference closure** — from each INSTALLED file, every referenced path/command/script must exist *in a governed project*.
2. **Stage closure** — each phase’s own output must satisfy the contract that output declares.
3. **Clean-target verification** — package → INIT a throwaway project → run rules/scripts/sub-skills *there*.
4. **Reverse-dependency check** — forbid governed rule → this repo’s `docs/`; generated sub-skill → SKILL-INTERNAL script; INSTALLED → this repo’s `package.json`; Phase A → Phase B/C file.

Enumerate by resolvability; do not sample “repo-looking” lines. Stance reference: `scripts/check-doc-consistency.js`. Always-on pointer for agents: `AGENTS.md` § Reference-closure check.

## Commit Conventions

Conventional Commits in English: `feat(scope): subject` / `fix(scope): subject`. Never commit generated runtime outputs (`.governance/validation.json`, `.governance/drift-report.json`, and for governed projects `.governance/release-proposal.json`; this repo uses `repo-tools/.release/proposal.json` — all git-ignored).

## AI-Assisted Contributions

AI-assisted development is welcome. Contributors remain responsible for understanding, testing, reviewing, and validating generated changes. AI output does not override repository source-of-truth files, governance policies, or validation requirements.

For potentially sensitive security issues, please avoid posting secrets or exploit details in public issues.

## License

[MIT](LICENSE) © 2026 Consciencieux
