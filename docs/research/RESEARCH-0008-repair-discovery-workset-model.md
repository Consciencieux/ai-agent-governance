---
id: RESEARCH-0008
title: 修复 / 发现 / Workset 运行模型（Repair / Discovery / Workset Model）
status: Active
version: 1
created: 2026-09-09
updated: 2026-09-09
supersedes: []
superseded_by: []
subject_generation: gen1
---

# 修复 / 发现 / Workset 运行模型（Repair / Discovery / Workset Model）

本 RESEARCH 是 **System Model**：描述当前「修复一个系统问题」的运行模型——已有协议控制什么、缺少什么、问题集合如何随修复过程增长、理想架构应该怎样。它回答「repair / discovery / workset 这个系统现在是怎么工作的、缺口在哪」。

它是**描述层**；「必须遵守的规范决策」（Known-Issue Closure 执行语义）是**规范层**，归 ADR-0021；已观察到的缺口由 `docs/findings/` 记录（FINDING-0022）。

## 两个正交维度

```text
Vertical repair control   一个问题向下修到底
                          = repairSession / failure budget
                          = 已有（lifecycle.policy § 根因修复协议）


Horizontal issue closure  多个问题横向不丢失
                          = persistent workset / issue ledger
                          = 缺失 ← 本模型描述的目标
```

现有「根因修复协议 + `repairSessionId` + failure budget」解决的是：**一个 bug 修了三次还没修好，怎么避免不断堆补丁**（修复尝试、失败原因、同类实例、双域检查）。它控制「修复尝试的深度」。

缺失的是另一个维度：**同时发现多个 bug，修复过程中问题集合不断增长，如何保证任何一个已发现问题都不会因为注意力转移而消失**。它控制「问题集合的宽度」。

> **当前协议控制了「修复尝试的深度」，但没有控制「问题集合的宽度」。**

## 失效模式：recursive discovery / focus drift

```text
初始发现：B1 B2 B3 B4 B5
开始修 B1 → 发现 N1 → 转去修 N1 → 发现 N2 N3 → 转去修 N2 → …

最后：B1 ✓ B2 ✓ B3 ✓ N1 ✓
      B4 ???  ← 被上下文淹没
      B5 ???  ← 被忘
      N3 ???  ← 甚至没人记得
```

根本问题不是 Agent 智商，也不只是开发者注意力，而是：

```text
Discovery → Conversation context → Human / Agent memory
```

被错误地当成了 issue database。

## 正确架构

```text
Discovery
    ↓
Persistent Workset
    ↓
Triage / Disposition
    ↓
Execution
    ↓
Evidence
    ↓
Closure
```

核心原则：

> **发现一个问题，不等于立即切换去修它；发现一个问题首先意味着把它加入一个不会丢失的持久 workset。**

## 三个不变量

1. **Once discovered → must remain represented → until explicit disposition.** 已发现的问题不能从上下文里消失。
2. **New discovery ≠ automatic priority switch.** 修 B2 时发现 D1，正确动作是 capture → classify → decide（fix-now / defer / blocked / duplicate / not-applicable），而不是忘记 B2/B3/B4/B5 开始新的兔子洞。
3. **Task completion requires every in-scope discovered item has an explicit terminal disposition.** 不是要求全部修完；允许 resolved / deferred / duplicate / not-applicable / blocked / promoted-to-finding / promoted-to-next-plan，但绝不允许 forgotten。

## 完成闸门（closure reconciliation）

```text
Initial workset:       5
Newly discovered:      3
-------------------------
Total known:           8

Resolved:              4
Deferred explicitly:   2
Promoted to Finding:   1
Blocked:               1
Unaccounted:           0   ← 必须为零
```

成熟度指标 = **Unaccounted discovered items = 0**，而不是 bugs fixed = 5。这与 Zero-Attention 思路一致：即使开发者和 Agent 都忘了聊天上下文，只要 workset 还在，问题不会消失——**不再要求他们记，系统负责保存已知问题集合，Agent 只负责处理当前 item**。

## 三层分类（哪些问题进哪一层）

```text
Task Workset           普通执行期发现 → task-local issue ledger（当前任务内）
Finding                值得长期保存的系统性问题 → docs/findings/
GitHub Issue           需要跨任务/跨时间协作追踪 → GitHub
```

普通修复过程中新发现的局部 bug **不**都建 Finding（否则 `docs/findings/` 退化成 bug tracker）；只有值得长期保存的系统性问题才提升为 Finding。

## 第一代载体

不设计重型 Issue Registry。第一代 = 当前 TASK Plan 内的一张 append-only 表：

```text
## Discovery Ledger

| ID | Origin | Problem | Scope | Status | Disposition | Evidence |
```

规则只有：

```text
发现 → 先登记
登记 → 不得删除
修复 → 更新状态
新问题 → 不自动抢占当前任务
结束 → 所有条目必须有 disposition
```

以后 Phase 3/5 再决定是否升级为 machine-readable task state。

## 维护规则

- 本模型是活文档：随机制演进更新失效模式、载体与不变量。
- 只描述系统（规范进 ADR-0021，缺口进 FINDING-0022）。
