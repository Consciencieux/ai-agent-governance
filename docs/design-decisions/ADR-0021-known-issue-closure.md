# ADR-0021: Known-Issue Closure（已知问题闭包）——discovery admission、disposition 与 closure reconciliation

- 状态：Accepted
- 日期：2026-09-09
- 代际：cross-generation

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
resolved / deferred / duplicate / not-applicable / blocked
/ promoted-to-finding / promoted-to-next-plan
```

完成时做 closure reconciliation，**Unaccounted discovered items = 0** 是任务级成熟度指标（取代「bugs fixed = N」）。

**4. 第一代载体：TASK Plan 内 append-only `## Discovery Ledger` 表。**

不设计重型 Issue Registry。第一代 = 当前任务 Plan 内一张表：

```text
| ID | Origin | Problem | Scope | Status | Disposition | Evidence |
```

规则：发现→先登记；登记→不得删除；修复→更新状态；新问题→不自动抢占当前任务；结束→所有条目必须有 disposition。正式纳入 TASK Plan 格式（lifecycle.policy Phase 2）与 machine-readable task state 留待后续 Phase（3/5）决定。

**5. 分层：普通执行期发现 → task workset；系统性 → Finding；跨任务协作 → GitHub Issue。** 普通修复中新发现的局部 bug 不建 Finding（`docs/findings/` 不退化回 bug tracker）。

## 后果

- 已发现问题有持久载体，不再依赖人/Agent 记忆（与 Zero-Attention 一致：系统保存已知问题集合，Agent 只处理当前 item）。
- 任务完成判定从「修了几个」变为「已知问题是否零未处置」。
- 第一代在 repo-infra 演示（PLAN-0033）；payload（lifecycle.policy TASK 格式）集成留后续阶段，不在本 ADR 授权一次性铺开。
- FINDING-0022 保持 `status: Confirmed`（remediation underway）；真正闭合需机制落地。

## 参考

- 运行模型（描述层）：`docs/research/RESEARCH-0008-repair-discovery-workset-model.md`
- 缺口证据：FINDING-0022（`docs/findings/FINDING-0022-recursive-discovery-workset-gap.md`）
- 第一代实现：PLAN-0033
- 纵向修复控制（现状）：lifecycle.policy § 根因修复协议与失败预算
