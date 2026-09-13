# AGENTS.md

Guidelines for agents on this **skill distribution repo** (not a governed product app). Lightweight: release + plans/archive + ADRs + tests.

Thin entry ([ADR-0022](docs/design-decisions/ADR-0022-agent-instruction-architecture.md)): invariants + routing only — **do not** restate linked authorities here.

## Governance principles index

Pointers only. **payload** = ships with skill; **repo** = this repository only.

| Principle | Authoritative source | Scope |
| --- | --- | --- |
| Single source of truth | `SKILL.md` § 单一事实源 | payload |
| Rule Priority | `SKILL.md` § Rule Priority | payload |
| Agent permission matrix | `SKILL.md` § Agent Permission Model | payload |
| Three-state status protocol | `SKILL.md` § 状态协议 | payload |
| Anti-fabrication | `SKILL.md` § 反虚构规则 | payload |
| Feature placeholder strategy | `SKILL.md` § Feature 占位策略 | payload |
| Project defaults (no guessing) | `SKILL.md` § 项目默认值约定 | payload |
| Language policy by audience | `SKILL.md` § 语言政策 · this file § Conventions | both |
| Circuit breaker | `SKILL.md` § 熔断机制 | payload |
| Two-pass context breaker | `SKILL.md` § 上下文熔断 | payload |
| Governance file protection | `references/policies/governance-files.policy.md` | both |
| Multi-agent identity + locking | `SKILL.md` § 多 Agent 协作 | payload |
| Error classification | `SKILL.md` § 错误分类 | payload |
| Human-in-the-loop release | `references/workflows/release.md` · `repo-workflows/skill-release.md` | both |
| SemVer discipline | `references/workflows/release.md` § Phase 2 | both |
| Release transactionality | `references/workflows/release.md` § 事务性 | payload |
| Turn-scoped consent + exceptions A/B | `references/policies/git.policy.md` § 确认范围（sole authority; ADR-0024） | both |
| Payload self-containment | `references/init-spec.json` § invariants | repo |
| Distribution roles (declared, never inferred) | `references/init-spec.json` · `docs/product/en/architecture.md` § Three distribution roles | repo |
| Engineering restraint / machinery test | `references/policies/coding.policy.md` § 工程克制与机制测试 | both |
| Repo gate promotion (daily allowlist) | `repo-tools/daily-check-surface.v0.json` · `repo-tools/check-daily-check-surface.js` | repo |
| Reference closure | `CONTRIBUTING.md` § Reference-closure check · `SKILL.md` Audit step 3 | both |
| Change placement and residue cleanup | `references/policies/coding.policy.md` · `references/policies/lifecycle.policy.md` | payload |
| Root-cause repair + failure budget | `references/policies/lifecycle.policy.md` § 根因修复协议与失败预算 | payload |
| Discovery Ledger | `references/policies/lifecycle.policy.md` § 发现台账 · ADR-0021 | payload |
| Two-domain symmetry + sibling closure + control-plane trace | `references/policies/lifecycle.policy.md` § 根因修复协议与失败预算 | payload |
| Scope tiering | `references/policies/lifecycle.policy.md` § 规模分级 | payload |
| Horizon vs everyday edits | [ADR-0025](docs/design-decisions/ADR-0025-gen2x-product-path.md) decision 2 · lifecycle § 规模分级 · `docs/plans/roadmap/` | both |
| Test protection | `references/policies/testing.policy.md` § 测试保护 | payload |
| CHANGELOG content boundary | `references/policies/lifecycle.policy.md` · `repo-workflows/changelog-policy.md` | both |
| Agent instruction architecture | [ADR-0022](docs/design-decisions/ADR-0022-agent-instruction-architecture.md) · RESEARCH-0009 | both |
| Task→Capability routing | RESEARCH-0012 · `repo-tools/routing-graph.v0.json` · `repo-tools/route-task.js` | repo |
| Producer/product separation | [ADR-0020](docs/design-decisions/ADR-0020-producer-product-governance-separation.md) | repo |
| Governance Control Model | [ADR-0023](docs/design-decisions/ADR-0023-governance-control-model.md) · RESEARCH-0010 | repo |
| 2.x product path | [ADR-0025](docs/design-decisions/ADR-0025-gen2x-product-path.md) | repo |
| Artifact placement | `docs/README.md` § 东西放哪里 · FINDING-0030 | repo |

Index honesty gates: `node repo-tools/check-doc-consistency.js --gate`. Terminology: `node repo-tools/check-terminology.js`. Release-only: pending-archive / changelog-coverage via `repo-workflows/skill-release.md`.

## Architecture (one-liners)

Authority: [docs/product/en/architecture.md](docs/product/en/architecture.md).

- Skill behavior → `references/` (+ `SKILL.md` entry; `CHANGELOG.md` if behavioral). Docs never change skill behavior.
- `docs/` = documentation. Sole copy exception: trigger sync → `docs/product/*/commands.md` (ADR-0008).
- Generated skills ≠ scripts — in a **governed project**, load `.governance/generated/skills/<name>/SKILL.md` (INSTALLED). This skill-distribution repo does not dogfood that tree; do not invent it here.
- Classification: behavior → `references/`; knowledge → `docs/`; one ID = one file (`docs/README.md`).
- Three-layer: executor → `SKILL.md`; governed rules → `references/policies/`; this repo → this file.
- This repo’s release scratch is `repo-tools/.release/proposal.json` (gitignored).

## Before editing

1. Layout: `docs/product/en/architecture.md`. CI block = `check:must-ship`; daily = `npm run check` (allowlist: `daily-check-surface.v0.json`).
2. Product spec: [SKILL.md](SKILL.md). Area guide: [CONTRIBUTING.md](CONTRIBUTING.md).
3. Route first (ADR-0022): `node repo-tools/route-task.js --task <class>|--path <file>` → read `read_set` / run `run_set` only. Map: RESEARCH-0012. Leaves: `references/capabilities/` + `SKILL.md` § 能力叶快速路由 (REPO-ONLY). Plans consume ADR-0024 + `script-inventory.v0.json` only.
4. **Status:** see `docs/plans/roadmap/` Now (no Active Plan; Design = PLAN-0054). Do not duplicate horizon lists here.

## Change / protect / validate

- Protected set + flow: `references/policies/governance-files.policy.md` (reason → CHANGELOG if behavioral → `npm test`; never loosen).
- Plan needed?: Horizon → Active Plan (ADR-0025); small → lifecycle § 规模分级 may skip. Roadmap indexes status only.
- CHANGELOG format: lifecycle § 结构契约; repo accession: `repo-workflows/changelog-policy.md` (ADR-0012).
- Plans: `docs/plans/` → `status: Archived` (archive ≠ Release, ADR-0016); declare `Target` + status.
- Validate: [CONTRIBUTING.md](CONTRIBUTING.md) § Validation — narrowest `check:*`; real output; never “should pass”.
- Reference-closure: CONTRIBUTING § Reference-closure · SKILL Audit step 3 — green gates ≠ target-usable.

## Conventions

- Language / glossary: CONTRIBUTING + SKILL § 语言政策 (product/roadmap ×3; plans/findings/ADR = 简体中文).
- Commits: Conventional Commits, English.
- After moves: re-check hardcoded dir lists (`SCAN_DIRS`, role lists, roots).
- Prompt-sync: sub-skill / check-script → `commands.md` (+ CHANGELOG if behavioral).
- Releases: governed → `references/workflows/release.md`; this repo → `repo-workflows/skill-release.md`.
- Roadmap = index; update it in the same change as plan lifecycle events.

## Git writes (HITL)

**Sole authority:** [`references/policies/git.policy.md`](references/policies/git.policy.md). This file is not a second body (ADR-0024). Load it before any Git write.

Always-on (markers only; details in policy):

- Read-only free; `checkout -b` / clean switch free.
- One confirmation per change set (pre-commit echo; instruction is not consent): echo full command sequence `add → commit → push`, then explicit consent — user “push”/“commit” **triggers** echo, is **not** consent.
- Plan approval is intent alignment, not commit authorisation; “wrap it up” / “发布吧” are not write instructions.
- Any step fails → stop and report, never retry differently; push rejected (non-fast-forward) → stop and report, never pull/rebase.
- Independent confirm: `tag` / `reset` / `rebase` / `revert` / `merge` / force-push / `clean` / `rm` / `restore` / `stash` / `pull`; dirty checkout; amend of pushed commit.
- Release: Proposal at Approval Gate covers the sequence (`repo-workflows/skill-release.md`).
- Before confirm: `node repo-tools/check-secrets.js` exit 0; no secrets/unrelated files staged.
