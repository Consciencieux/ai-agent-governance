---
id: PLAN-0033
status: Active
generation: gen2
target: repo-infra
---

# PLAN-0033：已知问题闭包（Discovery Ledger）

> （进行中。2026-09-09：建立 Known-Issue Closure 执行语义（ADR-0021）、运行模型（RESEARCH-0008）、缺口证据（FINDING-0022），并在本计划内演示第一代 **prototype / characterization** `## Discovery Ledger`——证明载体可行，不宣称机制已在所有任务落地。）

第一代只在 repo 侧演示（prototype）；payload（lifecycle.policy TASK 格式内嵌 ledger）留后续阶段。

## 背景

纵向修复控制（repairSessionId / failure budget）已存在，但横向问题集合控制缺失：已发现问题可能因 recursive discovery / focus drift 丢失（FINDING-0022）。本计划实现第一代 **Discovery Ledger**（任务内 append-only 表），使「已知问题 → 显式处置」成为任务级不变量。

## 目标

```text
发现一个问题
→ 先登记进不会丢失的持久 workset
→ 不自动抢占当前任务
→ 任务结束前每个条目有显式 disposition
→ Unaccounted = 0
```

## 三条不变量（实现目标）

1. **Once discovered → must remain represented → until explicit disposition。**
2. **New discovery ≠ automatic priority switch**（capture → classify → decide，不弃当前 item）。
3. **Task completion requires zero unaccounted**（terminal disposition：resolved / deferred / duplicate / not-applicable / blocked / promoted-to-finding / promoted-to-adr / promoted-to-research / promoted-to-next-plan；`Status` 与 `Disposition` 是两个轴——terminal disposition 后 `Status` 置 `closed`）。

## 第一代载体（append-only membership 表）

本计划即演示载体。执行期间任何新发现问题必须先追加到这里（**append-only membership**：条目不得删除，`Status` / `Disposition` 字段允许更新），任务结束时所有条目必须有 terminal disposition 且 `Status=closed`，并做 closure reconciliation。

## Discovery Ledger

| ID | Origin | Problem | Scope | Status | Disposition | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| K1 | initial | 修复任务无持久已知问题集合（recursive discovery 丢失风险） | repo+skill | closed | promoted-to-finding | FINDING-0022 |
| K2 | K1 | 需要 Accepted 执行语义（capture / disposition / zero-unaccounted） | repo+skill | closed | promoted-to-adr | ADR-0021 |
| K3 | K1 | 需要系统模型描述（vertical vs horizontal 两维度） | repo | closed | promoted-to-research | RESEARCH-0008 |
| K4 | K1 | 第一代载体 = TASK Plan 内 append-only 表（不重型 Registry） | repo | closed | resolved | 本计划 § 第一代载体 |
| K5 | K2 | payload 内嵌（lifecycle.policy TASK 格式）留后续阶段 | skill | closed | deferred（revisit: Phase 4 planning checkpoint；开始 lifecycle.policy TASK Plan 格式集成时必须重新取回 K5，并建立 successor Plan ID） | ADR-0021 § 后续修正 |

## Closure reconciliation（本计划结束时的目标状态）

```text
Total known:  5
Resolved:     1  (K4)
Deferred:     1  (K5)
Promoted:     3  (K1→finding, K2→adr, K3→research)
Unaccounted:  0  ← 必须为零
```

## 受影响文件

- `docs/design-decisions/ADR-0021-known-issue-closure.md` —— Accepted 执行语义
- `docs/research/RESEARCH-0008-repair-discovery-workset-model.md` —— 运行模型
- `docs/findings/FINDING-0022-recursive-discovery-workset-gap.md` —— 缺口证据
- `docs/plans/PLAN-0033-known-issue-closure.md` —— 本计划（+ 演示 ledger）
- `docs/design-decisions/README.md`、`docs/research/README.md`、`docs/findings/README.md` —— 登记

## 验证方法

1. `npm test` 全绿。
2. ledger 表在任务结束时完成 closure reconciliation（unaccounted = 0）。
3. 演示：执行过程中新发现的问题（若有）先追加到 ledger，再处理。

## 完成条件

- ADR-0021 / RESEARCH-0008 / FINDING-0022 建立并互引。
- 本计划 ledger 完成 closure reconciliation，unaccounted = 0。
- 未来 TASK 计划的「Discovery Ledger」惯例已记录（ADR-0021 § 决策 4）；payload 内嵌留后续计划。

## 参考

- 执行语义：ADR-0021
- 运行模型：RESEARCH-0008
- 缺口证据：FINDING-0022
- 纵向修复控制（现状）：lifecycle.policy § 根因修复协议与失败预算
