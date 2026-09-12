---
id: ADR-0025
status: Accepted
generation: gen2
---

# ADR-0025：2.x 产品演进路径

## 背景

ADR-0018 把 Generation 2 **迁移**固定为 Phase 0–8。该顺序在 `v2.0.0` 已经走完：Migration Mode 退出、必装切片在干净目标可用、CI 阻断权威 = `npm run check:must-ship`。ADR-0024 的发布门槛已满足。

发布之后仍有两类未完成工作叠在一起，但 **没有第二份顺序权威**：

1. **文档系统谎言面**：路线图 / `AGENTS.md` / 退出提案仍把「2.0 skill-release」写成当前动作；九份 Phase 4–8 Implemented 计划仍留在 `docs/plans/`（ADR-0016：闭包后应归档）。
2. **ADR-0024 `later` 扁平清单**：CONTROL-X、独立 Control 文件、PLAN-0037、全量 oracle、L3、5c leftover 等被写成「不挡 2.0」，但 2.0 之后谁先谁后未裁决。

若把 `later` 直接抄进 Roadmap 当施工顺序，会再次让路线图裁决阶段（ADR-0015 禁止）。若在 ADR-0018 上继续编 Phase 9…，会把已关闭的迁移剧本重新打开。

PLAN-0037 的解冻 Gate 3（Mode 退出 + 2.0 产品已发布）现已满足；解冻仍须人类 Active，本 ADR 不得自动解冻。

## 决策

**1. ADR-0018 Phase 0–8 是已关闭的迁移路径，不是 2.x 施工剧本。** 禁止新增 Phase 9 / 重开 Phase 5。2.0 产品线在 `main` 上按 SemVer 演进（`2.x.y`）。新一代（若出现）另开 ADR，不把 L3 或跨项目包偷偷叫成 2.0 补丁。

**2. 2.x 顺序权威 = 本 ADR 的 Horizon H0–H3。** Roadmap 只索引，不改顺序。每个 Horizon 经 Active Plan 执行（延续 ADR-0018 决策 7）。Agent 不「按 later 清单扫荡」。

```text
H0  文档与生命周期对账     本仓当前真相与 v2.0.0 对齐
  ↓
H1  可复用治理 Skill 提炼  PLAN-0037 Stage A–D（须人类解冻 Active）
  ↓
H2  控制面补完             ADR-0024 later 中的机械债（按下方子序）
  ↓
H3  运行时与科研           L3 / 测量 / 注意力实验；不挡 H2
```

H0 与 H1 不可对调：过时入口会把后续施工指回已删除的迁移分支。H1 与 H2 默认可部分并行，但 **写入 INSTALLED 的 portable 语义以 H1 提取协议为准**——H2 不得把本仓目录名 / CTRL 号 / Phase 剧本写进技能默认面（ADR-0020 过滤边界仍有效）。H3 不作为 2.1 发布门槛。

**3. H0（近前）交付面。** 只做 repo-infra 对账，不改 skill 行为：

- 三语 Roadmap / `AGENTS.md` / 产品 architecture 注释：当前产品 = `v2.0.0`；CI 阻断 = `check:must-ship`
- Phase 4–8 Implemented 计划按 ADR-0016 归档（PLAN-0035 / 0036 / 0038–0044）；**PLAN-0037 禁止归档**（H0 当时仍 Design；现已 Active，见决策 4 后续修正）
- 2.0 发布清单与 Mode 退出提案标为历史已完成，不再当「下一步」
- 不把 Gen1 `npm run check` 全绿设为 2.x 门槛

施工计划：[PLAN-0045](../plans/archive/PLAN-0045-post-2.0-doc-truth.md)（**Archived**）。

**4. H1（近）= PLAN-0037，不是另起通用包 ADR。** Gate 3 已满足。解冻后仍走提取协议（Facts → Rationale → Patterns → L1/L2/L3），禁止一次抽象出 skill。2.x 的**产品主线**是可复用治理原则 skill，不是把本仓实验目录复制到用户项目。

> **后续修正（2026-09-12）：人类已解冻 PLAN-0037。** 决策 4 原文「保持 Design 直至人类 Active」由本修正 supersede 为现在时：`status: Active`（人类指令「归档，解冻」）。Gate / 提取协议 / 禁止一次抽象 / 禁止 Archived 直至 Stage D **不变**。

**5. H2（中）子序：先收残留，再补机器面，再考虑 INSTALLED 调度。** 不重开 Phase 编号。子带可在同一 Horizon 内用 subordinate plan 拆分，但不得跳过 H2a 就把 leftover 拓扑写进 Control 文件。

| 子带 | 收什么 | 不得做什么 |
| --- | --- | --- |
| H2a 残留抽出 | 5c leftover Capability 叶（只改 `AuthorityRef`）；FINDING-0029 lifecycle 残留 / `state.json` phase→facet；FINDING-0028 dogfood / `retire` 隔离 | 重开 Phase 5；按 Gen1 目录骨架细切 |
| H2b 检查器与台账 | 剩余 consistency clusters · principles-index #9 · FINDING-0011 / 0019 / 0021；Discovery Ledger L2；FINDING-0022 / 0024；ADR-0016 parser 迁移 | 把 Gen1 全量 `npm run check` 改成 CI 阻断 |
| H2c 跨 profile / 机器 Control | CONTROL-X（FINDING-0001）；独立 machine-readable Control 文件（FINDING-0002 / 0025）；FINDING-0026 指令源 vs 模板 | 在 H1 提取完成前把本仓 CTRL 号写成 portable invariant |
| H2d 载荷调度与可移植性 | FINDING-0003 判断型 MUST 载体；0004 / 0005 若进 INSTALLED 须 Narrow ADR；0007 adapter 矩阵；0010 GitLab 模板；0012 锁；Git consent 机械 evaluator；MIGRATE 独立入口；0014 L0–L4 工具（repo-keep）；0016 / 0017 | 把 opt-in githooks 或 L3 当作 2.1 必装 |

**6. H3（远）不挡 2.1。** L3 运行时拦截、FINDING-0008 测量框架、FINDING-0015 静态 vs 注入实验、完整 `activity.jsonl`、零注意力评价。这些是科研与 runtime adapter，不进入 portable core（ADR-0020 / ADR-0024）。

**7. Confirmed Finding 仍不是一人一个 Horizon**（延续 ADR-0024 决策 10）。关闭条件在各 Finding；Horizon 只绑定「哪一类债在哪一段处理」。`later` 清单的**成员**仍以 ADR-0024 决策 6 为产品处置权威；本 ADR 只裁决**顺序**。

**8. 2.x 发布门槛 ≠ 关闭全部 Confirmed Finding。** `2.0.1` / `2.1.0` 各自用 Active Plan 写验收面。默认：不把 H3、不把 CONTROL-X、不把 PLAN-0037 全文当作每一次 2.x tag 的前置。PLAN-0037 Implemented 之后如何进 SemVer，另开 Plan / 必要时 Narrow ADR，不在本决策预锁 3.0。

## 后果

- Roadmap「当前阶段」= **H1 Active（PLAN-0037）**；H0 已 Archived。
- ADR-0018 继续约束历史 Phase 0–8 与 ID 编号规则；2.x 顺序提问指向本 ADR。
- PLAN-0037 已由人类解冻 Active（2026-09-12）；本 ADR 仍不是自动解冻机制。
- `retire` / `out`（治理评分、`ai-skill-manager`）仍不进入 2.x 施工。

## 参考

- ADR-0015 路线图不得裁决阶段顺序 · ADR-0016 Plan 归档 · ADR-0018 迁移路径 · ADR-0020 提炼边界 · ADR-0024 产品冻结与 `later` 成员
- PLAN-0037 提炼 · PLAN-0045 H0
- FINDING-0001..0008 / 0010..0017 / 0019 / 0021 / 0022 / 0024..0029（Confirmed 输入，不是本 ADR 关闭）
