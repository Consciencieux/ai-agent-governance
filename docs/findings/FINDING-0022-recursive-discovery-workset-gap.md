---
id: FINDING-0022
status: Confirmed
type: control-gap
observed_in: gen2
---

# FINDING-0022：修复过程中已发现问题可能因递归发现丢失（缺持久工作集）

## 分类

- 严重度：中
- 影响范围：repo、skill
- 研究方向：G. 证据 / 研究方法论

## 观察

修复任务中，问题集合随修复过程不断增长（修 B1 时发现 N1、N2、N3），但已发现问题**没有持久载体**——它们只存在于对话上下文与 Agent/开发者记忆中。当注意力转移（focus drift）后，最初已知的 B4/B5 与后来发现的 N3 可能被遗忘，任务在「已知问题集合未完全处置」的情况下被宣告完成。

这正是 recursive discovery / focus drift 失效模式：**Discovery → conversation context → memory 被当作 issue database**。当前协议有「修复尝试的深度」控制（repairSessionId / failure budget / 同类实例 / 双域检查，lifecycle.policy § 根因修复协议），但**没有「问题集合的宽度」控制**——没有 task-level known issue set、discovery admission、disposition、closure reconciliation。

## 证据

- `references/policies/lifecycle.policy.md` § 根因修复协议：只要求单次修复的尝试记录（repairSessionId、失败预算、修复不变量、回归测试），**没有**任务级「已知问题集合」字段或「零未处置」完成闸门。
- 典型失效轨迹（可复现模式）：初始 workset B1..B5 → 修 B1 发现 N1 → 转修 N1 → … → 结束时报 B4/B5/N3 状态未知。本仓库历史多次出现「修一个实例不查同类实例」（PLAN-0029/PLAN-0015 的前身）即同族问题：问题集合的完整追踪无 carrier。
- 与 FINDING-0008（治理测量缺口）、FINDING-0015（静态 prompt 注意力负担）同根：都依赖人/Agent 记忆而非系统保存状态。

## 根因

R4（Enforcement Boundary）：任务的**完成边界**不要求「每个已知问题都有显式处置」——没有 closure gate，已知问题可以「无处置地消失」。

## 影响

- 任务可能被宣告完成但已知问题集合未闭合（unaccounted > 0）。
- 已发现问题丢失后，回归保护无法覆盖，问题在后续任务中重新出现（repeat discovery）。
- 与 Zero-Attention 目标冲突：保证仍依赖注意力与记忆。

## 关闭条件

1. 任务级已知问题有持久 workset 载体（第一代：TASK Plan 内 append-only `## Discovery Ledger`）。
2. discovery admission 规则：发现 → 先登记，登记 → 不得删除。
3. 完成闸门：每个 in-scope 条目有显式 terminal disposition；unaccounted = 0。
4. **非 resolved 的 terminal disposition 必须携带后继**（`successor` 指针或 revisit 触发条件）——否则 `deferred` / `promoted-to-next-plan` 而无后继，仍会在未来丢失（ADR-0021 § 后续修正）。

## 解决情况

（未解决，remediation underway。）ADR-0021（Known-Issue Closure 执行语义，含后继指针/显式 revisit 触发条件要求）与 PLAN-0033（第一代 Discovery Ledger 实现）已建立；正式纳入 TASK Plan 格式与 lifecycle.policy 留待后续阶段。现存实例（PLAN-0032 R24 / PLAN-0033 K5 的 `deferred` / `promoted-to-next-plan`）已标注明确的 Phase 4 planning checkpoint 取回触发条件。

## 关联

- PLAN-0033
- ADR-0021
- RESEARCH-0008

## 回归保护

- 描述层：`docs/research/RESEARCH-0008-repair-discovery-workset-model.md`
- 规范层：ADR-0021（discovery 必须持久捕获；完成要求 zero unaccounted）
- 实现层：PLAN-0033（append-only Discovery Ledger 演示 + 未来 TASK 计划内嵌）
