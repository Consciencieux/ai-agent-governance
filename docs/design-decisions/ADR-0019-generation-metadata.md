---
id: ADR-0019
status: Accepted
generation: cross-generation
---

# ADR-0019：知识对象代际元数据（generation）

- 状态：Accepted
- 日期：2026-09-09

## 背景

Generation-1 → Generation-2 重构期间出现一个关键问题：`docs/plans/archive/` 里的 30 份归档 Plan 记录的是 **1.0 及以前「当时准备怎么做、最后做成了什么」**，是历史执行记录，**不应移回 `docs/plans/` 重新变成 active plan**——那会破坏它们的语义。

但它们又不能「丢进 archive 不再看」：**这 30 份 archived Plans 构成了目前最完整的 Generation-1 功能演进记录**。它们记录了「为什么加入这个机制、当时解决什么问题、涉及什么文件、哪些边界条件、哪些同步点、哪些功能最终交付」——这些是测试不一定覆盖的设计意图证据。测试数量（如 `332/332`）只证明已覆盖的断言，不证明所有设计意图都被覆盖。

最危险的 2.0 迁移风险不是「删掉 archived Plan」，而是：

```text
重构代码
↓
旧机制消失
↓
没人意识到这个机制原来保护什么
↓
2.0 少了一个能力
```

同时，仅靠 `status` 无法回答一个反复出现的问题：「这个知识对象现在还有效吗？」。`Accepted` 可能是「当前有效」，也可能是「仅对 Generation 1 有效」；`archived` 只表示「计划完成了」，不表示「这个能力现在仍存在」。ADR 体系的这种歧义需要一个独立维度来消解。

## 决策

**1. 用元数据标记代际，不用目录，不改身份。**

- **不建** `docs/plans/archive/v1/`、`docs/design-decisions/v1/` 等两套目录；
- **不**加 `GEN1-` / `GEN2-` 文件前缀；
- **不**重新编号。

代际是知识对象的一个**独立维度**，是路径和身份之外的属性。把代际变成路径或身份的一部分，一旦出现 Gen2.1、Gen3、跨代对象，就要再次重构目录与编号。

**2. `generation` 与生命周期 `status` 是两个正交维度，不合并。**

```text
status      → 这个对象现在是什么生命周期状态？（设计/Active/archived/Superseded/Resolved…）
generation  → 这个对象属于哪个架构时代？（gen1 / gen2 / cross-generation）
```

不要写成 `status: gen1-old` 之类的混合值。

**3. 按知识对象类型采用各自的字段，不硬塞同一个字段：**

| 类型 | 字段 | 取值 |
| --- | --- | --- |
| Plan | `generation` | `gen1` / `gen2` |
| ADR | `generation` | `gen1` / `gen2` / `cross-generation` |
| Finding | `observed_in` / `resolved_in` | 架构时代（一个 Finding 可能在 Gen1 发现、Gen2 仍未解决，所以用观察/解决两个时间点，不用单值 `generation`） |
| Research | `subject_generation` | 该研究描述的架构时代 |

**4. 三个概念必须彻底分开：**

```text
Plan archived    ≠   Feature deprecated    ≠   Control obsolete
```

- **Plan archived** = 这个具体任务做完了，执行过程冻结为历史记录（生命周期事件）；
- **Feature deprecated** = 这个功能不再建议使用（产品事件）；
- **Control obsolete** = 这个治理控制不再保护任何东西（架构事件）。

归档只回答「任务是否完成」，不回答「能力现在是否仍存在」。`docs/plans/archive/` 保持不动，但角色重新定义为**历史执行证据与 capability provenance**：

> Archived Plans are immutable historical execution records and may be used as provenance when reconstructing previous-generation capabilities. Archiving does not mean the capability is obsolete.

**5. 建立 Generation-1 能力基线（capability baseline）。**

新增 `docs/research/RESEARCH-0006-generation-1-capability-baseline.md`：从 30 份 archived Plans、当前代码与测试提炼**能力保存矩阵**（不复制 Plan 全文），每行含「1.0 能力 / 历史来源 / 当前实现载体 / 2.0 处置」。

处置枚举（不允许简单「保留/删除」二分）：

```text
Preserve
Preserve behavior, replace mechanism
Redesign
Intentionally remove
Superseded
Unknown / requires investigation
```

处置链：

```text
Archived Plan
      ↓
Generation-1 Capability Baseline
      ↓
2.0 disposition
      ↓
new implementation / intentional removal
      ↓
regression evidence
```

2.0 重构时每一个 1.0 能力都必须得到明确处置；处置不确定的显式标 `Unknown / requires investigation`，不允许空白。

**6. 迁移计划自身的代际标记。** 迁移工作计划不引入 `migration-gen1-to-gen2` 这种新枚举；用 `generation: gen2` 表达（该计划本身属于 Generation 2），迁移来源（如「从 Generation-1 的 repo/skill 混杂迁移」）在正文背景说明，**不单独设字段**。`migration_from` 字段是可选元数据，仅当未来需要机械查询「哪些 Gen2 计划是迁移计划」时才加，默认不加以保持元数据克制。

## 后果

- **30 个归档 Plan** 已统一补 `generation: gen1`（frontmatter `id` 之后），路径与编号不变。
- **18 个 ADR** 已逐条分类为 `gen1`（2：ADR-0003、0005）/ `gen2`（5：ADR-0014–0018）/ `cross-generation`（11）。
- **RESEARCH-0006** 已建立，作为 1.0 → 2.0 capability audit 的 baseline evidence 清单。
- **`docs/plans/README.md`** 已写入 provenance 定义、三分离原则与 `generation` 规则。
- 未来做 capability audit、ADR supersession、research comparison 时，可以按 `generation` 机械筛选知识对象。
- 遗留风险：ADR 分类（`gen1`/`gen2`/`cross-generation`）是人工判断；代际标记目前无机械门禁（与 ADR-0013 的 finding 分类同一性质，符合 engineering restraint）。跨代能力在 2.0 各 Phase 推进时，由 RESEARCH-0006 的处置值回填跟踪。

## 参考

- 知识对象五分类与 findings 永久库：ADR-0013
- 知识对象 ID 编号规则：ADR-0018 § 决策 3
- Generation-1 能力基线矩阵：`docs/research/RESEARCH-0006-generation-1-capability-baseline.md`
- 归档计划作为溯源证据的定义：`docs/plans/README.md` § 归档计划 = 历史执行证据与能力溯源
- Producer/product 耦合（capability audit 的动机之一）：FINDING-0001
