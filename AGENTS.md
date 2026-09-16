# AGENTS.md

Guidelines for agents on this **skill distribution repo** (not a governed product app). Lightweight: release + plans/archive + ADRs + tests.

**Always-on — producer ≠ skill product (I5):** Skill payload (`SKILL.md` + `references/` + `scripts/`) MUST NOT embed this repo's construction IDs (`PLAN-*` / `ADR-*` / `FINDING-*` / `RESEARCH-*`). REPO-ONLY `tests/` MUST NOT require those IDs in INSTALLED bodies. `CTRL-*` product controls are allowed. Map: [architecture.md](docs/product/en/architecture.md) § Third axis · [ADR-0020](docs/design-decisions/ADR-0020-producer-product-governance-separation.md) I5. Gate: `payload` suite (`npm run check:payload`).

## How to work (route)

| When | Read |
| --- | --- |
| Layout / gates | [docs/product/en/architecture.md](docs/product/en/architecture.md) · CI = `check:must-ship` · daily = `npm run check` |
| Any non-trivial edit | `node repo-tools/route-task.js --task <class>\|--path <file>` → `read_set` / `run_set` only |
| Any Git write | [`references/policies/git.policy.md`](references/policies/git.policy.md) (sole authority; ADR-0024) |
| File getting fat / size report | [docs/README.md](docs/README.md) § 顾问级行数预算 · `npm run check:file-size`（顾问上限，非日常目标） |
| Principles map | [`repo-workflows/principles-index.md`](repo-workflows/principles-index.md) |
| Edit / protect / validate | [`repo-workflows/agent-change.md`](repo-workflows/agent-change.md) |
| Conventions | [`repo-workflows/conventions.md`](repo-workflows/conventions.md) |
| Product spec / contributing | [SKILL.md](SKILL.md) · [CONTRIBUTING.md](CONTRIBUTING.md) |
| Status | [docs/plans/roadmap/](docs/plans/roadmap/) Now — do not duplicate horizon lists here |
| This-repo release / CHANGELOG accession | [`repo-workflows/skill-release.md`](repo-workflows/skill-release.md) · [`repo-workflows/changelog-policy.md`](repo-workflows/changelog-policy.md) |
