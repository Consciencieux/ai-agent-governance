---
id: ADR-0021
status: Accepted
generation: gen2
---

# ADR-0021：已知问题闭包


## 背景

现有「根因修复协议 + `repairSessionId` + failure budget」（lifecycle.policy § 根因修复协议）解决的是**纵向**问题：一个 bug 修三次还没修好，怎么避免不断堆补丁。它控制「修复尝试的深度」。

但存在另一个正交维度**横向**问题：同时发现多个 bug，修复过程中问题集合不断增长，如何保证任何一个已发现问题都不会因注意力转移而消失（recursive discovery / focus drift）。当前协议控制深度但不控制宽度——已发现问题只存在于对话上下文与记忆中，任务可能在「已知问题集合未闭合」时被宣告完成（FINDING-0022）。

本 ADR 将 Known-Issue Closure（发现 → 持久 workset → 处置 → 零未结算）固化为**Accepted execution semantics**。系统运行模型（描述层）见 `docs/research/RESEARCH-0008-repair-discovery-workset-model.md`。

## 决策

**1. Discovery must be persistently captured.**

```text
Once discovered → must remain represented → until explicit disposition
```

发现一个问题，不等于立即切换去修它；发现一个问题**首先**意味着把它加入一个不会丢失的持久 workset。已发现问题不得从上下文消失。

**2. New discovery ≠ automatic priority switch.**

修 A 时发现 B，正确动作是：

```text
capture B
→ classify severity / relation
→ decide disposition（fix-now / defer / blocked / duplicate / not-applicable / promoted…）
```

而不是：发现 B → 忘记 A → 开始新的兔子洞。

**3. Task completion requires zero unaccounted discovered items.**

完成不要求所有问题都修完，但要求每个 in-scope discovered item 有**显式 terminal disposition**：

```text
resolved（含 fixed-now） / deferred / duplicate / not-applicable / blocked
/ promoted-to-finding / promoted-to-adr / promoted-to-research / promoted-to-next-plan
```

完成时做 closure reconciliation，**Unaccounted discovered items = 0** 是任务级成熟度指标（取代「bugs fixed = N」）。

**4. 第一代载体：TASK Plan 内 append-only `## Discovery Ledger` 表。**

不设计重型 Issue Registry。第一代 = 当前任务 Plan 内一张表（**append-only membership**：条目一经登记不得删除；`Status` / `Disposition` 字段允许更新）：

```text
| 标识（ID） | 来源 | 问题 | 范围 | 状态 | 处置 | 证据 |
```

规则：发现→先登记；登记→不得删除（membership append-only）；处置→更新 Status/Disposition 字段；新问题→不自动抢占当前任务；结束→所有条目必须有 terminal disposition 且 Status=closed。

**5. 分层：普通执行期发现 → task workset；系统性 → Finding；跨任务协作 → GitHub Issue。** 普通修复中新发现的局部 bug 不建 Finding（`docs/findings/` 不退化回 bug tracker）。

**6. 本 ADR 是 Gen2 执行语义（`generation: gen2`）。** Migration Mode（ADR-0014）冻结 Gen1 规则演进；PLAN-0033 是对该语义的 **first-generation prototype / characterization**（演示载体可行），不宣称 Gen1 lifecycle 已被改变；正式纳入 TASK Plan 格式与 machine-readable task state 留待后续阶段。

## 后续修正（2026-09-09）：终结处置的跟踪与后继约束

本修正是对「决策 3」的 **Narrow amendment**。原有关于 terminal disposition 枚举与 `Unaccounted discovered items = 0` 的文字保留为历史；自本修正起，以下约束补充并 supersede 原 clause 中未覆盖的部分：

1. **Status 与 Disposition 是两个轴。** `Status` 是条目的跟踪状态（`open` 仍被跟踪 / `closed` 已由 disposition 终结）；`Disposition` 是 terminal outcome（决策 3 的枚举）。条目一旦获得 terminal disposition，`Status` 必须标为 `closed`；`open` 表示尚未处置。`fixed-now` 是 `resolved` 的口语别名，不单独成为枚举值。
2. **非 `resolved` 的 terminal disposition 必须携带后继。** `deferred` / `blocked` / `promoted-to-finding` / `promoted-to-adr` / `promoted-to-research` / `promoted-to-next-plan` 意味着工作并未在本任务内完成，必须附一个**后继指针**（`successor`：新 Finding / ADR / Research / Plan 的 ID）或显式 **revisit 触发条件**（何时会被重新取回）。否则 `unaccounted = 0` 仍可能掩盖「deferred 但没有后继」的未来工作丢失。`duplicate` / `not-applicable` 不需要后继，因为它们表示该条目本身已经终结。

## 后续修正（2026-09-10）：Payload L1 契约与存储边界

本修正是对决策 4 / 6 的 **Narrow amendment**：授权 PLAN-0036 将 Discovery Ledger 写入 INSTALLED `lifecycle.policy` TASK 契约，并澄清条目家与列扩展。上方「第一代载体」表头仍有效；L1 在不改变 append-only / 两轴模型的前提下扩展列。

1. **条目家 = Active TASK 计划内的台账表（execution state + provenance）。** 不是 `.governance/state.json`、不是 `docs/findings/`、不是独立 `docs/state/`、不是机器 registry。state.json 继续只承载锁 / blocked 等运行态。
2. **L1 列（INSTALLED）：** `标识 | 类型 | 来源 | 问题 | 影响面 | 严重度 | 状态 | 处置 | 责任人 | 验证/证据`。类型枚举：`bug` / `missing_capability` / `drift` / `migration_gap` / `observation`。来源枚举：`task` / `review` / `test` / `audit`。处置枚举仍以决策 3 + 本文件 2026-09-09 修正为准。
3. **不是每个发现都建 Plan。** `promoted-to-next-plan` / `promoted-to-finding` 仅用于真正跨任务或系统性事项；默认在本任务台账内闭包。
4. **L1 不实现自动发现 / 自动分类 / dashboard / fail-closed JS 门禁。** 契约可达性由 characterization + INIT 复制证明；机械化升级另案。

## 后果

- 已发现问题有持久载体，不再依赖人/Agent 记忆（与 Zero-Attention 一致：系统保存已知问题集合，Agent 只处理当前 item）。
- 任务完成判定从「修了几个」变为「已知问题是否零未处置」。
- 第一代在 repo-infra 演示（PLAN-0033）；**payload L1 契约**由 PLAN-0036 写入 `references/policies/lifecycle.policy.md` § 发现台账（Discovery Ledger）（INIT → `docs/rules/lifecycle.md`）。
- FINDING-0022 保持 `status: Confirmed` 直至有 fail-closed 机制或等价强制面；L1 契约落地 ≠ Finding 自动闭合。

## 参考

- 运行模型（描述层）：`docs/research/RESEARCH-0008-repair-discovery-workset-model.md`
- 缺口证据：FINDING-0022（`docs/findings/FINDING-0022-recursive-discovery-workset-gap.md`）
- 第一代 prototype：PLAN-0033
- 纵向修复控制（现状）：lifecycle.policy § 根因修复协议与失败预算
