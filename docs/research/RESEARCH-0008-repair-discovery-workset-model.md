---
id: RESEARCH-0008
status: Active
version: 2
subject_generation: gen1
---

# RESEARCH-0008：修复 / 发现 / 工作集运行模型（Workset）

本 RESEARCH 是 **System Model**：描述「修复一个系统问题」的运行模型——已有协议控制什么、缺少什么、问题集合如何随修复过程增长、目标架构的形态。它回答「repair / discovery / workset 这个系统现在是怎么工作的、缺口在哪、可测量的维度是什么」。

它是**描述层**，不规定「必须怎么做」。规范决策（discovery 必须持久捕获、完成要求 zero unaccounted 等 Accepted 语义）在 ADR-0021；第一代实现载体（append-only Discovery Ledger）在 PLAN-0033。已观察到的缺口由 `docs/findings/` 记录（FINDING-0022）。

## 现状：两个正交维度

```text
Vertical repair control   一个问题向下修到底
                          = repairSession / failure budget
                          = 已有（lifecycle.policy § 根因修复协议）


Horizontal issue closure  多个问题横向不丢失
                          = persistent workset / issue ledger
                          = 缺失
```

现有「根因修复协议 + `repairSessionId` + failure budget」解决的是：**一个 bug 修了三次还没修好，怎么避免不断堆补丁**（修复尝试、失败原因、同类实例、双域检查）。它控制「修复尝试的深度」。

缺失的是另一个维度：**同时发现多个 bug，修复过程中问题集合不断增长，如何保证任何一个已发现问题都不会因为注意力转移而消失**。它控制「问题集合的宽度」。

> **当前协议控制了「修复尝试的深度」，但没有控制「问题集合的宽度」**（FINDING-0022）。

## 失效机制：递归发现 / 注意力漂移（recursive discovery / focus drift）

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

## 目标架构（描述其形态；规范语义在 ADR-0021）

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

核心形态：**发现一个问题，不等于立即切换去修它；发现一个问题首先意味着把它加入一个不会丢失的持久 workset**。其三条不变量（once discovered → represented until disposition；new discovery ≠ priority switch；completion requires zero unaccounted）是 Accepted 语义，规定于 ADR-0021。

## 三层分类（哪些问题进哪一层）

```text
Task Workset           普通执行期发现 → task-local issue ledger（当前任务内）
Finding                值得长期保存的系统性问题 → docs/findings/
GitHub Issue           需要跨任务/跨时间协作追踪 → GitHub
```

普通修复过程中新发现的局部 bug **不**都建 Finding（否则 `docs/findings/` 退化成 bug tracker）；只有值得长期保存的系统性问题才提升为 Finding。

## 可测量维度

```text
Unaccounted discovered items = 0        ← 任务级成熟度指标（取代 bugs fixed = N）
Known = resolved + deferred + blocked + duplicate + promoted + not-applicable
```

这与 Zero-Attention 思路一致：即使开发者和 Agent 都忘了聊天上下文，只要 workset 还在，问题不会消失——**系统保存已知问题集合，Agent 只处理当前 item**。

## 第一代载体（实现，见 PLAN-0033）

不设计重型 Issue Registry。第一代 = 当前 TASK Plan 内的一张 **append-only membership** 表（条目不能删除；status / disposition 字段允许更新）：

```text
## 发现台账（Discovery Ledger）

| 标识（ID） | 来源 | 问题 | 范围 | 状态 | 处置 | 证据 |
```

规则语义、disposition 枚举与「prototype ≠ 机制已落地」的边界由 ADR-0021 与 PLAN-0033 规定，本模型不重复。

## 维护规则

- 本模型是活文档：随机制演进更新现状、失效机制与可测量维度。
- 只描述系统（规范进 ADR-0021，实现进 PLAN-0033，缺口进 FINDING-0022）。
