# 本仓治理原则索引（REPO-ONLY）

Pointers only. Root `AGENTS.md` is the thin entry. Thin-entry rules: `docs/design-decisions/ADR-0022-agent-instruction-architecture.md`. **payload** = ships with skill; **repo** = this repository only.

Honesty gate: `node repo-tools/check-doc-consistency.js --gate` (scans this file's principles table). Release-only: pending-archive / changelog-coverage via `repo-workflows/skill-release.md`.

## Governance principles index

| Principle | Authoritative source | Scope |
| --- | --- | --- |
| Single source of truth | `references/policies/runtime-invariants.policy.md` § 单一事实源 | payload |
| Rule Priority | `references/policies/runtime-invariants.policy.md` § 规则优先级 | payload |
| Agent permission matrix | `references/policies/runtime-invariants.policy.md` § Agent 权限模型 | payload |
| Always-on invariants (三态 / 反虚构 / 默认值 / 语言 / 熔断 / 多 Agent / 错误分类) | `references/policies/runtime-invariants.policy.md` | payload |
| Language policy by audience | `references/policies/runtime-invariants.policy.md` § 语言政策 · `repo-workflows/conventions.md` | both |
| Governance file protection | `references/policies/governance-files.policy.md` | both |
| Multi-agent identity + locking | `references/policies/runtime-invariants.policy.md` § 多 Agent · `scripts/check-lock.js` | payload |
| Human-in-the-loop release | `references/workflows/release.md` · `repo-workflows/skill-release.md` | both |
| SemVer discipline | `references/workflows/release.md` § Phase 2 | both |
| Release transactionality | `references/workflows/release.md` § 事务性 | payload |
| Turn-scoped consent + exceptions A/B | `references/policies/git.policy.md` § 确认范围（sole authority; ADR-0024） | both |
| Payload self-containment | `references/init-spec.json` § invariants | repo |
| Distribution roles (declared, never inferred) | `references/init-spec.json` · `docs/product/en/architecture.md` § Three distribution roles | repo |
| Engineering restraint / machinery test | `references/policies/coding.policy.md` § 工程克制与机制测试 | both |
| Repo gate promotion (daily allowlist) | `repo-tools/daily-check-surface.v0.json` · `repo-tools/check-daily-check-surface.js` | repo |
| Reference closure | `references/policies/testing.policy.md` § 引用闭合 · `references/capabilities/audit-drift.md` | both |
| Change placement and residue cleanup | `references/policies/coding.policy.md` § 变更归位与残留清理（lifecycle 仅编排指针） | payload |
| Root-cause repair + failure budget | `references/policies/lifecycle.policy.md` § 根因修复协议与失败预算 | payload |
| Discovery Ledger | `references/policies/lifecycle.policy.md` § 发现台账 · `docs/design-decisions/ADR-0021-known-issue-closure.md` | payload |
| Two-domain symmetry + sibling closure + control-plane trace | `references/policies/lifecycle.policy.md` § 根因修复协议与失败预算 | payload |
| Scope tiering | `references/policies/lifecycle.policy.md` § 规模分级 | payload |
| Horizon vs everyday edits | `docs/design-decisions/ADR-0025-gen2x-product-path.md` decision 2 · lifecycle § 规模分级 · `docs/plans/roadmap/` | both |
| Test protection | `references/policies/testing.policy.md` § 测试保护 | payload |
| CHANGELOG content boundary | `references/policies/lifecycle.policy.md` · `repo-workflows/changelog-policy.md` | both |
| Agent instruction architecture | `docs/design-decisions/ADR-0022-agent-instruction-architecture.md` · `docs/research/RESEARCH-0009-agent-instruction-architecture.md` | both |
| Task→Capability routing | `docs/research/RESEARCH-0012-task-capability-routing.md` · `repo-tools/routing-graph.v0.json` · `repo-tools/route-task.js` | repo |
| Producer/product separation | `AGENTS.md` always-on I5 · `docs/design-decisions/ADR-0020-producer-product-governance-separation.md` · `docs/product/en/architecture.md` § Third axis | repo |
| Governance Control Model | `docs/design-decisions/ADR-0023-governance-control-model.md` · `docs/research/RESEARCH-0010-governance-control-model.md` | repo |
| 2.x product path | `docs/design-decisions/ADR-0025-gen2x-product-path.md` | repo |
| Artifact placement | `docs/README.md` § 东西放哪里 · `docs/findings/FINDING-0030-artifact-placement-routing-gap.md` | repo |
| File size budget (advisory) | `docs/README.md` § 顾问级行数预算 · `repo-tools/check-file-size-budget.js` | repo |
