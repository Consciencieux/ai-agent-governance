# 执行计划目录

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

- **`PLAN-xxxx-<slug>.md`**：当前执行中的计划（`Design` / `Active` / `Implemented`；`Completed` 仅作闭包对账的短暂过渡）。
- **`roadmap/`**：长期架构演进视图（愿景 / 当前状态 / 已知限制 / 目标架构 / 迁移阶段 / 研究目标 / 非目标），三语边界对象。它的修订触发是架构事件，**不按普通 Plan 走 active → archive**。
- **`archive/`**：已完成 closure 的计划。exit review 通过后从 `docs/plans/` 移入此处并标 `Archived`——**触发是 Plan lifecycle closure，不是 Release**（ADR-0016）。

## 归档计划 = 历史执行证据与能力溯源

> **归档计划是不可变的历史执行记录（Archived Plans），可用于重建前一代能力的 provenance；归档不表示该能力已经过时，也不表示产品已正式发布。**

四个概念必须彻底分开：

```text
计划已归档（Plan archived）≠ 功能已弃用（Feature deprecated）≠ 控制已废弃（Control obsolete）≠ 产品已发布（Product released）
```

- **计划已归档（Plan archived）** = 这个具体任务做完了，其执行过程冻结为历史记录（生命周期事件）。
- **功能已弃用（Feature deprecated）** = 这个功能不再建议使用（产品事件）。
- **控制已废弃（Control obsolete）** = 这个治理控制不再保护任何东西（架构事件）。
- **产品已发布（Product released）** = 达到 release boundary（发布事件）。

一个 Plan 归档，只回答「任务是否完成」，不回答「这个能力现在是否仍然存在、是否仍然有效」，也**不以正式 Release 为前置条件**。Migration Mode 禁止 tag/Release，**不**禁止归档。

每个 Plan 用 `generation` 元数据标记所属架构时代（`gen1` / `gen2`，不通过目录、文件前缀或重新编号表达代际；Finding/Research/ADR 的代际字段见各自 README）。归档目录含 gen1 历史 Plan 与已闭包的 gen2 Plan；代际不因归档改变。跨代能力的处置矩阵见 `docs/research/RESEARCH-0006-generation-1-capability-baseline.md`。

## 规则

1. **Plan ID 永久不变、不复用**：`PLAN-xxxx` 独立编号，新对象 = 该类型现有 max(编号)+1（统一规则见 ADR-0018 § 决策 3）。编号一旦分配即绑定该对象，撤销/作废不释放编号。
2. **文件名 = `<ID>-<ascii-slug>.md`**：`PLAN-xxxx-<slug>.md`（英文 ASCII slug，正文用简体中文 canonical）。
3. **归档即冻结，且不等待 Release**：exit review / closure reconciliation 通过后即将 Plan 移入 `archive/` 并标 `Archived`（ADR-0016）。`Completed` 不得长期留在 `docs/plans/`。Gen1 release 流程若仍「到 release 才归档」，以本 README + ADR-0016 为权威；旧 checker 红为 compatibility divergence（Phase 4）。
4. **只归档 Plan**：Finding / Research / ADR **不进入本目录**——它们不因状态变化（Resolved / Superseded）而物理归档，永久留在 `docs/findings/`、`docs/research/`、`docs/design-decisions/` 原位。
5. **不要在 `roadmap/` 与 `archive/` 之间互相移动**：roadmap 是持续维护的方向文档，不是任务；只有 `PLAN-xxxx` 对象才走 active → archive。
6. **每个 Plan 声明 `generation`**：`gen1`（Generation-1 历史执行记录）/ `gen2`（Generation-2 计划）。迁移工作（如 2.0 迁移）用 `gen2`，迁移来源在正文背景说明；`migration_from` 是可选项，仅在需要机械查询迁移计划时加。归档不等于能力过时，也不等于产品发布。
7. **统一 envelope（表示法归一，ADR-0016）**：frontmatter = `id` / `status` / `generation`（+ 当前 Plan 的 `target`）；`status` 取值 `Design` / `Active` / `Implemented` / `Completed` / `Archived`（canonical 在 frontmatter，正文不再有 `> **Status:**`）；H1 = `# PLAN-xxxx：中文标题`；空 optional 字段省略。**历史归档 Plan 的 required fields = `id` / `status: Archived` / `generation`（不含 `target`）**——current Plan 与 historical Plan 的必填字段分开定义。
8. **不重新裁决长期架构**：Plan 的权威是当前施工与验收。ADR 约束只作摘要 + 指针。正文级边界见 ADR-0016 权威矩阵。
