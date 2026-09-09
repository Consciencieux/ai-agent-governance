---
id: FINDING-0020
status: Resolved
type: control-gap
direction: E
root_cause: R4
severity: Medium
affected:
  - repo
github_issue:
opened: 2026-09-09
updated: 2026-09-09
observed_in: gen1
resolved_in: gen1
resolved: 2026-09-09
related:
  plans: []
  adrs:
    - ADR-0015
    - ADR-0018
  research:
    - RESEARCH-0007
---

# Roadmap 投影漂移：ADR-0018 阶段顺序 ≠ Roadmap 阶段定义

## 观察 Observation

ADR-0018 已正式定义 Gen2 Phase 0–8（Migration Mode → Producer/Product Separation → Research/Findings/Traceability → Governance Core/Rule Model → Checker/Primitive → Dispatcher → Invariant Testing → Review 三分 → Rebuild gates），并明确它是阶段顺序的权威来源。但同期 Roadmap 的 Migration Phases 段保留了**旧阶段定义**：Phase 2 是 Governance Core（ADR-0018 为 Research/Findings/Traceability）、Phase 8 是 Runtime Adapters（ADR-0018 为 Rebuild mandatory gates）等——不是命名差异，而是阶段集合本身不同。

按 ADR-0015 § 决策 6（权威优先级 Accepted ADR > Roadmap），Roadmap 是 projection/index，必须匹配裁决它的 ADR。此漂移意味着 projection 与 fact source 脱节，且无机械检查发现。

## 证据 Evidence

- `ADR-0018-generation-2-dev-path.md` § 决策 1：Phase 0–8 固定顺序。
- Roadmap `docs/plans/roadmap/{en,zh-CN,zh-TW}.md`（漂移时）：Phase 2 "Governance Core"、Phase 8 "Runtime Adapters" 等与 ADR-0018 不一致。
- `repo-tools/check-roadmap-sync.js` 只检查 implemented→Done、archived∉active、entry→plan 链接，**不覆盖「阶段清单 vs 裁决 ADR」**——故该漂移无机械信号。

## 根因 Root cause

R4（Enforcement Boundary）：Roadmap（projection）与其裁决 ADR（fact source）之间没有机械绑定；「阶段顺序必须与裁决 ADR 对齐」这一关系只有口头纪律，无 gate 承接（check-roadmap-sync.js 的职责面未包含它）。

## 影响 Impact

- Agent 按 Roadmap 施工时可能进入与 ADR-0018 冲突的阶段（违背权威优先级）。
- 阶段顺序权威出现双源：ADR-0018 与实际 Roadmap 各说一套。

## 关闭条件 Resolution criteria

1. Roadmap 的 Migration Phases 清单与 ADR-0018 Phase 0–8 完全一致。
2. Roadmap 改为索引 ADR-0018（不复述阶段裁决）。

## 解决 Resolution

（Resolved，2026-09-09。）Roadmap 三段（en / zh-CN / zh-TW）的「Generation 2 开发阶段」改为 ADR-0018 精确对齐的**阶段索引**（0–8 同名同序 + 一句话成果 + `Authority: ADR-0018` 指针），不再保留与 ADR-0018 冲突的独立阶段定义；`Current Long-term Direction` 同步为 P0–P8 序列。回归保护：权威优先级写入 ADR-0015 § 决策 6；阶段顺序裁决权明确归属 ADR-0018。

## 回归保护 Regression protection

- 描述层：`docs/research/RESEARCH-0007`（Planning / Knowledge Control Model）记录「Roadmap 是 projection、ADR 是阶段顺序权威」的系统模型。
- 规范层：ADR-0015 § 决策 6（Roadmap MUST NOT override Accepted ADR）+ ADR-0018 § 决策 6（Gen2 阶段必须通过 Active Plan 执行）。
- 机械 gap 仍开放：`check-roadmap-sync.js` 未覆盖「阶段清单 vs 裁决 ADR」→ 见 FINDING-0021 与后续执行层迁移。
