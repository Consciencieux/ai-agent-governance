---
id: ADR-0022
status: Accepted
generation: gen2
---

# ADR-0022：Agent 指令架构


## 背景

当前 Agent 指令主要通过 `SKILL.md`、`AGENTS.md` 等入口文档进入执行上下文，并进一步连接子技能、领域 policy / workflow，以及 Research / Finding / ADR / Plan / Roadmap 等知识对象。

Generation 1 的主要问题不是缺少规则，而是**大量不同职责的指令长期聚集在入口层或同时进入 Agent 上下文**。随着规则、工作流和治理机制增长，Agent 需要在一次任务中阅读、判断和记忆越来越多并非全部适用的内容，导致 attention burden、applicability ambiguity 和执行遗漏持续增加。关键保证因此仍可能依赖「Agent 是否读到、记住并正确选择了某条 Markdown」。

将领域能力拆分为独立子技能和专用文档可以降低单次上下文负担，但**文件拆分本身不足以解决问题**。如果拆分后仍由 Agent 自行搜索和判断应读取哪些文件，而缺少明确的 task → capability routing，则负担只会从「记住大量规则」转变为「寻找正确规则」。

因此，目标不是单纯缩短或拆分 Markdown，而是建立按需路由的加载链（原线性表述保留如下，作为本 ADR 接受时的目标草图；执行形态见 2026-09-10 后续修正）：

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

使入口层只承担少量 always-on invariants 与路由职责，详细执行规则按任务加载，知识与历史对象按需查询；对关键保证则进一步减少对 Agent 注意力的依赖，逐步迁移到机械 control。

ADR-0010 已确立 README / CONTRIBUTING 等入口层文档不承担事实库职责；本 ADR 将「入口不作为知识仓库」这一原则**推广**到完整的 Agent 指令架构，并进一步规定执行入口、领域能力、知识对象与历史对象的加载边界。系统运行模型（描述层）见 `docs/research/RESEARCH-0009-agent-instruction-architecture.md`。

## 决策

**1. Thin Entrypoint（入口要薄）。** **always-on / execution-facing 入口**（`SKILL.md`、`AGENTS.md`、根 `README.md`）只承担：身份与作用域、少量 always-on invariants、优先级与冲突规则、任务分类、子技能/工作流入口、必要的 fallback。**不得**退化为完整知识库或完整政策仓库；详细规则由被指向的领域文件承担。**本原则不适用于按需加载的知识目录 README**（`docs/research/README.md`、`docs/findings/README.md` 等可承载详细 taxonomy / schema——它们是 on-demand reference，不是 execution entrypoint）。

**2. Specialized Execution（能力分层）。** 每个子技能 / 工作流文档只负责一个相对明确的执行领域（bug fix→repair；release→release workflow；git write→git policy；review→review skill；documentation change→knowledge policy）。一个文件同时承担多个领域即视为过载，应拆分。

**3. Progressive Disclosure（渐进披露）。** 指令按 L1 Entry（去哪）→ L2 Execution（怎么做）→ L3 Reference（edge cases / rationale / taxonomy）分层；普通任务只加载 L1 + 相关 L2。

**4. Contextual Loading（按需加载）。** 执行上下文只加载当前任务适用的指令（Task Context → Applicability → Required Skill/Policy → Load → Execute）；**不得**要求 Agent 在每次任务开始时通读全部规则。

**5. Knowledge ≠ Always-on Execution。** Research / Finding / ADR 不作为 always-on instruction；只有当当前任务、Active Plan 或 routing 明确引用其约束时，才按需加载相关知识对象。执行型对象（Workflow / Policy / Skill）用于当前执行。为执行一次 commit 不得默认加载全部 Research / ADR——但受当前 Active Plan 约束的 Accepted ADR 属「明确引用」，应加载（与「Active Plan under Accepted ADR constraints」一致）。

**6. History is On-demand（历史后置）。** Archived Plan / Superseded ADR / old Research / CHANGELOG 默认不进入执行上下文；需要 provenance 时再按需查询。

**7. Routing Must Be Explicit（路由明确）。** 入口必须明确：什么任务读哪个文件、多个规则同时适用时谁优先、判断不清时的 fallback。文件拆分必须伴随显式路由，否则只是把「记规则」变成「找规则」。

**8. Zero-Attention First（机械优先）。** 关键保证不得依赖「Agent 是否记得读某条 Markdown」；越重要的规则越应从 guidance 升级为机械 control（演进方向：Task Context → Context Detector → Applicable Controls → Dispatcher → Mechanism，Roadmap Phase 5）。

**9. 总原则。** 整套架构定义为：

> **Use thin execution entrypoints to route task context into specialized skills; load only applicable instructions progressively, keep knowledge and history on demand, and move critical guarantees out of Agent attention into mechanical enforcement.**

> **薄入口、专能力、按需加载、职责单一、历史后置、路由明确、机械优先。**

## 后续修正（2026-09-10）：树状检索 + 图状适用关系 + 机械执行

本修正是对「目标拓扑」以及决策 1 / 2 / 7 / 8 执行形态的 **Narrow amendment**。上方线性加载链与九条原则保留为历史；自本修正起，下列约束补充并收紧尚未覆盖的部分。系统描述与 Generation-1 演进证据见 RESEARCH-0009 v3。

1. **目标形态不是「把大 Markdown 拆成很多小 Markdown」，也不是「再写更多自然语言」。** v1.0.0 的 instruction surface 已经很大（体积与演进证据见 RESEARCH-0009）。无路由的拆分只是把一个大 prompt 变成许多小 prompt，Agent 记忆仍是 dispatcher。文件拆分必须同时具备：树状检索（导航）、图状适用关系（横切控制不被单挂到一个 lifecycle 节点）、机械执行（关键保证不依赖入口被记住）。
2. **三条约束。** 入口负责路由，不负责承载规则；叶节点负责单一能力，不负责全局编排；机械控制不依赖入口被 Agent 记住。这三句封住 Generation-1 的主要 instruction 缺陷：厚入口、政策单体、以及「忘了读 Markdown 就等于没有控制」。
3. **lifecycle 的目标职责是编排骨架，不是政策仓库。** 横切能力（Root Cause Repair、Rule Capture、Security、CHANGELOG、Review 等）应成为独立 capability，由 applicability 图挂到多个导航节点；禁止继续把它们内嵌进某个 Phase 作为默认归宿。本条是目标形态，不授权当前移动 `references/` 或改写 Gen1 JS。
4. **`templates/` 按生成方式分类不是可接受的长期知识分类。** 可执行 instruction source 与 bootstrap boilerplate 职责不同（FINDING-0026）。目录重排留待后续阶段；当前仍以 `init-spec.json` 为物化契约。

## 后续修正（2026-09-10）：Context Economy

本修正是对决策 3–7（渐进披露 / 按需加载 / 知识与历史后置 / 显式路由）的 **Narrow amendment**：把已反复约束施工的**上下文经济**写成规范后果，**不是**新建 token 框架、预算门禁、评分或 Control。

**目标陈述：** 最小化完成授权工程目标所需的**预期总上下文成本与重复推理**，同时保持所需语义、正确性、安全与验证——不是「token 越少越好」。多读一份权威 ADR 若能避免错误重构与整轮重读，通常更经济。

在不损害语义、正确性、安全和必要证据的前提下：

1. **不默认重新推导**已被可靠 Research / ADR / Plan 压缩层固定的历史结论。
2. **从最小充分上下文开始**；只在歧义、drift 或验证失败时扩大读取范围。
3. **避免重复读取**未变化的 authority。
4. 当同一有效上下文能完成 **implementation → closure → review** 时，不人为切换 Agent / session 只为「再审一遍」而重新支付 context acquisition——独立审查视角、Safety-critical second opinion、或上下文已明显污染时除外。
5. **文档结构与 routing** 应减少重复读取与无关上下文；禁止把「少文件」本身当成成功标准（无路由的拆分仍增加找规则成本）。

禁止借本条引入：`TOKEN-ECONOMY.md`、token score / budget gate、机器 schema、或新的 Context-Economy Control。施工期 read-set 写在 Active Plan（如 PLAN-0035），不在此 ADR 展开操作清单。

## 后续修正（2026-09-11）：可回溯 ≠ 每次读全；Plan 短合同 ≠ 科研百科

本修正是对决策 5–6 与 Context Economy 的 **Narrow amendment**。系统描述见 RESEARCH-0013。不新建知识类型、不建 Context Snapshot 文件、不授权事后 Log 生成器。

本仓库同时要：**事后能回溯较完整的开发经历**，以及 **执行时保持上下文经济**。写全 provenance、读时 on-demand。禁止为「科研完整」在每次任务加载全部 Research / 归档 Plan。

**事前 / 事后（不替代规模分级）：**

- **事前 Plan** = 短执行合同（目标/假设、约束、非目标、影响面、验收）。不是 50 页操作手册，也不是研究论文。
- **事后沉淀**按已有类型：Research / experiments（理解与测量）、Finding（问题）、ADR（选择与放弃方案）、Archived Plan（当时做成了什么）。
- **Git / CHANGELOG** 仍只承载 What / 发布边界交付；Why 不进这两处。
- 拒绝「详细事前 Plan 系统性劣于事后 Log」：无短事前边界会失去预注册；无事后类型会丢掉 Reality。

一般被治理项目不复制本仓科研文档树；薄入口与按需加载仍适用。完整对照表在 RESEARCH-0013。

## 后果

- 入口文档（`SKILL.md` / `AGENTS.md` / README）瘦身为路由层，领域规则下放子技能 / 领域文件。
- 知识对象与执行规则分离加载；历史对象后置。
- 关键控制逐步从 Markdown 升级为机械 carrier（与 ADR-0021 Known-Issue Closure、FINDING-0015 零注意力方向一致）。
- 本 ADR 是 Gen2 instruction architecture 的演进依据；具体入口瘦身 / 子技能拆分 / `references/` 重分类属后续执行任务，不在本 ADR 一次性铺开。拆文件若无路由与机械路径，不得视为本 ADR 已执行。
- Context Economy 约束预期总上下文成本与重复推理，不授权 token 预算门禁或「为省 token 而少读必要权威」。
- 科研回溯通过类型化对象 + 链接完成；执行上下文不因此变厚（RESEARCH-0013）。

## 参考

- 运行模型（描述层）：`docs/research/RESEARCH-0009-agent-instruction-architecture.md`
- 入口层文档边界（前身）：ADR-0010
- 静态 prompt 注意力负担：FINDING-0015
- `templates/` 指令源与物化模板混置：FINDING-0026
- Known-Issue Closure（零注意力执行语义）：ADR-0021
- 知识对象模型（当前/历史隔离、知识≠执行）：RESEARCH-0007 / ADR-0016
- 科研回溯 vs 上下文经济、一般项目文档面：RESEARCH-0013
- Dispatcher 演进（Roadmap Phase 5）：ADR-0018 / Roadmap
