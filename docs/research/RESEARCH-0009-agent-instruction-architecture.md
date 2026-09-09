---
id: RESEARCH-0009
status: Active
version: 2
---

# RESEARCH-0009：Agent 指令架构

本 RESEARCH 是 **System Model**：描述「Agent 指令如何组织、加载与执行」的当前拓扑、注意力负担的产生机制、当前加载模型、当前失效模式、目标拓扑的形态与可评价维度。它回答「Agent instruction architecture 现在是怎么工作的、为什么会产生注意力负担、目标形态长什么样」。

它是**描述层**，不规定「必须怎么做」。规范决策（薄入口、路由必须明确、机械优先等九条）在 ADR-0022。已观察到的失效由 `docs/findings/` 记录（FINDING-0015 静态 prompt 注意力负担）。

## 当前指令拓扑（Generation-1）

```text
入口文档（SKILL.md / AGENTS.md / README）
    ↓ 同时承载
子技能 / 领域 policy·workflow
知识对象（Research / Finding / ADR / Plan / Roadmap）
历史对象（CHANGELOG / Archived Plan / Superseded ADR）
```

入口文档承担了较多职责，知识型与执行型内容并存于同一加载面；子技能按领域划分，但路由仍以「Agent 读入口文档并记忆」为主。

## 注意力负担的产生机制

Generation 1 的主要问题不是缺少规则，而是**大量不同职责的指令长期聚集在入口层或同时进入 Agent 上下文**。随规则、工作流、治理机制增长，Agent 需要在一次任务中阅读、判断和记忆越来越多并非全部适用的内容，导致：

```text
attention burden     单次上下文内无关指令比例上升
applicability ambiguity   哪条规则适用不确定
execution omission  适用规则被漏读/漏执行
```

关键保证因此仍可能依赖「Agent 是否读到、记住并正确选择了某条 Markdown」（FINDING-0015）。

## 当前加载模型

```text
Task
  ↓
Agent 读入口文档（SKILL / AGENTS）
  ↓
Agent 自行判断适用规则并记忆
  ↓
执行
```

信息不是按需加载，而是「入口层先全量进入上下文，再由 Agent 自行筛选」。

## 当前失效模式

- **入口过厚**：大量无关指令同时进入上下文 → attention dilution。
- **无路由的文件拆分（潜在次生风险）**：将领域拆成多个文件、但拆分后仍由 Agent 自行搜索和判断应读取哪些文件、缺少显式 task → capability routing → 负担从「记住大量规则」转变为「寻找正确规则」。

文件拆分本身是解决方案的一部分，不是问题来源；真正的问题是**无路由的文件拆分**。

## 目标拓扑（描述其形态；规范在 ADR-0022）

```text
Task Context
    ↓
Explicit Routing / Applicability
    ↓
Relevant Skill / Workflow / Policy
    ↓
Progressive Loading
    ↓
Execution
```

入口层只承担少量 always-on invariants 与路由职责；详细执行规则按任务加载；知识与历史对象按需查询；对关键保证减少对 Agent 注意力的依赖，逐步迁移到机械 control：

```text
现在:      Task → routing table → skill
未来:      Task Context → Context Detector → Applicable Controls → Dispatcher → Mechanism
```

九条原则（薄入口 / 专能力 / 渐进披露 / 按需加载 / 知识≠常驻执行 / 历史后置 / 路由明确 / 机械优先 / 总原则）是 Accepted 规范，规定于 ADR-0022。

## 可评价维度

```text
单次任务进入执行上下文的相关指令比例
applicability 判定是否由系统路由而非 Agent 记忆
关键保证是否依赖「Agent 记得读某条 Markdown」
执行遗漏 / 误读规则的发生率
```

## 与零注意力的关系

指令架构的目标与零注意力方向一致（FINDING-0015、FINDING-0022、ADR-0021），演进方向对应 Roadmap Phase 5（Context Detector + Dispatcher）。

## 维护规则

- 本模型是活文档：随指令架构落地（入口瘦身、子技能拆分、机械 control）更新当前拓扑与失效模式。
- 只描述系统（规范进 ADR-0022，失效进 Finding）。
