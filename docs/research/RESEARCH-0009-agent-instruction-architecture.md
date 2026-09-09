---
id: RESEARCH-0009
status: Active
version: 4
---

# RESEARCH-0009：Agent 指令架构

本 RESEARCH 是 **系统模型（System Model）**：描述 Agent 指令如何组织、加载与执行。它回答「Generation-1 的 instruction topology 实际是什么、它如何演化、为什么会产生注意力负担、Accepted 目标形态在模型上长什么样、怎么评价」。

它是**描述层**，不规定「必须怎么做」。规范决策（薄入口、树状检索、图状适用、机械优先、lifecycle 非政策仓库）在 ADR-0022。已观察到的失效由 `docs/findings/` 记录（FINDING-0015 / 0025 / 0026）。目录重排属于后续阶段，本模型不授权移动 `references/`。

## 三条校正

先前较容易把 Generation-1 读成「入口文档 + 几份 policy + 若干 sub-skill」。下面三条校正是本版的起点：

1. **`references/` 真正起作用的不只是几份 policy 和 sub-skill。** 它混了规则语义、运行时指令、物化模板、工作流源、物化契约；机械层还在 `scripts/*.js`。日常 Agent 阅读面可以很窄，产品行为面不能忽略其余层。
2. **1.0 的问题不是自然语言写得太少。** 文本量已经很大。真正的缺口是：自然语言、触发、执行和证据没有形成真正的控制架构。
3. **对 Agent 的检索体验应该是树；对规则适用关系实际上应该是图；关键保证还要有机械执行。** 最终形态是「树状检索 + 图状适用关系 + 机械执行」，不是把大 Markdown 拆成很多小 Markdown。

## Generation-1 的 `references/` 实际混了什么

当前物理树看起来整齐：

```text
references/
├── policies/        # 规范语义
├── templates/       # 生成产物模板 + 子技能源文件，职责混杂
├── workflows/       # CI / release 程序
└── init-spec.json   # 物化契约（materialization contract）
```

按**实际作用**分，至少是六类完全不同的东西：

| 类别 | 例子 | 真正作用 |
| --- | --- | --- |
| 规则语义 | `lifecycle.policy.md`、`git.policy.md` | 告诉 Agent 什么必须成立 |
| 运行时指令 | `agents-md.template.md`、`sub-skills.md` | 真正进入 Agent 执行上下文 |
| 物化模板 | env、git-policy、sync-rules、hooks | 生成配置 / 状态 / 辅助文件 |
| 工作流源 | `ci.md`、`release.md` | 生成或指导 CI / release |
| 物化契约 | `init-spec.json` | 决定哪些东西最终存在 |
| 机械层 | `scripts/*.js` | 真正检查 / 阻断部分行为 |

`init-spec.json` 明确规定了生成链：6 个 policy 复制成被治理项目的 `docs/rules/*.md`；`agents-md.template.md` 生成 `AGENTS.md`；`ci.md` 生成 CI；各类 template 生成 `.env.example`、`.governance/*.json`、git hooks；`sub-skills.md` 被生成器拆成 `.governance/generated/skills/*/SKILL.md`。另外一批 JS checker 同时被安装。

因此：

- 若问「日常 Agent 真正读什么」，接近：**AGENTS + 少数适用 policy + 某个 sub-skill，是 1.0 日常 instruction path 的核心。**
- 若问「整个产品行为靠什么成立」，则 `init-spec`、CI workflow、物化模板和 JS 都不可忽略。

把 `references/` 理解成「几份 Markdown 规则」会低估物化与机械层，也会把 `templates/` 里两种完全不同的源文件当成同类。

## `templates/` 按生成方式分类，而不是按语义责任分类

`sub-skills.md` 出现在 `templates/` 本身就是架构味道。`init-spec.json` 对它的定义是：

```text
source: references/templates/sub-skills.md
type: generated
generator: sub-skills
→ .governance/generated/skills/
```

语义上它更接近：

```text
capability sources
instruction modules
skill registry + skill bodies
```

而不是 bootstrap boilerplate。它进入 `templates/`，主要是 Generation-1 生成器视角：「这个文件被拿来生成别的文件，所以放 templates。」这是：

```text
按物理生成方式分类
而不是
按语义责任分类
```

`init-spec.json` 自己也声明：distribution role 不能从目录或文件名推断，必须人工声明。因为 `copy / template / generated / rename / one-to-many` 已经复杂到目录结构无法表达真实职责。这是结构问题的直接证据，不是命名偏好。

独立 Finding：FINDING-0026。本阶段只记录问题模型，不移动目录。

## 模板重要性取决于生成物，不取决于「是 Markdown」

不能统一回答「Markdown 模板重不重要」。真正该问的是：

```text
它生成什么？
生成物有没有 runtime consumer？
这个生成物承担治理语义，还是只是初始化便利？
```

| 源文件 | 生成物 | 判断 |
| --- | --- | --- |
| `agents-md.template.md` | 每个 Agent 会话都会读的 runtime contract | 运行时指令，很重要 |
| `sub-skills.md` | 具体能力模块 `.governance/generated/skills/*/SKILL.md` | 运行时指令，很重要 |
| `git-policy.template.md`、`sync-rules.template.md` | machine state（`.governance/*.json`） | 重要的是生成出来的状态，不是「它是 Markdown」 |
| `feature-doc.template.md`、`env-example.template.md`、`gitmessage.template.md` | bootstrap boilerplate | 初始化便利 |

模板只是物化机制（materialization mechanism），本身不应该成为知识分类。

## 当前指令拓扑（Generation-1）

```text
入口文档（SKILL.md / 生成的 AGENTS.md）
    ↓ 同时承载
规则语义（policies → docs/rules）
运行时指令模块（sub-skills → generated skills）
物化模板 / 工作流源 / init-spec
机械层（scripts/*.js）
知识对象（Research / Finding / ADR / Plan / Roadmap）
历史对象（CHANGELOG / Archived Plan / Superseded ADR）
```

入口层承担了较多职责：身份、always-on 规则、部分 policy 摘要、子技能入口、确认协议。知识型与执行型内容并存于同一加载面。子技能按领域切分后写入同一个 `sub-skills.md`，再由生成器展开为 leaf；路由仍以「Agent 读入口并记忆」为主。

日常路径可以画得很短：

```text
Task
  ↓
Agent 读入口（SKILL / AGENTS）
  ↓
Agent 自行判断适用规则、自行决定加载哪个 sub-skill
  ↓
Agent 自行调用对应 JS
  ↓
CI / release 还必须把 JS 正确接进执行路径
  ↓
执行
```

产品行为则要求上述每一层都接上。任何一层漏接都可以假绿（FINDING-0003、FINDING-0025）。

## lifecycle 是面向阶段的政策单体

`lifecycle.policy.md` 表面上是：

```text
Understand → Plan → Implement → Validate → Synchronize → Report
```

打开以后，Phase 下面不断内嵌横切能力。Phase 3 不只讲 Implement，还塞了引用搜索、变更归位、根因修复协议、失败预算、双域对称、同类实例闭包、control-plane 追查。Phase 4 / 5 又塞证据等级、验证顺序、声明与机制差距、sync groups、Rule Capture、CHANGELOG、Feature / Architecture / Plan 同步与归档。

它真正的结构更接近：

```text
Lifecycle
├── task sizing
├── plan schema
├── user confirmation
├── implementation
├── reference search
├── change hygiene
├── root cause repair
├── failure budget
├── evidence model
├── validation routing
├── declaration/mechanism consistency
├── synchronization
├── rule capture
├── CHANGELOG
├── feature registry
├── architecture update
├── plan lifecycle
└── release-related constraints
```

「Lifecycle」在这里只是容器名字。这是一个**面向阶段的政策单体（phase-oriented policy monolith）**，不是生命周期本身。

## `sub-skills.md` 重复了同一种单体

它本来应体现「一个 capability → 一个独立 skill」。authoring source 却是约 31 KB 的聚合文件，内含 `repository-inspection`、`ci-generator`、`governance-validator`、`state-manager`、`drift-check`、`release-manager`、`plan-manager`、`review-manager` 等。生成器再把这个单体展开成多个 leaf。

某些 leaf 自己又是单体。`drift-check` 同时承担 drift、activity report、freshness、translation freshness、consistency，并复述 lifecycle 的 standard validation sequence。结构是：

```text
一个 authoring monolith
→ 生成很多 leaf
→ 某些 leaf 自己又是 monolith
```

这不是干净的 capability architecture。

## 注意力负担的产生机制

Generation 1 的主要问题**不是缺少规则**，也**不是自然语言写得太少**。

v1.0.0（annotated tag，指向 `62876cd`）时，仅核心 instruction surface 已经相当大：

| 文件 | v1.0.0 体积 |
| --- | ---: |
| `policies/lifecycle.policy.md` | 约 23 KB |
| `policies/git.policy.md` | 约 7 KB |
| `policies/coding.policy.md` | 约 6.5 KB |
| `policies/governance-files.policy.md` | 约 3.9 KB |
| `policies/testing.policy.md` | 约 3 KB |
| `policies/security.policy.md` | 约 1.3 KB |
| `templates/sub-skills.md` | 约 31 KB |
| `templates/agents-md.template.md` | 约 15 KB |

当前 HEAD 上 `lifecycle.policy.md` 已继续胀到约 30 KB，`agents-md.template.md` 约 17 KB——同一膨胀模式在 1.0 之后仍在继续。

所以不是：

```text
Markdown 太少
↓
功能不够
```

真正的问题是：

```text
规则 / 能力已经很多
↓
但只存在于自然语言
↓
Agent 必须自己判断什么时候适用
↓
自己想起来应该加载什么
↓
自己调用对应 JS
↓
JS 又只实现规则的一部分
↓
CI / release 还必须正确把 JS 接进去
↓
任何一层漏接都可能假绿
```

因此继续补 Markdown 没有解决。更多 Markdown 很可能只变成注意力负担上升（FINDING-0015）。无路由的文件拆分是潜在次生风险：负担从「记住大量规则」变成「寻找正确规则」。文件拆分本身可以是解决方案的一部分；真正要消灭的是：

```text
Agent memory = dispatcher
```

## Git 演进证据（以 v1.0.0 为边界）

目录级共变见 `RESEARCH-0006` § Generation-1 开发演化特征。本表是**指令面文件**在同一边界上的触碰次数。

统计方法：`git log --oneline v1.0.0 -- <path>`（含 annotated tag `62876cd`，不用 `--follow`）。`release.md` 第 26 个提交仍有历史，第 27 个已空。

| 文件 | v1.0 前触碰次数 |
| --- | ---: |
| `workflows/release.md` | 26 |
| `templates/agents-md.template.md` | 24 |
| `policies/lifecycle.policy.md` | 19 |
| `templates/sub-skills.md` | 18 |
| `policies/git.policy.md` | 15 |
| `policies/governance-files.policy.md` | 14 |
| `policies/coding.policy.md` | 8 |
| `workflows/ci.md` | 6 |
| `policies/testing.policy.md` | 2 |
| `policies/security.policy.md` | 1 |

这个分布说明 1.0 的演进并不是「不断发现新的治理原则 → 不断新增 policy」，而主要是：

```text
少数核心行为不断膨胀
→ lifecycle 改
→ AGENTS 改
→ sub-skill 改
→ release 改
→ JS 改
→ test 改
→ 后来发现没接好
→ 再继续同步修
```

`testing.policy` / `security.policy` 几乎不增长，并不是这些原则不重要，而是它们很少以独立能力面演化；需要时往往被嵌进 lifecycle / AGENTS / sub-skill / checker。`security` 就是图状适用关系的例子：Implement、Validate、Git commit、Release 都需要它，不能只挂在 Lifecycle 的一个节点下面。

历史也支持「声明存在 ≠ 执行路径接上」。例如 plan delivery 相关修复曾发现：Plan 已声明 `sync.passed`，但 release 从未真正接进去，于是 release 从未验证 sync group；同一次修改同时动 `release.md`、plan delivery checker、generator、Plan 状态标记和 tests。这是典型的 Generation-1 漏接：

```text
Plan 说有
Markdown 说有
代码某处也有
但 execution path 没接上
```

1.0 发布前几轮，`lifecycle.policy.md` 已经吸收 secret-gate bypass、release-proposal forgery、CI gate subset、declaration-mechanism gap、evidence tiers、CI completeness、CHANGELOG contract、gate hardening、POSIX scan liveness。生命周期文档变成「哪里出问题就往哪里塞规则」的综合容器。

## 当前失效模式

- **入口过厚**：大量无关指令同时进入上下文 → 注意力稀释。
- **Agent 记忆充当 dispatcher**：适用性、加载、JS 调用都靠 Agent 想起来。
- **无路由的文件拆分**：拆完仍要求 Agent 记得何时读这 20 个文件 → 一个大 prompt 变成 20 个小 prompt，架构没有改变。
- **政策单体 / 能力源单体**：lifecycle 与 `sub-skills.md`（以及部分 leaf）把横切能力塞进容器文件。
- **按生成方式分类**：可执行指令源与初始化模板住在同一 `templates/` 目录。
- **Instruction system 与 Checker system 人工同步**：中间没有正式 Control identity（FINDING-0002、FINDING-0025）。漏接 → 假绿 / 子集覆盖 / stale projection；补救方式又是再加规则和 checker。

## Git 历史说明了什么

比「JS 写烂了」更准确的结论：

```text
Generation-1 基本治理原则其实没有高速增长
        ↓
高速增长的是执行场景、状态、例外、同步关系和门禁
        ↓
这些东西没有统一 Control / Applicability 架构
        ↓
于是只能分别塞进
Lifecycle / AGENTS / Sub-skills / Release / JS checker / Tests / CI routing
        ↓
每新增一个能力就扩大人工同步面
        ↓
Audit 又不断发现漏接 / 假绿 / 子集覆盖 / stale projection
        ↓
继续加规则和 checker
```

1.0 多轮修改仍然不稳定，并不是因为「团队不会写规则」。它用文档体系承担了应该由控制平面承担的路由和适用性，用大量独立 JS 补机械执行，最后形成两个相互人工同步的系统：Instruction system 与 Checker system。中间没有正式 Control identity。这才是根问题。

## ADR-0022 接受的目标形态（模型描述）

下列拓扑是对 **ADR-0022 Accepted decision** 的模型描述，不是本 RESEARCH 的新选择。规范「必须采用」仍只在 ADR-0022。

在该 Accepted decision 下，对 Agent 的检索体验是树，对规则适用关系是图。例如 `security` 同时适用于 Implement、Validate、Git、Release。若强行纯树：

```text
Lifecycle
└── Validate
    └── Security
```

则 Implement / Release 又得复制一遍 Security。这是 Generation-1 在纯树下会复发的失效，用来解释 ADR-0022 为何同时要求图状适用。

在该 Accepted decision 下，目标 topology 表现为两层。

导航层（树，给 Agent 检索）：

```text
                    Entry
                      │
             detect current context
                      │
       ┌──────────────┼───────────────┐
       ↓              ↓               ↓
     Task            Git           Release
       │              │               │
   ┌───┼───┐       branch          analyze
   ↓   ↓   ↓       commit          approve
 plan impl validate rollback        execute
```

能力层（独立，适用关系是图）：

```text
Capabilities
├── task/           understand · planning · implementation · validation · synchronization
├── git/            branch · write · rollback
├── security/       secret-protection
├── collaboration/  lock · state · activity
├── validation/     project · governance · documentation
├── review/         change-review · system-review · security-review
├── release/
└── governance-maintenance/  rule-capture · drift · audit
```

ADR-0022 规定入口只承担路由，不承载规则正文。对应的加载链可描述为：

```text
Thin Entry
    ↓
Context Detection
    ↓
Applicability
    ↓
Capability Lookup
    ↓
┌───────────────┬────────────────┐
Mechanical      Agent Judgment
primitive       instruction leaf
    ↓                 ↓
Evidence ──────────────┘
    ↓
Decision
```

有机械 primitive 的先执行；需要 judgment 的部分再给 Agent。这是把 ADR-0022 的机械优先，在 instruction 侧描述为：树负责找到能力，图负责回答「当前上下文还适用哪些横切控制」，机械层不依赖入口被记住。

## ADR-0022 对 lifecycle 目标职责的含义

ADR-0022 接受 lifecycle 的目标职责是编排骨架，不是政策仓库。在该约束下，模型上 lifecycle 只保留 lifecycle 本身，例如：

```text
Task Lifecycle
Understand  → entry / exit condition → load: inspection
Plan        → applicable when medium/large → load: planning
Implement   → load: implementation；横切：security、change-hygiene
Validate    → dispatch validation controls
Synchronize → dispatch knowledge / sync controls
Report      → evidence aggregation
```

Root Cause Repair、Rule Capture、Git Write、Evidence、Release、Security、CHANGELOG、Review 在该目标形态下是独立 capability，而不是 lifecycle Phase 的内嵌章节。把 lifecycle 拆成许多文件、却仍要求 Agent 自己记得何时读取，只是换了一种单体（FINDING-0015）。

## ADR-0022 下目标拓扑的一种可描述形态

下列目录树是 **Accepted 目标形态的一种模型描述**，不是目录授权，也不是 Phase 2 执行计划。当前物理树仍以 `init-spec.json` 为准。

在 ADR-0022（入口只路由、叶节点单能力、`templates/` 按生成方式分类不可长期接受）之下，目标语义分类可以表现为：

```text
references/
├── capabilities/     # 可执行 instruction module；一能力一目录
├── policies/         # 真正跨 capability 的规范语义
├── templates/        # 真正的物化模板（agents / env-example / feature-doc / hooks）
├── workflows/        # materialization / runtime workflow source
└── manifest / registry   # 薄索引，不是 30 KB 聚合正文
```

若 2.0 仍采用 sub-skill 机制，authoring 与聚合源如何拆开由后续 ADR / Plan 决定；FINDING-0026 只要求指令源与 boilerplate 责任可分。`sub-skills.md` 作为 30 KB 聚合正文是当前失效形态的证据，不是本 RESEARCH 对替代结构的指定。

**本阶段不移动目录。**

## ADR-0022 已接受的三条约束（如何封住当前失效）

ADR-0022 将「一个入口 → 检索能力 → 按需加载」收紧为三条约束。本 RESEARCH 只描述它们如何封住 Generation-1 失效模式：

> **入口负责路由，不负责承载规则；叶节点负责单一能力，不负责全局编排；机械控制不依赖入口被 Agent 记住。**

规范层只在 ADR-0022；本段不重复宣布 MUST。

## 可评价维度

```text
单次任务进入执行上下文的相关指令比例
applicability 判定是否由系统路由而非 Agent 记忆
关键保证是否依赖「Agent 记得读某条 Markdown」
横切控制是否按图适用，而不是按树复制
机械 primitive 在 Agent 忘记入口时是否仍会执行
执行遗漏 / 误读规则的发生率
Instruction 投影与 Checker 投影是否仍靠人工同步
```

## 与零注意力 / Finding / ADR 的关系

- 规范：ADR-0022
- 注意力负担：FINDING-0015
- 缺控制平面 / 缺 Control identity：FINDING-0002、FINDING-0025
- `templates/` 责任边界：FINDING-0026
- 声明 ≠ 执行、触发靠 Agent：FINDING-0003、FINDING-0004
- 零注意力方向：ADR-0021、FINDING-0022；Roadmap Phase 5 是投影
- 机械基底冻结：ADR-0014、RESEARCH-0006。本模型不把 Gen2 语义编码进 Gen1 checker。

## 维护规则

- 本模型是活文档：随指令架构落地更新当前拓扑与失效模式。
- 只描述系统（规范进 ADR-0022，失效进 Finding）。正文不得自行宣布 MUST / 目录必须怎么搬。
- 不在本 RESEARCH 写入 Rule Registry / Dispatcher schema（那是 Phase 3 的设计面）。
