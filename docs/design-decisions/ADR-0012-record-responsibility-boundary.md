---
id: ADR-0012
status: Accepted
generation: cross-generation
---

# ADR-0012：变更记录、计划、ADR 与测试证据的职责边界


## 背景

CHANGELOG 的内容边界规则（"记录变更、影响、迁移；不记录测试命令、门禁输出、验证叙事"）在 v0.15.0 落地，但落地后条目反而变长了：规则前平均 413 字符，规则后 690，最长条目达 2258。同期实际改动规模反而下降——早期平均每次发布改 1934 行代码写 1476 字记录，后期改 1121 行写 6166 字。

用改动规模做对照后，结论明确：这不是项目变复杂，是记录风格漂移。漂移的具体形状有两种：

- **根因与方案论证进了变更记录。** 后期条目普遍包含根因分析、被否决的替代方案、约束论证、防御性说明。这些内容有价值，但它们回答的是"为什么这么设计"，不是"变了什么"。
- **验证过程进了变更记录。** 变异验证、门禁比分、测试计数、退出码叙事。这些是验收证据，读者在读变更记录时不需要它们。

内容边界规则已经说了"不记录什么"，但没有说"那些内容该去哪"。没有去处的禁令等于要求删除有价值的内容——于是规则被绕过，内容留在原地。

## 决策

**1. 四类载体各有职责，内容按性质分流。**

| 内容性质 | 载体 | 判据 |
| --- | --- | --- |
| 变更事实：改了什么、影响谁、如何迁移 | CHANGELOG | 读者问"这个版本对我有什么影响" |
| 长期架构决策：为什么这样设计、边界在哪、如何演进 | ADR | 决策会被反复重新讨论，需要冻结 |
| 单次任务的实施过程：根因、方案比较、验收标准 | 计划（未完成）/ 归档计划（已完成） | 与某个具体任务绑定，任务结束后是历史 |
| 验证过程：变异结果、门禁输出、测试计数 | 测试自身、审计记录、Issue、提交信息 | 证明某次断言成立，不是产品事实 |
| 无长期价值的解释 | 直接删除 | 迁移它只是换个地方积累噪音 |

**2. CHANGELOG 条目通过指针保持链条完整，但不使用会失效的路径。**

条目可以指向计划或 ADR，形式为名称而非相对路径——计划在发布时会从 `plans/` 移到 `archive/`，写路径会在归档后变成死链。ADR 编号稳定，可以直接引用。

**3. 具体格式规则不在本 ADR 重复。**

CHANGELOG 的结构契约（版本节形状、分类标题唯一性、空行规则、分类名集合）与内容边界的完整条文，权威在 `references/policies/lifecycle.policy.md`。本 ADR 只记录"为什么要分流"和"分流到哪"；把格式规则复制进来会制造第二事实源，而这正是 ADR-0009 已经裁定过的问题。

**（Narrow amendment，2026-09-09：本决策部分被「后续补充」supersede——结构契约的权威仍为 lifecycle.policy（repo 与 governed project 共享格式语义）；repo 自身的 accession / `[Unreleased]` / released-section 执行政策改由 Repo Profile 拥有的 repo-domain 文档承担（AGENTS.md 为指针，详细政策按 ADR-0022 下沉到 repo-domain execution doc）；shared semantics ownership 的正式建模留 Phase 3。）**

**4. 历史记录逐步迁移，不批量重写。**

- 最新版本节与 `[Unreleased]`：适用完整边界，这也是机械门禁唯一覆盖的范围。
- 近期已发布版本：按内容边界抽查——明显含根因分析、方案争论、验证日志的单独处理，不设字符数硬阈值。
- 更早历史：只在存在明显错误或确有维护价值时迁移。大规模改写已发布记录制造 churn，而这些内容往往已在对应的归档计划里留有副本。

## 后续补充（2026-09-09）：CHANGELOG 在新知识系统中的定位

知识体系升级为七类知识对象（Product / Research / Finding / ADR / Roadmap / Plan / Glossary；Archive Plan 是 Plan 的生命周期状态，非独立类型，见 RESEARCH-0007）后，CHANGELOG 重新定界。本 ADR 原决策的核心判断仍然成立（CHANGELOG 记变更事实；ADR 记长期决策；Plan 记单次任务实施；验证证据在测试/审计），以下为边界细化：

**1. CHANGELOG 是「历史变更投影」，不是 `docs/` 知识类型之一。**

当前/历史分类以 `docs/README.md` §「当前 vs 历史（隔离）」为唯一说明；本 ADR 只规定 CHANGELOG 属于历史变更投影，不复制该分类清单。

唯一主问题：从上一个发布边界到这个发布边界，项目发生了哪些值得读者知道的实际变化？它不回答：为什么这么设计（ADR）、发现了什么问题（Finding）、系统现在怎么工作（Research）、准备怎么做（Plan）、测试跑了多少（Evidence）、未来准备做什么（Roadmap）。

**2. decision ≠ delivered change。** ADR Accepted、Finding 新增、Research 新增、Plan 创建本身不产生 CHANGELOG 条目。准入测试：

```text
Did observable project behavior / public interface / contributor workflow /
release behavior / or supported capability actually change?
YES → candidate；NO → normally no CHANGELOG entry
```

`ADR Accepted` 而仓库行为未变，通常不自动生成 CHANGELOG；合理顺序是 Finding → ADR → Plan → Implementation → verification → **CHANGELOG 记录 implemented change**。

**3. `[Unreleased]` 语义。** = 已实现、准备进入下一个正式 release 的 change projection；不是所有正在讨论的工作、所有 Accepted ADR、所有 Active Plan。Migration Mode 禁发布（ADR-0014）时，`[Unreleased]` 不应是每个 migration commit 的流水账，在 checkpoint / merge / release composition 时统一整理。

**4. Released section 默认不可重写。** 允许 factual correction / broken pointer correction / 明确授权的历史整理；不允许为匹配今天架构把过去写成「当时就是这样」（与 ADR「不改写历史」原则同源）。

**5. Repo CHANGELOG 政策由 Repo Profile 拥有。** 原决策把 CHANGELOG 格式与内容规则权威指向 INSTALLED `references/policies/lifecycle.policy.md`（Skill payload）。按 ADR-0020（shared semantics ≠ shared authority）：repo 与 governed project 可共享「CHANGELOG 记录已交付变更而非验证叙事」的语义，但 repo 自身 CHANGELOG 的执行政策（准入、[Unreleased]、released-section）由 Repo Profile 拥有，落点为 **repo-domain execution document**（`repo-workflows/changelog-policy.md`，REPO-ONLY）；`AGENTS.md` 只放路由指针（按 ADR-0022 薄入口）；payload `lifecycle.policy.md` 继续权威于 governed projects 的 CHANGELOG 格式契约（repo 作为共享格式语义的 consumer 遵循）。

## 后果

- 正面：禁令有了去处，遵守成本下降；变更记录回到可快速扫读的密度；根因与决策各归其位，需要时找得到。
- 代价：写一次变更可能要动两个文件（CHANGELOG + 计划/ADR）。这是刻意的——合并写在一处正是漂移的成因。
- 遗留风险：分流判断是人工的。机械门禁只能查关键词与结构，不能判断"这段根因该进 ADR 还是删掉"。判断型规则的执行缺口在此同样适用。

## 参考

- CHANGELOG 结构契约与内容边界条文：`references/policies/lifecycle.policy.md`
- 索引与事实源的边界：ADR-0009
- 入口层文档不作事实库：ADR-0010
