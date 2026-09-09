---
id: ADR-0009
status: Accepted
generation: cross-generation
---

# ADR-0009：索引与事实源的边界，以及两个域的不同强制等级


## 背景

本仓库有两类记录同一批工作的文档：

- `docs/{en,zh-CN,zh-TW}/plans/*.md`（TASK 设计计划）——完整设计、状态、验收标准、Affected Files
- `docs/{en,zh-CN,zh-TW}/roadmap.md`——horizon 分类清单

被治理项目有结构对应但不同的一对：

- `docs/plans/TASK_<name>.md`——完整设计
- `docs/plans/DEVELOPMENT_PLAN.md`——里程碑勾选清单

两处都存在"同一件事在两个文件出现"的形态，此前从未声明谁是权威。实际后果已经发生：`plan-delivery-anchors` 计划实现完成，roadmap 的 Done 清单从未出现它。当时的规则（"roadmap horizons 在每次发布时 re-baseline"）被如实执行，仍然漏掉——因为规则覆盖的是发布时刻，而计划生命周期事件（新建 / 实现 / 归档）发生在发布之间，没有任何机制在那个时刻检查。

同期还有两个同类事件作为对照：v0.13.1 发布时 CHANGELOG 版本节未推进（规则有、机械验证只覆盖"是否记录"而非"版本节是否推进"）；边界拆分后六个门禁脚本脱离编码卫生扫描（规则写在注释里、无机械验证）。三次都是"规则存在且被遵守，但没有机械验证覆盖那个具体判定"。

## 决策

**1. 索引不是事实源。** 设计计划是某项工作的设计、状态与验收标准的单一事实源；roadmap 与里程碑清单是**索引**：只表达分类与状态，链接到事实源，不复述其内容（验证方式、Affected Files、实施步骤）。索引条目复述计划细节即为重复权威。

**2. 同步时机是计划生命周期事件，不只是发布。** implemented / archived / 新建计划发生时，同一变更集内更新索引。发布时的 re-baseline 是兜底，不是唯一时机。

**3. 两个域的强制等级不同，且这是有意的：**

| 域 | 索引 | 规则载体 | 强制等级 |
| --- | --- | --- | --- |
| 本仓库 | `docs/*/roadmap.md` | `AGENTS.md` | **机械验证**：`repo-tools/check-roadmap-sync.js`，三条可判定关系，`--gate` fail-closed（进 `check` 组，每次验证都跑） |
| 被治理项目 | `docs/plans/DEVELOPMENT_PLAN.md` 里程碑 | `references/policies/lifecycle.policy.md` | **分级机械验证**：`scripts/check-plan-sync.js`，同样三条关系，但**默认建议性、仅 `--release-gate` 阻断**，且无该结构时 no-op |

分级的依据：被治理项目由 AI 维护时，「完成任务时同步里程碑」这条纯文档规则同样缺少失败反馈——AI 改了 `TASK_<name>.md` 忘记改 `DEVELOPMENT_PLAN.md`，与本仓库 roadmap 漏同步是同一失效形态，长期看大概率复现。但这不足以支持把每次提交都变成计划治理检查：

- **必须机械验证的事实**：文件存在、状态合法、版本一致、**发布前**计划与里程碑同步。
- **保留为文档约束的判断**：里程碑描述是否准确、任务是否真正完成、链接是否语义正确——这些不可机械判定，机械化只会制造假阳性。

因此目标项目侧的检查满足三个约束：结构兼容（无 `docs/plans/` 或无 `DEVELOPMENT_PLAN.md` 即 no-op，绝不把项目强行改造成本 skill 的目录形态）、时机受限（默认 advisory，只有 `--release-gate` 阻断，抓的是「发布时遗漏同步」这个真实风险）、范围最小（三条关系，不引入完整计划治理子系统）。

本仓库机械化的依据是实证：漏同步已经发生过，且三条关系可机械判定（implemented → 必须在 Done；archived → 不得被活跃 horizon 链接；活跃 horizon 提及某计划 → 必须链接该计划文件）。索引中不提及某计划是合法的，门禁不因此报错——它检查一致性，不发明条目。

被治理项目采用**较低强制等级**而非完全不验证：里程碑是单行状态标记，结构上不具备复述设计的空间，所以「索引复述事实源」这个严重形态在那一侧不存在；但「完成时同步」缺少失败反馈的问题是共通的，且在 AI 维护的项目中更容易发生。折中是：同样的三条关系、更轻的时机（发布/审计而非每次提交）、结构兼容的 no-op。

## 后果

- roadmap 每个未来条目要么链接其设计计划，要么显式标注"尚无设计计划"；Done 条目链接计划或归档。
- `check-roadmap-sync.js` 是 REPO-ONLY，被治理项目形态下报 not-applicable 并退出 0。

## 代际注记（2026-09-09）

本 ADR 是**混合型**：`generation: cross-generation` 指其**核心语义**「索引不是事实源」在两代都明确适用；但其中对 Gen1 具体 enforcement 的裁定（`check-roadmap-sync.js` / `check-plan-sync.js` 路径、Gen1 release gate、milestone 索引 vs 计划事实源的具体实现）属 **Gen1 implementation decision**，随 Phase 4 parser 迁移 / Gen2 control plane 落地会被替代。Generation 模型暂不支持 clause 级拆分，本条作为注记保留，不做整篇降级。（注：prompt-sync 触发词属于 ADR-0008，不在本 ADR 内。）
- 被治理项目的 lifecycle 政策增加约束（里程碑指向其 TASK 计划、里程碑只表达状态），可判定部分由 `scripts/check-plan-sync.js` 在发布时对账；语义判断仍属人工。
- 新检查独立成脚本，不并入 `check-doc-consistency.js`（该脚本职责已冻结）也不并入 `check-plan-delivery.js`（后者比对计划声明与交付物，输入与失败含义都不同）。
- 本 ADR 不记录"纯文档规则容易失效"这一泛化判断。那是风险经验，已由工程克制政策与证据层级分类（mechanical / human-attested / unverified claim）承载；把它写成架构决策会把一次风险判断固化成普遍定律，而本 ADR 的三条决策各自有具体证据支撑。
