# 研究知识库

本目录保存对 **ai-agent-governance 系统本身**的科学描述：系统模型、机制分类、评价框架、架构演进、实验记录、方法论。它回答「**我们正在研究什么系统？如何理解它？如何评价它？**」，与以下知识类别严格区分：

| 类型 | 用途 | 示例 |
| --- | --- | --- |
| 研究（`research/`） | 描述和研究系统 | 当前 gate 模型、治理机制分类 |
| 发现（`findings/`） | 记录发现的问题 | trigger coverage 缺失 |
| 架构决策（`design-decisions/`） | 记录已接受决策 | 引入 Rule Registry |
| 计划（`plans/`） | 描述执行方案 | 实现 Rule Registry MVP |
| 归档计划（`plans/archive/`） | 保存完成计划 | 已完成迁移计划 |

## 为什么单独一类

常见讨论经常混淆三个层次。例如：

> 「当前 gate 靠文本匹配，所以应该改成 Rule Registry。」

实际包含三种知识：

```text
Research：当前 gate 主要是文本/结构检查。          ← 中性描述
Finding：  文本检查无法覆盖 semantic invariant。    ← 问题判断
ADR：      采用 Rule Registry 作为下一代模型。      ← 决策
Plan：     实现 registry schema。                  ← 工作设计
```

过去这些混在 issue / plan / AGENTS / 讨论里导致重复与歧义。本目录把「对系统的科学描述」独立出来，作为 2.0 重构的 baseline 与科研实验的事实源。

## 知识链条

```text
research
    ↓ provides model
finding
    ↓ identifies gap
ADR
    ↓ chooses direction
plan
    ↓ executes change
```

**Research 不自己包含大量 bug 列表**——Known limitations 用引用 findings 而非复述；**不提前把研究结论写成 ADR**（分析可能性是 research，做出选择才是 ADR）。

## 语言规则

**简体中文 canonical 单语**，与 `findings/` 一致。属于长期知识 / 方法论记录 / 项目内部研究资产，不是用户产品文档。不进入 `docs/product/en/` / `docs/product/zh-CN/` / `docs/product/zh-TW/`，不要求 translation parity / freshness check / 三语同步。代码、命令、错误日志、专有术语保持原文。

## 文件命名规则

英文 ASCII 文件名（Git 兼容、URL 稳定、工具处理简单）：

```text
docs/research/
├── README.md                        # 本页
├── RESEARCH-0001-system-model.md                  # 当前治理系统控制模型
├── RESEARCH-0002-governance-mechanism-taxonomy.md # 治理机制分类
├── RESEARCH-0003-evaluation-framework.md          # 评价体系
├── RESEARCH-0004-architecture-evolution.md        # 架构演进（Generation 0→3）
├── RESEARCH-0005-current-capabilities.md          # 当前能力清单（Generation-1 baseline）
├── RESEARCH-0006-generation-1-capability-baseline.md # 第一代能力保存矩阵（2.0 迁移基线证据）
├── RESEARCH-0007-documentation-knowledge-architecture.md # 文档知识架构/知识对象模型（System Model：七类知识对象、路由、当前/历史隔离、Agent 导航、机械 carrier）
├── RESEARCH-0008-repair-discovery-workset-model.md # 修复/发现/Workset 运行模型（System Model：vertical vs horizontal、recursive discovery、closure gate）
├── RESEARCH-0009-agent-instruction-architecture.md # Agent 指令架构（System Model：薄入口、分层加载、路由、机械优先、当前/目标模型）
└── experiments/                     # 实验记录
```

不要：`系统模型.md`。

## 研究文档类型

| 类型 | 文件 | 内容 |
| --- | --- | --- |
| A. 系统模型（System Model） | `RESEARCH-0001-system-model.md` | 当前架构、数据流、执行流程、组件关系 |
| B. 机制分类（Mechanism Taxonomy） | `RESEARCH-0002-governance-mechanism-taxonomy.md` | Existence / Text / Structure / Consistency / Behavior / LLM Review / Human Review / Runtime |
| C. 评价框架（Evaluation Framework） | `RESEARCH-0003-evaluation-framework.md` | Trigger / Detection / Blocking / Negative Oracle / FP / FN / Runtime / Token / Human Cost |
| D. 架构演进（Architecture Evolution） | `RESEARCH-0004-architecture-evolution.md` | Generation 0→3 演进 |
| E. 当前能力（Current Capabilities） | `RESEARCH-0005-current-capabilities.md` | 当前能力清单（Generation-1 baseline） |
| F. 实验记录（Experiments） | `experiments/` | **只放实际实验记录**（做了什么、数据、结果）；不是普通分析文章——分析归 `RESEARCH-xxxx` |
| G. 能力基线（Capability Baseline） | `RESEARCH-0006-generation-1-capability-baseline.md` | 30 份归档计划提炼的能力保存矩阵 + 2.0 处置（迁移 baseline evidence） |
| H. 规划/知识控制模型（Planning / Knowledge Control Model） | `RESEARCH-0007-documentation-knowledge-architecture.md` | System Model：知识对象（七类）唯一主问题、Allowed/Forbidden、路由测试、当前/历史隔离、Agent 导航、机械 carrier |
| I. 修复/发现/Workset 模型（Repair / Discovery / Workset Model） | `RESEARCH-0008-repair-discovery-workset-model.md` | System Model：纵向修复控制 vs 横向问题闭包；recursive discovery / focus drift；closure gate |
| J. Agent 指令架构（Agent Instruction Architecture） | `RESEARCH-0009-agent-instruction-architecture.md` | System Model：薄入口/专能力/按需加载/职责单一/历史后置/路由明确/机械优先；当前与目标加载模型 |

**统一 envelope（表示法归一，ADR-0016）**：Frontmatter 元数据 = `id` / `status` / `version`（+按需 `subject_generation` / `supersedes` / `superseded_by`）；`status` 取值 `Draft` / `Active` / `Superseded` / `Archived`；不保留 `title` / `created` / `updated`（H1 / Git 已有）与空 `supersedes: []`；H1 = `# RESEARCH-xxxx：中文标题`。

## 编号规则
`RESEARCH-xxxx` 独立编号，新对象 = 该类型现有 max(编号)+1，**永久不复用、不重排**（统一规则见 ADR-0018 § 决策 3）。

## Frontmatter 元数据格式（canonical / sparse；空 optional 一律省略）

```yaml
---
id: RESEARCH-0001
status: Active              # Draft / Active / Superseded / Archived
version: 1
subject_generation: gen1    # 该研究描述的架构时代；迁移型（跨代描述）省略
supersedes: [RESEARCH-0000] # 按需；无则省略
superseded_by: [RESEARCH-0007] # 按需；无则省略
---
```

**不保留**：`title`（H1 已有）、`created` / `updated`（Git 有 provenance）、空 `supersedes` / `superseded_by`。

**代际标记用 `subject_generation`**：表达「这项研究描述的是哪个架构时代」，不用于表达「研究文档自身属于哪代」——research 是跨代的研究资产，随版本演进留在原位。

## 生命周期（版本演进，非状态流转）

与 Finding 不同，Research 文档不是「状态变化」，而是「版本演进」：

```text
Draft      正在形成（假设、讨论、未稳定模型）
Active     当前认可的研究模型
Superseded 被新模型替代（不删除）
Archived   仅表示历史参考
```

**Research 不删除，只 supersede，也不物理归档。** `Superseded` / `Archived` 都只是版本演进标记，文件永久留在本目录原位——科研价值来自演进过程：

```text
Research-001
Version 1: System is prompt-driven
Status: Superseded
Superseded by: Research-007
```

这本身就是研究轨迹。第一版只保留 `Draft / Active / Superseded / Archived` 四个状态，**不建议**建过度复杂状态机（Hypothesis / Reviewed / Validated / Published / Deprecated / Retired 会让 research 本身变成治理对象）。

## 审阅规则（Review）

新增或修改 research 文档**不需要跑全部 gate**：

- **必须**：Markdown 格式、链接有效性（link validity）、元数据格式
- **不需要**：三语 parity、changelog、product docs freshness（它不是产品文档）

## 质量标准

好的 research 文档应回答：

- **研究对象（What）**：研究对象是什么？
- **研究动机（Why）**：为什么研究？（连接到 finding / 动机）
- **模型（Model）**：抽象模型是什么？
- **证据（Evidence）**：有什么证据？（实验、代码位置、测量数据）
- **影响（Implication）**：对未来设计有什么影响？

## 关联规则

- Research → findings：`Known limitations: See FINDING-0003`（引用，不复述）
- Research → ADR：research 分析可能性，ADR 做选择。不要提前把研究结论写成 ADR
- Research → plans：research 提供模型，plan 执行改变

## 一句规则

> **Research 保存「我们如何理解和研究这个系统」，使用简体中文单语；通过版本和 supersede 管理演进，不删除历史；它连接 findings、ADR 和 plans，但不替代其中任何一个。**
