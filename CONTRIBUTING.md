# Contributing

[English](CONTRIBUTING.md) · [简体中文](CONTRIBUTING.zh-CN.md) · [繁體中文](CONTRIBUTING.zh-TW.md)

Thank you for your interest in AI Agent Governance! Contributions of all kinds are welcome — bug reports, feature suggestions, documentation fixes, and code changes.

## Reporting Issues

- **Bug** — open a [GitHub Issue](https://github.com/Consciencieux/ai-agent-governance/issues) with steps to reproduce, expected vs actual behavior, and your agent/tool version.
- **Feature request** — open an Issue describing the use case and proposed behavior.
- **Security** — for potentially sensitive issues, please avoid posting secrets or exploit details in public issues. Email the maintainer or use GitHub's private vulnerability reporting.

## Development Setup

```bash
git clone https://github.com/Consciencieux/ai-agent-governance.git
cd ai-agent-governance
npm test                 # run the test suite
npm run check:must-ship  # CI blocking gate — must pass before merge
```

No additional dependencies required — all checks are zero-dependency Node.js scripts.

## Making Changes

1. Branch off `main` — one logical change per branch
2. Make the change
3. Run `npm test`; for documentation changes also run `npm run check:docs`
4. Commit with [Conventional Commits](https://www.conventionalcommits.org/) in English: `feat(scope): subject` / `fix(scope): subject`
5. Push and open a PR

CI runs `npm run check:must-ship` on every PR. If it's green, you're good.

## Language Policy

This project has trilingual documentation (English, 简体中文, 繁體中文):

- **简体中文 (zh-CN) is the canonical source** — edits originate there, then propagate to English and 繁體中文
- Editing one language requires updating the other two in the same change
- `repo-tools/check-doc-parity.js` enforces structural parity (runs in CI)

Agent-facing files (`SKILL.md`, `references/**`) are single-language and not part of the trilingual split.

## Code Organization

The full repository layout is documented in [architecture.md](docs/product/en/architecture.md) (single source of truth). Key areas:

| Path | Role |
| --- | --- |
| `SKILL.md` · `references/` · `scripts/` | Skill payload (ships to users) |
| `docs/product/{en,zh-CN,zh-TW}/` | User-facing product documentation (trilingual) |
| `docs/plans/` · `docs/findings/` · `docs/research/` · `docs/design-decisions/` | Internal knowledge (简体中文 only) |
| `tests/` | Test suites |
| `repo-tools/` · `repo-workflows/` | Repository-only tooling and workflows |

**Where does a new file go?** Judge the knowledge type first (routing table in [docs/README.md](docs/README.md)), then the path and language.

## Changing the Governance Framework

`SKILL.md`, `references/`, and `scripts/` define the governance framework that ships to users. Changes here have higher impact:

1. Update `CHANGELOG.md` (doc-only → none; fix → Fixed; feature → Added; breaking → Changed)
2. Bump `package.json` version (SemVer)
3. Keep version consistent across: `package.json` · `CHANGELOG` · `SKILL.md` frontmatter · `references/init-spec.json` · tag
4. Releases follow `repo-workflows/skill-release.md` with human-in-the-loop approval

## Validation

Match the narrowest check scope to your change:

| Change touches | Run |
| --- | --- |
| `docs/`, `README`, `CONTRIBUTING` | `npm run check:docs` |
| `references/`, `scripts/`, `SKILL.md` | `npm run check:payload` |
| `tests/` | `npm run check:tests` |
| Uncertain or broad | `npm run check:full` |
| Merge / release | `npm run check:must-ship` (CI gate) |

All gates are fail-closed. When in doubt, escalate to a broader scope. Full gate details: [architecture.md](docs/product/en/architecture.md).

## AI-Assisted Contributions

AI-assisted development is welcome. Contributors remain responsible for understanding, testing, reviewing, and validating generated changes. AI output does not override repository source-of-truth files, governance policies, or validation requirements.

## License

[MIT](LICENSE) © 2026 Consciencieux
