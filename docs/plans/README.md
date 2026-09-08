# Plans 目录（执行计划）

本目录是本仓库的 **执行计划库**：保存当前正在执行的具体任务设计。它回答「**准备怎么做**」，与 `findings/`（实际发现了什么）、`research/`（如何理解这个系统）、`design-decisions/`（为什么做这个架构决定）严格分工。

## 目录结构

```text
docs/plans/
├── README.md                  # 本页：目录内三类内容的管理规则
├── roadmap/                   # 长期路线图（三语），持续维护，不按普通 Plan 归档
├── PLAN-xxxx-<slug>.md        # 当前执行计划
└── archive/
    └── PLAN-xxxx-<slug>.md    # 已完成/已归档计划
```

## 三类内容的定义与边界

| 内容 | 位置 | 回答的问题 | 生命周期 |
| --- | --- | --- | --- |
| 当前执行计划 | `docs/plans/PLAN-xxxx-*.md` | 这个具体任务准备怎么做？ | Active → Archive |
| 路线图 | `docs/plans/roadmap/{en,zh-CN,zh-TW}.md` | 项目长期往哪里走？ | 持续修订，不归档 |
| 归档计划 | `docs/plans/archive/PLAN-xxxx-*.md` | 这个任务最终做成了什么？ | 冻结历史 |

- **`PLAN-xxxx-<slug>.md`**：当前执行中的计划，状态为 design plan / Active / implemented（等归档）。
- **`roadmap/`**：长期架构演进视图（Vision / Current State / Known Limitations / Target Architecture / Migration Phases / Research Goals / Non-goals），三语边界对象。它的修订触发是架构事件，**不按普通 Plan 走 active → archive**。
- **`archive/`**：已完成计划的最终归属。Plan 完成后从 `docs/plans/` 移入 `docs/plans/archive/`，此移动发生在 release 归档点。

## 归档计划 = 历史执行证据与能力溯源

> **Archived Plans are immutable historical execution records and may be used as provenance when reconstructing previous-generation capabilities. Archiving does not mean the capability is obsolete.**

三个概念必须彻底分开：

```text
Plan archived    ≠   Feature deprecated    ≠   Control obsolete
```

- **Plan archived** = 这个具体任务做完了，其执行过程冻结为历史记录（生命周期事件）。
- **Feature deprecated** = 这个功能不再建议使用（产品事件）。
- **Control obsolete** = 这个治理控制不再保护任何东西（架构事件）。

一个 Plan 归档，只回答「任务是否完成」，不回答「这个能力现在是否仍然存在、是否仍然有效」。归档计划记录了「为什么加入这个机制、当时解决什么问题、涉及哪些文件、边界条件、同步点、最终交付了什么」——它是最完整的 Generation-1 功能演进记录，也是 1.0 → 2.0 capability audit 的证据来源。

每个知识对象用 `generation` 元数据标记所属架构时代（`gen1` / `gen2` / `cross-generation`），不通过目录、文件前缀或重新编号来表达代际。当前 30 个归档 Plan 均标记 `generation: gen1`。跨代能力的处置矩阵见 `docs/research/RESEARCH-0006-generation-1-capability-baseline.md`。

## 规则

1. **Plan ID 永久不变、不复用**：`PLAN-xxxx` 独立编号，新对象 = 该类型现有 max(编号)+1（统一规则见 ADR-0018 § 决策 3）。编号一旦分配即绑定该对象，撤销/作废不释放编号。
2. **文件名 = `<ID>-<ascii-slug>.md`**：`PLAN-xxxx-<slug>.md`（英文 ASCII slug，正文用简体中文 canonical）。
3. **归档即冻结**：`archive/` 中的 Plan 不再作为 active plan 修改，除非修正文档性错误；其内容作为历史证据与能力溯源保留。
4. **只归档 Plan**：Finding / Research / ADR **不进入本目录**——它们不因状态变化（Resolved / Superseded）而物理归档，永久留在 `docs/findings/`、`docs/research/`、`docs/design-decisions/` 原位。
5. **不要在 `roadmap/` 与 `archive/` 之间互相移动**：roadmap 是持续维护的方向文档，不是任务；只有 `PLAN-xxxx` 对象才走 active → archive。
6. **每个 Plan 声明 `generation`**：`gen1`（Generation-1 历史执行记录）/ `gen2`（Generation-2 计划）/ 迁移计划可用 `gen2` + `migration_from: gen1`。归档不等于能力过时。
