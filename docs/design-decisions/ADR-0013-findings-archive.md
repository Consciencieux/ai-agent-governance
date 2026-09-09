---
id: ADR-0013
status: Accepted
generation: cross-generation
---

# ADR-0013：Issue / Finding Archive 与知识对象五分类


## 背景

ADR-0012 定义了 CHANGELOG / ADR / 计划 / 验证证据四类载体的职责边界。但仓库存在两类信息既不属于这四类、也没有稳定归宿：

- **研究观察与失败模式**：sibling closure 无机械 enforcement、GitLab 多栈 CI 模板生成缺陷、ADR status false positive、repo/skill 双域漂移、checker vacuous pass。这些是「发现了什么、证据、根因」，不是「改了什么」（CHANGELOG）、不是「为什么这样设计」（ADR）、也不是「单次任务实施」（计划）。修完关闭 GitHub Issue 后，它们沉到历史里，不可版本控制，误删不可恢复。
- **review 产出中的架构性结论**：review-manager 对「发现具体缺陷」有效，对「判断项目为什么持续产生这些缺陷、架构是否在错误方向上越来越精密」能力不足（FINDING-0014）。review 发现的问题需要先分类——局部 defect 还是系统性 finding——再决定 remediation 层级。

GitHub Issue 提供 open/closed 生命周期与协作，但不提供：Git history、blame、diff、branch、tag、release provenance。对一个以治理为研究对象的仓库，这类「为什么」是科研资产，应该可版本控制、可随代码演进。

## 决策

**1. 新增第五类载体 `docs/findings/`，与 GitHub Issue 单向关联而非镜像。**

| 内容性质 | 载体 | 判据 |
| --- | --- | --- |
| 变更事实：改了什么、影响谁、如何迁移 | CHANGELOG | 读者问"这个版本对我有什么影响" |
| 长期架构决策：为什么这样设计、边界在哪、如何演化 | ADR | 决策会被反复重新讨论，需要冻结 |
| 单次任务的实施过程：根因、方案比较、验收标准 | 计划（未完成）/ 归档计划（已完成） | 与某个具体任务绑定，任务结束后是历史 |
| 研究观察、失败模式、证据、根因：发现了什么 | **Finding（`docs/findings/`）** | 是知识而非协作对象，修复后仍是 evidence record |
| 验证过程：变异结果、门禁输出、测试计数 | 测试自身、审计记录、Issue、提交信息 | 证明某次断言成立，不是产品事实 |
| 无长期价值的解释 | 直接删除 | 迁移它只是换个地方积累噪声 |

**2. repo 内 Finding 是 canonical research record；GitHub Issue 是 collaboration projection。** 两者不是双向镜像：Issue 可以有大量讨论，`docs/findings/` 只保存稳定信息（观察、证据、根因、解决、回归保护）。全文同步会制造 Declaration ↔ Projection drift，正是本项目一直要消除的缺陷。

**3. Finding 生命周期用状态表达，不移动路径。** 状态枚举为 `Proposed / Confirmed / Resolved / Superseded / Invalidated`（不用 Open/Closed——Issue 问「要不要做」，Finding 问「事实是否存在」，Closed 会产生知识消失的语义），在文件内更新；**不建立 `docs/plans/archive/findings/`**。Resolved finding ≠ archived finding——修复后它仍要回答「怎么复现、根因、哪个 regression 保护、关联哪个 ADR/Plan/Issue」。这与 Plan 的 `active → archive` 生命周期本质不同。状态机与 severity/type 分类的完整条文在 `docs/findings/README.md`。

**4. 语言政策：historical/research evidence 使用单一 canonical language（简体中文）。** 与 ADR-0005 的三语拆分不冲突——三语服务于 active operational knowledge；findings 从创建开始就是简体中文单语，不进入三语树，不参与 parity/freshness。避免重新制造 translation sync / parity / freshness / review 成本。

**5. review 产出先分类，再决定 remediation。** Full/System Audit 默认 `review is read-only until findings are classified`：Find → Collect evidence → Classify abstraction level（L0 defect / L1 mechanism gap / L2 control gap / L3 architecture gap / L4 research finding）→ Search sibling/systemic instances → Determine root cause → THEN decide remediation（patch → regression 或 findings/ → ADR/Plan）。这避免边审边修的 confirmation bias，也避免 incident-driven checker accretion。

**6. 具体 schema、taxonomy、生命周期、frontmatter 条文不在本 ADR 重复。** 权威在 `docs/findings/README.md`。本 ADR 只记录"为什么要建"和"第五类载体怎么定位"；把 schema 复制进来会制造第二事实源，同 ADR-0012 第 3 条的理由。

## 后果

- 正面：研究观察、失败模式、治理缺口有了可版本控制、可追踪的归宿；review 的架构性结论可以提升为 Finding → ADR/Plan，而不只是修完关闭；`affected: [repo, skill]` 字段为 cross-profile closure 提供第一代机制。
- 代价：review 写一次问题可能要多动一个文件（GitHub Issue + findings/）。这是刻意的——分类本身决定 remediation 层级。
- 遗留风险：finding 分类（L0–L4、direction、root_cause）是人工判断，无机械门禁（首版纯结构，不加 gate，符合 engineering restraint）。与 ADR-0012 的「分流判断是人工的」同一性质。

## 后续注记（2026-09-09）

本 ADR 的「知识对象五分类」（Finding / ADR / Plan / Archive + 决策载体）部分被 ADR-0016 § 后续补充的**七类模型**（Product / Research / Finding / ADR / Roadmap / Plan / Glossary）局部 supersede——「五分类」这一 clause 仅作历史保留；本 ADR 的 `cross-generation` 依据是其核心语义（Finding 长期 evidence record、状态就地演进、review 先分类再修复）明确延续到 Gen2。Generation 模型暂不支持 clause 级拆分，本条作为注记保留。

## 参考

- Finding schema / taxonomy / 生命周期：`docs/findings/README.md`
- 四类载体职责边界：ADR-0012
- review 层级错位：FINDING-0014（`docs/findings/FINDING-0014-review-manager-layer-mismatch.md`）
- 索引与事实源的边界：ADR-0009
