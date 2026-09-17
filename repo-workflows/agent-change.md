# 本仓变更：编辑 / 保护 / 校验（REPO-ONLY）

按需加载。架构正文 → `docs/product/en/architecture.md`；不在此复述。Git 写协议 → `references/policies/git.policy.md`（sole authority；写 Git 前按 `AGENTS.md` 路由加载）。

## Before editing

1. Layout: `docs/product/en/architecture.md`. CI block = `check:must-ship`; daily = `npm run check` (allowlist: `daily-check-surface.v0.json`).
2. Product spec: `SKILL.md`. Area guide: `CONTRIBUTING.md`.
3. Route first (ADR-0022): `node repo-tools/route-task.js --task <class>|--path <file>` → read `read_set` / run `run_set` only. Map: `docs/research/RESEARCH-0012-task-capability-routing.md`. Leaves: `references/policies/` + `references/capabilities/` + `SKILL.md` § 政策优先 / § 任务怎么做. Plans consume ADR-0024 + `repo-tools/script-inventory.v0.json` only.
4. **Status:** `docs/plans/roadmap/` Now — do not duplicate horizon lists in `AGENTS.md`.

## Change / protect / validate

- Protected set + flow: `references/policies/governance-files.policy.md` (reason → CHANGELOG if behavioral → `npm test`; never loosen).
- Plan needed?: Horizon → Active Plan (ADR-0025); small → lifecycle § 规模分级 may skip. Roadmap indexes status only.
- CHANGELOG format: lifecycle § 结构契约; repo accession: `repo-workflows/changelog-policy.md` (ADR-0012).
- Plans: `docs/plans/` → `status: Archived` (archive ≠ Release, ADR-0016); declare `Target` + status.
- Validate: `CONTRIBUTING.md` § Validation — narrowest `check:*`; real output; never “should pass”.
- Reference-closure: `references/policies/testing.policy.md` § 引用闭合 · SKILL Audit step 3 — green gates ≠ target-usable.
