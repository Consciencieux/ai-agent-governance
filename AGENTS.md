# AGENTS.md

Guidelines for agents working on the ai-agent-governance skill repo itself. This repo is a skill distribution repository (not a governed software project) — lightweight governance: release flow + plans/archive + ADRs + tests.

Thin entry (ADR-0022): always-on invariants + routing only. Detailed procedures live in the linked authorities — do not restate them here.

## Governance principles index

Where each principle authoritatively lives. Pointers only — never restate the content here; edit the authoritative file and this index stays valid. Scope: **payload** ships to governed projects; **repo** governs work on this repository.

| Principle | Authoritative source | Scope |
| --- | --- | --- |
| Single source of truth | `SKILL.md` § 单一事实源 | payload |
| Rule Priority (conflict adjudication) | `SKILL.md` § Rule Priority | payload |
| Agent permission matrix | `SKILL.md` § Agent Permission Model | payload |
| Three-state status protocol | `SKILL.md` § 状态协议 | payload |
| Anti-fabrication | `SKILL.md` § 反虚构规则 | payload |
| Feature placeholder strategy | `SKILL.md` § Feature 占位策略 | payload |
| Project defaults (no guessing) | `SKILL.md` § 项目默认值约定 | payload |
| Language policy by audience | `SKILL.md` § 语言政策 · this file § Conventions | both |
| Circuit breaker (error recovery) | `SKILL.md` § 熔断机制 | payload |
| Two-pass context breaker | `SKILL.md` § 上下文熔断 | payload |
| Governance file protection | `references/policies/governance-files.policy.md` | both |
| Multi-agent identity + locking | `SKILL.md` § 多 Agent 协作 | payload |
| Error classification | `SKILL.md` § 错误分类 | payload |
| Human-in-the-loop release | `references/workflows/release.md` § 发布流程总览 + `repo-workflows/skill-release.md` § Skill Repository Release | both |
| SemVer discipline | `references/workflows/release.md` § Phase 2 | both |
| Release transactionality | `references/workflows/release.md` § 事务性 | payload |
| Turn-scoped consent + exceptions A/B | `references/policies/git.policy.md` § 确认范围（**sole semantic authority**; this file keeps a pointer only — ADR-0024） | both |
| Payload self-containment | `references/init-spec.json` § invariants | repo |
| Distribution roles (declared, never inferred) | `references/init-spec.json` § invariants + § distribution · `docs/product/en/architecture.md` § Three distribution roles | repo |
| Engineering restraint / machinery test | `references/policies/coding.policy.md` § 工程克制与机制测试 | both |
| Repo gate promotion (daily allowlist) | `repo-tools/daily-check-surface.v0.json` · `repo-tools/check-daily-check-surface.js` · PLAN-0055 Stage 4D/4E（**不**进 payload 政策正文；`check:full` ≡ daily，不作停车场） | repo |
| Reference closure (validate in the execution environment) | this file § Reference-closure check · `CONTRIBUTING.md` § Reference-closure check · `SKILL.md` § Audit 流程 step 3 | both |
| Change placement and residue cleanup | `references/policies/coding.policy.md` § 变更归位与残留清理 · `references/policies/lifecycle.policy.md` § 变更归位与残留清理 | payload |
| Root-cause repair protocol + failure budget | `references/policies/lifecycle.policy.md` § 根因修复协议与失败预算 | payload |
| Discovery Ledger (known-issue closure L1) | `references/policies/lifecycle.policy.md` § 发现台账（Discovery Ledger） · ADR-0021 | payload |
| Two-domain symmetry + sibling-instance closure + control-plane trace | `references/policies/lifecycle.policy.md` § 根因修复协议与失败预算 | payload |
| Scope tiering (rule-decided, not self-judged) | `references/policies/lifecycle.policy.md` § 规模分级 | payload |
| Test protection | `references/policies/testing.policy.md` § 测试保护 | payload |
| CHANGELOG content boundary | `references/policies/lifecycle.policy.md` § CHANGELOG 内容边界 · `repo-workflows/changelog-policy.md` | both |
| Agent instruction architecture (thin entrypoint, contextual loading, mechanical-first) | `docs/design-decisions/ADR-0022-agent-instruction-architecture.md` · `docs/research/RESEARCH-0009-agent-instruction-architecture.md` · this file § Conventions | both |
| Task→Capability call topology (Phase 5 EXITED; repo construction) | `docs/research/RESEARCH-0012-task-capability-routing.md` · `repo-tools/routing-graph.v0.json` · `repo-tools/lib/routing.js` · `repo-tools/route-task.js` · this file § Task→Capability routing | repo |
| Producer/product separation (shared semantics, single authoritative owner, separate profiles) | `docs/design-decisions/ADR-0020-producer-product-governance-separation.md` · this file § Classification judge rule | repo |
| Governance Control Model (control identity, slots, profile binding) | `docs/design-decisions/ADR-0023-governance-control-model.md` · `docs/research/RESEARCH-0010-governance-control-model.md` | repo |
| 2.x product path (post-2.0 horizons) | `docs/design-decisions/ADR-0025-gen2x-product-path.md` · this file § Task→Capability routing | repo |
| Artifact placement and object creation (owner routing) | `docs/README.md` § 东西放哪里 · § 类型目录封闭 · § 文档职责与信息密度（incident evidence only：`docs/findings/FINDING-0030-artifact-placement-routing-gap.md`） | repo |

Always-on honesty gates for this index (consent / protected-files / principles-index / plan-status / prompt-sync / frontmatter-version) run via `node repo-tools/check-doc-consistency.js --gate` (REPO-ONLY profile; PLAN-0055 Stage 2). Terminology gate: `node repo-tools/check-terminology.js` (REPO-OWNED; ADR-0020). Pending-archive / archived-plan-status / changelog-coverage fail-closed only under `--release-gate` (`repo-workflows/skill-release.md`).

## Repository architecture

Authority: [docs/product/en/architecture.md](docs/product/en/architecture.md) (layout + distribution roles + portability axis).

Always-on hard rules:

- **Skill behavior** → edit `references/` only (+ `SKILL.md` pointer/entry + `CHANGELOG.md` if behavioral). Docs never change skill behavior.
- **`docs/`** = documentation duty. Trigger-word sync into `docs/product/{en,zh-CN,zh-TW}/commands.md` is the sole deliberate copy exception (ADR-0008; prompt-sync gate); authority stays in `references/templates/sub-skills.md`.
- **Generated skills ≠ scripts** — load from `.governance/generated/skills/<name>/SKILL.md`, not `scripts/<name>.js`.
- **Never restate skill workflows/rules into `docs/`** (trigger inventory exception only).
- **Classification judge** — who reads it / does it change the skill? Behavior → `references/`; knowledge → `docs/`; after type: **one ID = one file**. Placement: `docs/README.md` § 文档职责与信息密度.
- **Three-layer judge** — skill executor every run → `SKILL.md` policy; governed-project rules → `references/policies/`; this repo only → this file.

## Before touching anything

1. Read `docs/product/en/architecture.md` — Repository Layout (layout gate enforces it). **CI block = `npm run check:must-ship`**; local `npm run check` is daily hygiene only (CI observation removed — PLAN-0052); stage/research checkers default to **on-demand or retire** — joining daily requires `daily-check-surface.v0.json` + inventory + Plan adjudication (PLAN-0055 Stage 4D/4E; demote-to-full ≠ survival).
2. Read [SKILL.md](SKILL.md) (product spec).
3. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the relevant docs page for the area you change.

### Task→Capability routing (Phase 5 EXITED · repo construction)

Do **not** open the whole governance tree by default (ADR-0022 Context Economy):

1. Classify → `task_class` (+ optional facets), **or** run Detector/CLI.
2. Prefer `node repo-tools/route-task.js --task <class> …` or `--path <file>…` (impl: `repo-tools/lib/routing.js`; graph: `repo-tools/routing-graph.v0.json`). Map: [`RESEARCH-0012`](docs/research/RESEARCH-0012-task-capability-routing.md).
3. Read only `read_set`; run only `run_set`; if unmatched/over budget use `defer_set` — never silently load everything.
4. Leftover Capability leaves: retarget `AuthorityRef` only — do not rearrange by Gen1 dirs or invent a second lookup model. Plans **must consume** [ADR-0024](docs/design-decisions/ADR-0024-gen2-product-freeze.md) and [`script-inventory.v0.json`](repo-tools/script-inventory.v0.json) — no third destination ledger. 2.x order: [ADR-0025](docs/design-decisions/ADR-0025-gen2x-product-path.md). H2d [PLAN-0050](docs/plans/archive/PLAN-0050-h2d-payload-portability.md) **Archived**. [PLAN-0051](docs/plans/archive/PLAN-0051-v2.1.0-release-acceptance.md) **Archived** (`v2.1.0`). [PLAN-0052](docs/plans/archive/PLAN-0052-gen1-observation-sunset.md) **Archived** (Gen1 CI observation sunset). Active Plan: [PLAN-0055](docs/plans/PLAN-0055-gen1-carrier-absorb-and-retire.md) (Stage 1R+3: minimum-necessary; 2 scripts deleted). Queued Design: [PLAN-0053](docs/plans/PLAN-0053-v2.1.x-finding-patch-slice.md), [PLAN-0054](docs/plans/PLAN-0054-h3-runtime-research-design.md) (H3 far).

Instruction-surface leaves: `references/capabilities/` (coverage map retired with PLAN-0055 Stage 4E — leaf files are the authority; no parallel JSON map). Skill routing table: `SKILL.md` § 能力叶快速路由. This router is **REPO-ONLY**. Characterization: `node tests/run-tests.js --suite routing`.

## Protected files (governance file protection)

Summary: changing `SKILL.md`, `references/policies/**`, `references/templates/**`, `references/workflows/release.md`, `repo-workflows/**`, `scripts/*.js`, `repo-tools/*.js`/`.sh` requires reason → CHANGELOG (if behavioral) → `npm test`. Never loosen limits or remove validation. Full list: `references/policies/governance-files.policy.md`.

## Change classification (CHANGELOG)

- Small (single file, no public interface) may skip full lifecycle/CHANGELOG; medium/large follow `references/policies/lifecycle.policy.md` scope tiers.
- Shared CHANGELOG **format** contract: lifecycle policy § CHANGELOG 结构契约. Repo **accession** (decision ≠ delivered change): `repo-workflows/changelog-policy.md` (ADR-0012).
- Plans: `docs/plans/` → archive with `status: Archived` (**Plan archive ≠ Release**, ADR-0016). Every TASK plan declares `Target` (`payload` / `repo-infra` / `both`) and frontmatter `status` (`Design` / `Active` / `Implemented` / `Completed` / `Archived`).

## Validation

**Procedure authority:** [CONTRIBUTING.md](CONTRIBUTING.md) § Validation Requirements (scope table, per-gate evidence tiers, impact-face). Always-on:

- Match the narrowest `npm run check:*` scope for the diff; escalate when unsure.
- Record real output; never claim “should pass”.
- **CI block = `check:must-ship`**; Gen1 `check` = local-only (CI observation removed — PLAN-0052).
- Horizon pointer: ADR-0025; H2d [PLAN-0050](docs/plans/archive/PLAN-0050-h2d-payload-portability.md) **Archived**; [PLAN-0051](docs/plans/archive/PLAN-0051-v2.1.0-release-acceptance.md) **Archived** (`v2.1.0`); [PLAN-0052](docs/plans/archive/PLAN-0052-gen1-observation-sunset.md) **Archived**. Active Plan: PLAN-0055 (Stage 1R+3 minimum-necessary). Design queue: PLAN-0053 / PLAN-0054 (H3 far).

## Reference-closure check

Always-on obligation (detail: [CONTRIBUTING.md](CONTRIBUTING.md) § Reference-closure check · `SKILL.md` Audit step 3):

- Impact-face resolves references **in this repo**; shipping requires closure **in a governed project**.
- Walk: reference closure → stage closure → clean-target INIT verification → reverse-dependency forbid list.
- Green gates ≠ target-usable. Enumerate and resolve; do not sample “repo-looking” lines.

## Conventions

- **Language:** agent-facing (`SKILL.md`, `references/**`, generated bodies) = single language. Product docs / roadmap trilingual (`docs/product/{en,zh-CN,zh-TW}/` + root README/CONTRIBUTING ×3); plans/findings/research/ADRs = 简体中文 canonical. Edit all three languages together; new terms → `docs/glossary.md` first. Full policy: CONTRIBUTING + SKILL § 语言政策.
- **Distribution roles + portability axis:** `docs/product/en/architecture.md` § Three distribution roles · § The second axis (never bare “payload”).
- **Commits:** Conventional Commits, English.
- **After moves:** re-check hardcoded directory enumerations (`SCAN_DIRS`, role lists, search roots).
- **Sync group:** sub-skill / check-script changes update `commands.md` (± `validator.md`) + CHANGELOG if behavioral (prompt-sync gate).
- **Releases:** governed → `references/workflows/release.md`; this repo → `repo-workflows/skill-release.md` (REPO-ONLY). No tag/push/release without approval.
- **Roadmap is an index:** plans are fact sources; update roadmap in the same change as plan lifecycle events (`docs/plans/roadmap/`).

## Git Operation Safety Protocol (HIGHEST PRIORITY)

**Sole semantic authority:** [`references/policies/git.policy.md`](references/policies/git.policy.md) (§ 确认范围 / HITL invariants / independent-confirm list). This file is **not** a second authoritative body (ADR-0022 thin entry · ADR-0024 single owner). Load that policy before any Git write. Always-on summary only:

- Read-only git ops are free; `checkout -b` / clean-worktree branch switches are free.
- One confirmation per change set (pre-commit echo; instruction is not consent): echo the full command sequence `add → commit → push`, then take explicit consent; a user write instruction ("push"/"commit") **triggers** the echo — it is **not** consent.
- Plan approval is intent alignment, not commit authorisation; task-level phrasing ("wrap it up" / "发布吧") is not a write instruction.
- Any step fails → stop and report, never retry differently; push rejected (non-fast-forward) → stop and report, never pull/rebase.
- Independent confirmation (not covered by the pre-commit echo): `tag` / `reset` / `rebase` / `revert` / `merge` / force push / `clean` / `rm` / `restore` / `stash` / `pull`; checkout carrying uncommitted changes; amend of an already-pushed commit.
- Release: Proposal at Approval Gate covers the sequence (see `repo-workflows/skill-release.md`).
- Before confirming, still run: node `repo-tools/check-secrets.js` exit 0; no sensitive/unrelated files staged.

Details, checklists, and branch policy live in `git.policy.md`; on conflict, that file wins.
