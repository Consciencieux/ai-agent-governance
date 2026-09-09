# 设计决策记录（ADR）


本仓库的架构决策记录。每条 ADR 记录一个真实决策、背景与后果。

**导航边界：** 每条 ADR 的 `status` 与 `generation` 以该文件 frontmatter 为唯一事实源。本 README 只维护 ID、标题和导航摘要，不复制状态/代际字段；修订历史与语义演进见各 ADR 正文。

| ID | 标题 | 导航摘要 |
| --- | --- | --- |
| [ADR-0001](ADR-0001-governance-directory.md) | 用 `.governance/` 取代旧的 `.agent/` 状态目录 | 治理状态目录位置 |
| [ADR-0002](ADR-0002-optional-runtime-outputs.md) | `validation.json` / `drift-report.json` 为可选的运行时输出 | 运行时输出是否必需 |
| [ADR-0003](ADR-0003-single-file-bilingual-readme.md) | 单文件双语 README，而非按语言拆分文件 | README 语言布局历史决策 |
| [ADR-0005](ADR-0005-trilingual-split-docs.md) | 三语拆分文档（docs/en/ + docs/zh-CN/ + docs/zh-TW/） | 三语文档布局 |
| [ADR-0004](ADR-0004-human-in-the-loop-release.md) | 人类参与的发布流程 | 发布审批流程 |
| [ADR-0006](ADR-0006-no-dogfooding.md) | 本仓库不狗粮自身治理框架 | 本仓库不把自身当作被治理项目 |
| [ADR-0007](ADR-0007-plan-layering-orthogonal-triggers.md) | 治理计划分层独立与正交触发（工程克制 × 反补丁） | 计划分层与触发 |
| [ADR-0008](ADR-0008-trigger-inventory-commands-md-exception.md) | 触发词清单复制的规则冲突裁定（commands.md 例外） | 触发词清单例外 |
| [ADR-0009](ADR-0009-index-vs-fact-source.md) | 索引与事实源的边界 | roadmap/里程碑是索引、计划是事实源；本仓库机械验证、被治理项目仅文档约束 |
| [ADR-0010](ADR-0010-entry-layer-boundary.md) | 文档分层与入口层边界 | README/CONTRIBUTING 是入口层，不承担事实库职责；稳定契约可写但链接权威源 |
| [ADR-0011](ADR-0011-public-interface-freeze.md) | 1.0.0 冻结公开接口面 | 五类接口受 SemVer 约束；成员清单留在各自事实源，破坏性变更走 MAJOR + 迁移 |
| [ADR-0012](ADR-0012-record-responsibility-boundary.md) | 变更记录与其他载体的职责边界 | CHANGELOG 记已交付变更；准入按影响；写入可推迟、对账不可推迟 |
| [ADR-0013](ADR-0013-findings-archive.md) | 问题 / 发现档案与知识对象五分类 | Finding 在 repo 内 canonical、GitHub Issue 是 projection；状态就地更新不归档；简中单语；review 先分类再修复 |
| [ADR-0014](ADR-0014-architecture-migration-mode.md) | 架构迁移模式 | 2.0 重构期间旧 gate 降级为观测；保留 Refactor Safety Kernel；checkpoint ≠ Release；禁止正式/prerelease tag |
| [ADR-0015](ADR-0015-roadmap-repositioning.md) | 路线图重新定位 | roadmap 从功能清单变为架构演进视图；已完成能力迁往 research/；维护触发从每次发布改为架构事件；加入非目标 |
| [ADR-0016](ADR-0016-doc-structure-purpose-first.md) | 文档结构用途优先 | 语言不是第一层分类；知识对象按用途分层；权威矩阵；Plan 归档触发 = lifecycle closure（≠ Release） |
| [ADR-0017](ADR-0017-migration-branch-strategy.md) | 2.0 迁移分支策略 | 长期 migration/2.0 分支 + 阶段里程碑合并；main 保持 1.x 稳定 baseline；不发布 1.1/1.2 过渡；2.0 RC 后合入 |
| [ADR-0018](ADR-0018-generation-2-dev-path.md) | 第二代开发路径 | Phase 0–8 执行顺序；统一 ID 编号规则；CONTROL-X 跨 profile 契约测试；测试指标转向；Gen2 阶段须通过 Active Plan 执行 |
| [ADR-0019](ADR-0019-generation-metadata.md) | 知识对象代际元数据 | 用 metadata 不用目录标记架构时代；与 status 正交；Plan archived ≠ feature deprecated ≠ control obsolete ≠ product released |
| [ADR-0020](ADR-0020-producer-product-governance-separation.md) | 生产者 / 产品治理分离 | Profile 术语、共享语义单一权威 owner、separation invariants 与 CONTROL-X 契约 |
| [ADR-0021](ADR-0021-known-issue-closure.md) | 已知问题闭包 | 已知问题持久捕获、显式处置、zero unaccounted 与 Discovery Ledger |
| [ADR-0022](ADR-0022-agent-instruction-architecture.md) | Agent 指令架构 | 薄入口路由、叶节点单一能力、树状检索 + 图状适用 + 机械执行；机械控制不依赖入口被记住 |
| [ADR-0023](ADR-0023-governance-control-model.md) | Governance Control Model | Control 为一级对象；semantics ≠ evaluator ≠ gate ≠ test；最小 slot；CTRL identity 稳定；schema 家在本 ADR，不预置 payload 目录 |

## 生命周期与代际

- **统一 envelope（表示法归一，ADR-0016）**：frontmatter = `id` / `status` / `generation`（+整篇 supersede 时 `superseded_by`）；正文不再有 `- 状态：` / `- 代际：` / `- 日期：`（canonical 在 frontmatter / Git）；H1 = `# ADR-xxxx：中文标题`。

- **ADR 不物理归档。** `Superseded` / `Deprecated` 只在文件内更新状态，文件永久留在本目录原位——ADR 是长期设计决策记录，被取代不等于消失。
- **`generation` 与 `status` 是两个独立维度**（代际 = 属于哪个架构时代；状态 = 生命周期状态）。不要合并成 `status: gen1-old` 之类的混合值。
- **`generation` 取值**：`gen1`（仅 Generation-1 有效）/ `gen2`（定义 Generation-2）/ `cross-generation`（跨代继续有效）。具体决策见 ADR-0019。
- **ADR 文件按稳定 ID 引用**（如 `(ADR-0007)`、`ADR-0019`），不按路径引用——路径可能变化，ID 永久不变（ADR-0018 § 决策 3）。

## ADR 修订与演进（不能改写历史）

ADR 生命周期支持 `Proposed / Accepted / Superseded / Deprecated`，被取代后永久保留。修订一个 Accepted ADR 分两类：

```text
已接受 ADR（Accepted ADR）
  ↓
发现问题
  ↓
只是说明不清（typo / 措辞澄清 / 补充例子 / 补引用）？
  ├─ 是 → 直接修改原 ADR（不改变原决策语义）
  └─ 否 → 决策语义发生变化，按变化范围二选一：
      ├─ 整体替代（Major replacement）
      │   → 新建 ADR
      │   → 旧 ADR 整篇标记 Superseded（完全取代）或 Deprecated（不再推荐 / 逐步退出）
      │
      └─ 局部修正（Narrow amendment）
          → 原 ADR 保持 Accepted
          → 在原 ADR 内追加带日期的「后续修正」，明确标记「旧 clause 被 YYYY-MM-DD amendment supersede」
          → 保留旧 clause 作为历史
      ↓
   路线图 / 计划 / 研究投影（Roadmap / Plan / Research projections）跟随更新
```

- **澄清**（typo、措辞、例子、引用，不改变决策语义）→ 可直接修改原 ADR。
- **Major replacement** → 新 ADR + 旧 ADR 整篇 `Superseded` / `Deprecated`。
- **Narrow amendment** → 原 ADR 保持 `Accepted`，内部追加带日期「后续修正」并标记被取代的旧 clause（`Deprecated` 不代表发生语义修改，只表示不再推荐 / 逐步退出）。
- **历史原文与「当时为什么这么决定」必须保留**，以便追溯决策演进。

> **ADR 可以演进，但不能改写历史。**

规范示例：ADR-0016 原设计多类 archive，后因生命周期语义冲突追加「后续修正（2026-09-09）」，明确只有 Plan 物理归档，原正文保留为历史记录——这是 **Narrow amendment** 的正确形态（原 ADR 保持 Accepted）。

状态：Proposed / Accepted / Superseded / Deprecated。
