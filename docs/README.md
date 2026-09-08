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
