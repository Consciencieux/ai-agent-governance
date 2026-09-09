# Docs 目录（文档知识体系总入口）

本页是整个 `docs/` 知识体系的 **canonical index**：定义每一类文档的职责、语言、生命周期与入口导航。各目录的**详细管理规则**由各自的 README 负责（`plans/README.md`、`findings/README.md`、`research/README.md`、`design-decisions/README.md`），本页不复述规则正文，只做分类与导航。

## 目录结构

```text
docs/
├── README.md              # 本页：知识体系总入口（分类、职责、语言、生命周期总览）
├── glossary.md            # 跨所有 docs 类型共享的术语事实源（三语对照）
├── product/               # 面向用户的产品文档（三语：en / zh-CN / zh-TW）
├── plans/                 # 执行计划（roadmap 三语；PLAN 简体中文单语）
├── findings/              # 发现与证据（简体中文单语）
├── research/              # 系统模型、研究与实验（简体中文单语）
└── design-decisions/      # 长期设计决策（简体中文单语）
```

## 东西放哪里（知识对象路由）

**内容路由测试**——按对象的 **primary authoritative responsibility** 判定归属：

```text
这是在描述系统？            → Research
这是在记录已经观察到的问题？  → Finding
这是在做长期选择？          → ADR
这是在安排长期未来？        → Roadmap
这是在安排当前施工？        → Plan
这是给产品用户看的当前事实？ → Product
```

对象可包含必要的 supporting context（如 ADR 的 Background/Consequences、Finding 的 Resolution）；**只有 forming 独立长期知识时才拆出并互相引用**，不是「两问同答就必须拆」。

**七类对象（唯一主问题 + 禁止承担）**：

| 类型 | 唯一主问题 | 禁止承担 |
| --- | --- | --- |
| Product | 用户现在应该知道什么？ | 内部研究、计划、历史决策 |
| Research | 这个系统现在是什么、怎么工作、如何理解？ | 宣布必须采用某方案 |
| Finding | 实际发现了什么问题？ | 详细施工方案 |
| ADR | 我们接受了什么长期决策，为什么？ | 任务状态、implementation checklist、bug inventory、roadmap scheduling |
| Roadmap | 未来往哪里走、当前在哪个阶段？ | 详细设计、完整历史、事实复制；**裁决阶段顺序**（归 ADR-0018） |
| Plan | 当前这项工作怎么做、怎么验收？ | 重新定义长期架构 |
| Glossary | 术语到底叫什么？ | 业务规则和架构决策 |

**Archive Plan 是 Plan 的生命周期状态，不是独立类型**：`docs/plans/archive/` 中的 Plan 是 Archived 状态（历史执行证据），类型仍为 Plan（目录决定类型，状态决定生命周期）。

**当前 vs 历史（隔离）**：

```text
Current truth:      Product / Active Research / Active Findings / Accepted ADR / Current Roadmap / Active Plan
Historical evidence: Superseded Research / Resolved·Invalidated Findings / Superseded ADR / Archived Plans / Git / CHANGELOG
```

历史记录可被读来理解 provenance，**不得直接成为当前执行指令**。

完整系统模型（描述层）→ `docs/research/RESEARCH-0007-documentation-knowledge-architecture.md`；规范层（routing / must-not / 当前-历史隔离）→ ADR-0016。

## 统一表示法（Representation Normalization）

Plan / Finding / Research / ADR 四类对象：

```text
- YAML frontmatter 统一
- 公共必填仅 id/status
- 空 optional 字段省略（sparse）
- 机器字段/enum 用稳定英文
- 简中 canonical 正文：H1/章节/表格头以中文为主
- 类型专属 schema → 对应目录 README
- 生命周期语义本阶段不改（Gen1 正文 Status 解析保留至 Phase 4）
```

规范：ADR-0016 § 后续补充；各类型专属字段/status enum/章节 → `plans/README.md`、`findings/README.md`、`research/README.md`、`design-decisions/README.md`。

## 类型边界、语言与生命周期

| 类型 | 位置 | 职责 | 语言 | 生命周期 |
| --- | --- | --- | --- | --- |
| **Product** | `product/{en,zh-CN,zh-TW}/` | 面向用户的产品文档（使用指南、状态模型、校验器、命令等） | 三语 | 随产品演进 |
| **Roadmap** | `plans/roadmap/{en,zh-CN,zh-TW}.md` | 长期方向声明，不是功能清单 | 三语 | 持续维护，不归档 |
| **Plan** | `plans/PLAN-xxxx-*.md` | 当前执行工作，具体任务准备怎么做 | 简体中文单语 | Active → **Archive（物理移动）** |
| **Finding** | `findings/FINDING-xxxx-*.md` | 发现与证据、失败模式、研究观察 | 简体中文单语 | 状态变化，**不移动** |
| **Research** | `research/RESEARCH-xxxx-*.md` | 系统模型、机制分类、评价框架、实验 | 简体中文单语 | 状态变化，**不移动** |
| **ADR** | `design-decisions/ADR-xxxx-*.md` | 长期设计决策，为什么这样做 | 简体中文单语 | Superseded / Deprecated **仍留原位** |
| **Glossary** | `glossary.md` | 全文档体系共享的术语事实源 | 三语对照 | 持续维护 |

## 生命周期总原则

> **Archive is a Plan lifecycle concept, not a general documentation category.**

```text
Plan     → physical archive（移到 plans/archive/）
Finding  → status transition in place（状态就地更新，永不归档）
Research → status transition in place（Draft → Active → Superseded，就地）
ADR      → status transition in place（Accepted → Superseded / Deprecated，就地）
```

只有 Plan 做物理归档；Finding / Research / ADR 不因状态变化移动路径。

ADR 的修订政策（澄清 vs 语义变化；**ADR 可以演进，但不能改写历史**）见 `docs/design-decisions/README.md` § ADR 修订与演进。

## CHANGELOG（历史变更投影载体）

`CHANGELOG.md` 在仓库根（不在 `docs/`），但属于知识架构的**历史 / 变更记录投影**载体：

```text
Current truth:      Product / Research / Finding / Accepted ADR / Roadmap / Active Plan
Historical / change: CHANGELOG / Archived Plan / Superseded ADR·Research / Git history
```

**唯一主问题**：从上一个发布边界到这个发布边界，项目发生了哪些值得读者知道的实际变化？

**准入测试（decision ≠ delivered change）**：

```text
Did observable project behavior / public interface / contributor workflow /
release behavior / or supported capability actually change?
YES → candidate；NO → normally no CHANGELOG entry
```

**不应包含**：根因分析、架构 rationale、未来计划、research model、raw findings、测试计数 / exit code / 验证叙事、实现日志、每个 commit、每个文档对象。

**`[Unreleased]`** = 已实现、准备进入下一个正式 release 的 change projection；**不是**所有正在讨论的工作 / 所有 Accepted ADR / 所有 Active Plan。Migration Mode 禁发布时，`[Unreleased]` 不是每个 migration commit 的流水账——在 checkpoint / merge / release composition 时统一整理。

**Released section** = 历史记录，默认不可重写；允许 factual correction / broken pointer correction / 明确授权的历史整理，不允许为匹配今天架构改写历史（与 ADR「不改写历史」同源）。

规范层：ADR-0012 § 后续补充；repo 自身 CHANGELOG 政策由 Repo Profile（`AGENTS.md`）拥有，格式契约共享自 payload（`references/policies/lifecycle.policy.md`）。

## 代际政策（总原则）

> **Knowledge objects may carry generation metadata to distinguish Generation 1, Generation 2, or cross-generation applicability. Generation does not change object identity or directory placement.**

代际用**对象元数据**表达，不用目录、不用文件名前缀、不重新编号。各类型的具体字段与取值规则归各目录 README：

| 类型 | 字段 | 规则所在 |
| --- | --- | --- |
| Plan | `generation` | `docs/plans/README.md` |
| ADR | `generation` | `docs/design-decisions/README.md` |
| Finding | `observed_in` / `resolved_in` | `docs/findings/README.md` |
| Research | `subject_generation` | `docs/research/README.md` |

决策记录：ADR-0019。

## 治理模型（ADR / Roadmap / Plan）

系统如何运作（描述层）见 `docs/research/RESEARCH-0007-documentation-knowledge-architecture.md`（System Model：Roadmap / ADR / Plan / Archive / Finding / Research 的关系、数据流、Agent 导航、机械 carrier）。规范层（必须遵守的权威规则）归各域 ADR：

| 规范规则 | 权威 |
| --- | --- |
| Roadmap MUST NOT override Accepted ADR；冲突修 Roadmap | ADR-0015 § 决策 |
| 改变 ADR 已决定的架构方向必须先新增/修订 ADR | ADR-0015 § 决策 |
| Gen2 阶段必须通过当前阶段 Active Plan 执行 | ADR-0018 § 决策 |

| 对象 | 核心职责 | 回答的问题 | 是否事实源 |
| --- | --- | --- | --- |
| ADR | 架构决策与约束 | 为什么这样设计？哪些约束已经成立？ | 是 |
| Roadmap | 长期方向与阶段顺序 | 未来往哪里走？当前在哪个阶段？ | 否，索引/演进视图 |
| Plan | 当前具体执行合同 | 这个阶段现在具体怎么做、怎么验收？ | 是，针对当前任务 |

```text
Accepted ADR  >  Roadmap  >  Active Plan
```

ADR 定约束，Roadmap 排顺序，Plan 负责施工；阶段顺序权威 = ADR-0018。

## 总设计原则

> **目录表示知识类型；状态和代际由对象元数据表达。不要通过不断增加目录层级来表达生命周期或架构时代。**

禁止演化出 `docs/gen1/`、`docs/gen2/`、`docs/archive/adr/`、`docs/archive/findings/` 之类的结构。

## 入口导航

- 用户产品文档 → `docs/product/{en,zh-CN,zh-TW}/`（根 `README.md` 是英文入口）
- 长期路线图 → `docs/plans/roadmap/`
- 执行计划 → `docs/plans/`（管理规则：`docs/plans/README.md`）
- 归档计划 → `docs/plans/archive/`
- 发现与证据 → `docs/findings/`（管理规则：`docs/findings/README.md`）
- 系统模型与实验 → `docs/research/`（管理规则：`docs/research/README.md`）
- 架构决策 → `docs/design-decisions/`（管理规则：`docs/design-decisions/README.md`）
- 术语 → `docs/glossary.md`
- 仓库布局（安装载荷 vs 仓库基础设施）→ `docs/product/en/architecture.md`
