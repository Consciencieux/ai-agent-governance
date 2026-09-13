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
| H2a 残留抽出 | 5c leftover Capability 叶（只改 `AuthorityRef`）；FINDING-0029 lifecycle 残留 / `state.json` phase→facet；FINDING-0028 dogfood；**消费** script-inventory（今日 `retire = ∅`，禁止第三份能力去向表） | 重开 Phase 5；按 Gen1 目录骨架细切；H1 期间预标 `retire` 或整夹隔离 |
| H2b 检查器与台账 | 剩余 consistency clusters · principles-index #9 · FINDING-0011 / 0019 / 0021；Discovery Ledger L2；FINDING-0022 / 0024；ADR-0016 parser 迁移 | 把 Gen1 全量 `npm run check` 改成 CI 阻断 |
| H2c 跨 profile / 机器 Control | CONTROL-X（FINDING-0001）；独立 machine-readable Control 文件（FINDING-0002 / 0025）；FINDING-0026 指令源 vs 模板 | 在 H1 提取完成前把本仓 CTRL 号写成 portable invariant |
| H2d 载荷调度与可移植性 | FINDING-0003 判断型 MUST 载体；0004 / 0005 若进 INSTALLED 须 Narrow ADR；0007 adapter 矩阵；0010 GitLab 模板；0012 锁；Git consent 机械 evaluator；MIGRATE 独立入口；0014 L0–L4 工具（repo-keep）；0016 / 0017 | 把 opt-in githooks 或 L3 当作 2.1 必装 |

**6. H3（远）不挡 2.1。** L3 运行时拦截、FINDING-0008 测量框架、FINDING-0015 静态 vs 注入实验、完整 `activity.jsonl`、零注意力评价。这些是科研与 runtime adapter，不进入 portable core（ADR-0020 / ADR-0024）。

**7. Confirmed Finding 仍不是一人一个 Horizon**（延续 ADR-0024 决策 10）。关闭条件在各 Finding；Horizon 只绑定「哪一类债在哪一段处理」。`later` 清单的**成员**仍以 ADR-0024 决策 6 为产品处置权威；本 ADR 只裁决**顺序**。

**8. 2.x 发布门槛 ≠ 关闭全部 Confirmed Finding。** `2.0.1` / `2.1.0` 各自用 Active Plan 写验收面。默认：不把 H3、不把 CONTROL-X、不把 PLAN-0037 全文当作每一次 2.x tag 的前置。PLAN-0037 Implemented 之后如何进 SemVer，另开 Plan / 必要时 Narrow ADR，不在本决策预锁 3.0。

## 后续修正（2026-09-13）：H1 施工纪律与脚本去向

本修正不改决策 1–8 的 Horizon 顺序，也不改 ADR-0024 `later` 成员。补的是 **H1 期间允许 / 禁止什么**，以及脚本机械面如何消费已有台账（避免第三份顺序或去向权威）。触发：对「先清 1.0 脚本 / 用 v2.1–v2.3 当施工阶段」的建议做了对账。

**9. H1 只提炼，不迁载体。** PLAN-0037 Active 期间允许 Stage A–D，并**消费**已有台账（ADR-0024 `later`、PLAN-0035 disposition、[`script-inventory.v0.json`](../../repo-tools/script-inventory.v0.json)、RESEARCH-0011）。禁止：

- 清理、删除或整夹隔离 `scripts/` / `repo-tools/`
- 给 `check-doc-consistency.js` 加规则、例外或 flag（FINDING-0019；属 H2b）
- 把本仓 Task→Capability router 写入 INSTALLED 默认面（属 H2d，且须 H1 提取完成）
- 把本仓 `AGENTS.md` / `SKILL.md` 瘦身当作 PLAN-0037 的完成条件（薄入口是提炼产物的 L1，不是本仓入口改写任务）
- 新建「Gen1 能力 → 2.x 去向」权威表（FINDING-0024）。文件台账 / INSTALLED scripts characterization 的 Unaccounted=0 **不**等于能力终局已定；FINDING-0028 仍 Confirmed

2.0 必装已以 WRAP 发出。再拆这些 WRAP 属于 H2，不是 H1 门槛，也不是「must-ship 再迁移一轮」。

**10. 脚本三类（消费 inventory，不另建 ledger）。** 分类键是 inventory 的 `disposition` / `generation` / `distribution_role`，不是一份新 Markdown 表。

| 类 | 判据（已有字段） | H1 | 以后 |
| --- | --- | --- | --- |
| 已进 CTRL 链的 WRAP | `wrap` 且已有 evaluator（secret / freshness / translation freshness / broken links） | 保持 WRAP，不删旧 CLI | H2 继续 EXTRACT 后薄化；旧厚逻辑在替代→验证→观察之后才可退役 |
| 仍有价值、未拆 | `keep` 的 `gen1_carrier`（含 consistency 剩余 cluster、audit helper、metadata/sync） | 保留；不堆 patch | H2b 按 cluster EXTRACT |
| 无 2.x 价值 | 仅当 `disposition: retire` | **今日为空**，不得预标 | H2a 才允许标 `retire`，再停用引用并隔离/删除 |

`generate-governance.js` / validator 是产品入口，**不是**已完成的 control-plane vertical；H1 不为它们新分配 CTRL。routing 是 REPO-ONLY 施工器；H1 不装进目标项目。删除永远是最后一步：替代 → 验证 → 观察期 → 删除。

**11. SemVer 不是 Horizon 的别名。** 禁止把 H1/H2/H3 说成 v2.1/v2.2/v2.3 并当作发布门槛（与决策 8 同向；版本号不得成为第二份阶段表）。PLAN-0037 Implemented 之后是否打 `2.1.0`，另开 Plan。H3 不挡下一次 minor。Git consent 机械 evaluator、锁、MIGRATE 入口留在 **H2d**，不升格为 H3。

**12. 双产品保持。** 本仓 = 实验场 + 参考实现；`v2.0.0` = 可安装必装切片；PLAN-0037 = 可复用原则包。H1 完成不把三者合成单一产品。

**13. 新 CTRL 与新文档。** 新 CTRL 仅在 EXTRACT 独立机械能力时分配（PLAN-0035）。H1 不为 later 项新写知识对象当施工日记。H2c 的 Control registry 是本仓机器面；portable skill 只抽 identity · semantic owner · evaluator · binding · evidence 的形状，不抽 `CTRL-NNNN`。

```text
H1    PLAN-0037；消费已有台账；不删脚本；不装 router
  ↓
H2a   leftover 叶 + 仅当 inventory 出现 retire
H2b   consistency 按 cluster EXTRACT
H2c   本仓 Control 机读化（非 portable 编号）
H2d   判断型 MUST / 锁 / consent evaluator / 安装面 routing
  ↓
H3    测量 / 注意力 / L3 runtime（不挡下一次 minor）
```

## 后续修正（2026-09-13）：H2 执行顺序（台账校准 + 指令面前置）

本修正不改决策 1–8 的 Horizon，不改决策 5 的 H2a–d **成员**，也不改 ADR-0024 `later`。补的是 **H2 开工怎么排**（审计：机械面已薄路由，指令面仍厚平面；台账现在时脏则后续判断全脏）。触发：对「H2-0 → 0046 → a→b→c→d」建议的对账。

**14. H2 执行序。** 决策 5 的子带仍是 a→b→c→d。其前增加两档，**不是**新 Horizon：

```text
H2-0   台账校准     RESEARCH-0004/0005/0006/0009 现在时 + roadmap 状态词
                    不新增权威、不重开基线、不预标 retire
  ↓（可与下一档并行）
H2-front 指令面     PLAN-0046（薄入口 + must-ship 叶卡 schema）
                    Design 直至人类 Active；产出叶 schema，避免 H2a leftover 二次改写
  ↓
H2a → H2b → H2c → H2d   （决策 5；不可倒置）
```

H2-0 与 H2-front **可并行**。**H2a→b→c 不可倒**：b 消费 a 的残留结果；c 不得把未收 leftover 拓扑写进 Control 文件（决策 5 原禁令仍在）。H2-front **不是** H2d：安装面 router / Narrow ADR 进 INSTALLED 仍在 H2d。

**15. H2 开工纪律。**

- 唯一阻断权威 = `npm run check:must-ship`；Gen1 `npm run check` 保持观测，直到 H2b 完成 parser 迁移
- 不预标 `retire`、不批量删脚本；删除只在 H2a 之后（决策 10）
- 不建第三份能力去向表；台账 = ADR-0024 处置 + RESEARCH-0006 投影 + `script-inventory.v0.json`
- 每步一个 Active Plan；Plan archive ≠ Release；SemVer ≠ Horizon
- PLAN-0046 不自动 Active；FINDING-0004 / 0005 等进 INSTALLED 须 Narrow ADR（H2d 之前）

## 后果

- Roadmap「当前阶段」= **H2**（H2-front [PLAN-0046](../plans/archive/PLAN-0046-instruction-surface-2.0-alignment.md) **Archived** 2026-09-13；H2a = [PLAN-0047](../plans/archive/PLAN-0047-h2a-residue-extraction.md) **Archived**；H2b = [PLAN-0048](../plans/archive/PLAN-0048-h2b-checkers-and-ledgers.md) **Archived**；**H2c** = [PLAN-0049](../plans/PLAN-0049-h2c-machine-controls.md) **Active**）。H0 / H1 已 Archived。
- ADR-0018 继续约束历史 Phase 0–8 与 ID 编号规则；2.x 顺序提问指向本 ADR。
- PLAN-0037 已 Archived（2026-09-13 Stage D）；PLAN-0046 已 Archived（2026-09-13 Stage 3/4 + Y6）；PLAN-0047 已 Archived（2026-09-13 Stage 0–4）；PLAN-0048 已 Archived（2026-09-13 Stage 0–4；H2b）。**Active** = PLAN-0049（H2c）。
- `retire` / `out`（治理评分、`ai-skill-manager`）仍不进入 2.x 施工；脚本面今日 `retire = ∅`。
- H2-front 期间对 `scripts/` 的默认动作仍是 **不动载体**；去向问题问 inventory，不问新表。

## 参考

- ADR-0015 路线图不得裁决阶段顺序 · ADR-0016 Plan 归档 · ADR-0018 迁移路径 · ADR-0020 提炼边界 · ADR-0024 产品冻结与 `later` 成员
- PLAN-0037 提炼（Archived）· PLAN-0045 H0 · PLAN-0046 H2-front · PLAN-0035 checker disposition · PLAN-0041 script inventory
- FINDING-0001..0008 / 0010..0017 / 0019 / 0021 / 0022 / 0024..0029（Confirmed 输入，不是本 ADR 关闭）
