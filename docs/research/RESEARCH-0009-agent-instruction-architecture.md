---
id: RESEARCH-0009
title: Agent 指令架构（Agent Instruction Architecture）
status: Active
version: 1
created: 2026-09-09
updated: 2026-09-09
supersedes: []
superseded_by: []
subject_generation: gen1
---

# Agent 指令架构（Agent Instruction Architecture）

本 RESEARCH 是 **System Model**：描述「Agent 指令如何组织、加载与执行」的运行模型——入口文档、子技能、知识对象、执行工作流如何分层，当前如何加载，目标架构是什么。它回答「Agent instruction architecture 现在是怎么工作的、应该按什么原则演进」。

它是**描述层**；「必须遵守的规范决策」是**规范层**，归 ADR-0022；已观察到的失效由 `docs/findings/` 记录（如 FINDING-0015 静态 prompt 注意力负担）。

## 总原则

> **Use thin execution entrypoints to route task context into specialized skills; load only applicable instructions progressively, keep knowledge and history on demand, and move critical guarantees out of Agent attention into mechanical enforcement.**

> **薄入口、专能力、按需加载、职责单一、历史后置、路由明确、机械优先。**

## 九条原则（目标架构）

**1. Thin Entrypoint（入口要薄）。** `AGENTS.md` / `SKILL.md` / README 这类入口文档只承担：身份与作用域、少量 always-on invariants、优先级与冲突规则、任务分类、子技能/工作流入口、必要的 fallback。它们**不是**完整知识库，**不是**完整政策仓库。

**2. Specialized Execution（能力分层）。** 具体任务进入具体能力：bug fix → repair workflow；release → release workflow；git write → git policy；review → review skill；documentation change → documentation knowledge policy。一个子技能只负责一个相对明确的执行领域。

**3. Progressive Disclosure（渐进披露）。** 信息按层次加载：

```text
L1 Entry      短：告诉 Agent 去哪里
L2 Execution  中：告诉 Agent 怎么做
L3 Reference  长：edge cases / rationale / examples / taxonomy
```

普通任务只加载 L1 + 相关 L2；复杂情况才进入 L3。

**4. Contextual Loading（上下文按需加载）。** 不让 Agent「把所有规则都读完」，而是：

```text
Task Context
→ Applicability Resolution
→ Required Skill / Policy
→ Load Relevant Instructions
→ Execute
```

只把当前任务真正需要的信息放进执行上下文。

**5. Single Responsibility（职责单一）。** 每个文档和子技能有清晰职责。一个文件若同时负责 Git / release / bug repair / docs taxonomy / testing / planning / review，就已经过载。

**6. Knowledge ≠ Always-on Execution（知识≠常驻执行）。** 知识型（Research / Finding / ADR，用于理解、决策、追溯）与执行型（Workflow / Policy / Skill，用于当前执行）分开。Research / Finding / ADR **不作为 always-on instruction**；只有当当前任务、Active Plan 或 routing 明确引用其约束时才按需加载（受当前 Active Plan 约束的 Accepted ADR 属明确引用）。不要为做一次 commit 默认加载全部 Research 和 ADR。

**7. History is On-demand（历史后置）。** Archived Plan / Superseded ADR / old Research / CHANGELOG 默认不进入执行上下文；需要 provenance 时再查。

**8. Routing Must Be Explicit（路由明确）。** 不能只是「拆成很多文件」。入口必须明确告诉 Agent：什么时候读哪个文件、多个规则同时适用时谁优先、判断不清时怎么办。否则文件拆开了，attention burden 只是从「记规则」变成「找规则」。

**9. Zero-Attention First（机械优先）。** 真正重要的控制不应依赖「Agent 是否记得读某条 Markdown」：

```text
现在:      Task → routing table → skill
未来:      Task Context → Context Detector → Applicable Controls → Dispatcher → Mechanism
```

越重要的规则，越应从 Markdown guidance 升级为机械 control。

## 当前状态（Generation-1）

入口文档（`SKILL.md` / `AGENTS.md` / README）承担了较多职责，知识对象（Research / Finding / ADR）与执行规则并存于同一加载面；子技能按领域划分但路由仍以「Agent 读入口文档并记忆」为主。`[Unreleased]`/CHANGELOG/archived plans 等历史对象存在被当作现行指令读取的风险（见 RESEARCH-0007 知识对象模型的当前/历史隔离）。

## 与零注意力的关系

九条原则共同指向：减少对 Agent 注意力与记忆的依赖（FINDING-0015 静态 prompt 注意力负担、FINDING-0022 recursive-discovery、ADR-0021 Known-Issue Closure）。指令架构的演进方向与 Roadmap Phase 5（Context Detector + Dispatcher）一致。

## 维护规则

- 本模型是活文档：随指令架构落地（子技能拆分、入口瘦身、机械 control）更新当前状态。
- 只描述系统（规范进 ADR-0022，失效进 Finding）。
