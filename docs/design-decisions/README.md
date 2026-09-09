# 设计决策记录（ADR）


本仓库的架构决策记录。每条 ADR 记录一个真实决策、背景与后果。

| ID | 标题 | 代际 | 状态 |
| --- | --- | --- | --- |
| [ADR-0001](ADR-0001-governance-directory.md) | 用 `.governance/` 取代旧的 `.agent/` 状态目录 | cross-generation | Accepted（v0.3.1） |
| [ADR-0002](ADR-0002-optional-runtime-outputs.md) | `validation.json` / `drift-report.json` 为可选的运行时输出 | cross-generation | Accepted（v0.3.2） |
| [ADR-0003](ADR-0003-single-file-bilingual-readme.md) | 单文件双语 README，而非按语言拆分文件 | gen1 | Superseded（被 ADR-0005 取代） |
| [ADR-0005](ADR-0005-trilingual-split-docs.md) | 三语拆分文档（docs/en/ + docs/zh-CN/ + docs/zh-TW/） | gen1 | Accepted |
| [ADR-0004](ADR-0004-human-in-the-loop-release.md) | Human-in-the-loop 发布流程（Analyze → Proposal → Approval → Execute） | cross-generation | Accepted（v0.4.0） |
| [ADR-0006](ADR-0006-no-dogfooding.md) | 本仓库不狗粮自身治理框架 | cross-generation | Accepted |
| [ADR-0007](ADR-0007-plan-layering-orthogonal-triggers.md) | 治理计划分层独立与正交触发（工程克制 × 反补丁） | cross-generation | Accepted |
| [ADR-0008](ADR-0008-trigger-inventory-commands-md-exception.md) | 触发词清单复制的规则冲突裁定（commands.md 例外） | cross-generation | Accepted |
| [ADR-0009: 索引与事实源的边界](ADR-0009-index-vs-fact-source.md) | roadmap/里程碑是索引、计划是事实源；本仓库机械验证、被治理项目仅文档约束 | cross-generation | Accepted |
| [ADR-0010: 文档分层与入口层边界](ADR-0010-entry-layer-boundary.md) | README/CONTRIBUTING 是入口层，不承担事实库职责；稳定契约可写但链接权威源 | cross-generation | Accepted |
| [ADR-0011: 1.0.0 冻结公开接口面](ADR-0011-public-interface-freeze.md) | 五类接口受 SemVer 约束；成员清单留在各自事实源，破坏性变更走 MAJOR + 迁移 | cross-generation | Accepted（v1.0.0） |
| [ADR-0012: 变更记录与其他载体的职责边界](ADR-0012-record-responsibility-boundary.md) | CHANGELOG 记变更事实；根因与决策进 ADR/计划，验证进测试证据；历史逐步迁移 | cross-generation | Accepted |
| [ADR-0013: Issue/Finding Archive 与知识对象五分类](ADR-0013-findings-archive.md) | 第五类载体 `docs/findings/`；repo 内 canonical、GitHub Issue 是 projection；状态就地更新不归档；简中单语；review 先分类再修复 | cross-generation | Accepted |
| [ADR-0014: Architecture Migration Mode](ADR-0014-architecture-migration-mode.md) | 2.0 重构期间旧 gate 降级为观测；保留 Refactor Safety Kernel；checkpoint 验证；禁止 release；冻结规则演进 | gen2 | Accepted |
| [ADR-0015: Roadmap 重新定位](ADR-0015-roadmap-repositioning.md) | roadmap 从功能清单变为架构演进视图；已完成能力迁往 research/；维护触发从每次发布改为架构事件；加入 Non-goals | gen2 | Accepted |
| [ADR-0016: 文档结构用途优先](ADR-0016-doc-structure-purpose-first.md) | 语言不是第一层分类；user-facing 才三语；product/plans/findings/research/ADR/archive 按用途分层；Migration Mode 分阶段实施 | gen2 | Accepted |
| [ADR-0017: 2.0 迁移分支策略](ADR-0017-migration-branch-strategy.md) | 长期 migration/2.0 分支 + 阶段里程碑合并；main 保持 1.x 稳定 baseline；不发布 1.1/1.2 过渡；2.0 RC 后合入 | gen2 | Accepted |
| [ADR-0018: Generation-2 开发路径](ADR-0018-generation-2-dev-path.md) | 8 阶段执行顺序（Migration Mode → Producer/Product 分离 → Core/Rule Model → Dispatcher → Invariant Testing → Review 三分）；统一 ID 编号规则；CONTROL-X 跨 profile 契约测试；测试指标转向 | gen2 | Accepted |
| [ADR-0019: 知识对象代际元数据](ADR-0019-generation-metadata.md) | 用 metadata 不用目录：`generation`/`observed_in`/`subject_generation` 标记架构时代；与 status 正交；Plan archived ≠ feature deprecated ≠ control obsolete；30 个归档 Plan 标 gen1，18 个 ADR 分类；RESEARCH-0006 能力基线 | cross-generation | Accepted |
| [ADR-0020: Producer/Product Governance Separation](ADR-0020-producer-product-governance-separation.md) | Phase 1 产物：Profile 术语（repo/skill/shared semantic owner/consumer/implementation/dependency）；SSOT「共享语义单一权威 owner」；4 条 separation invariants；cross-profile closure contract（CONTROL-X 契约定义，不实现）；`owner: core` 仅为分类词汇 | gen2 | Accepted |
| [ADR-0021: Known-Issue Closure](ADR-0021-known-issue-closure.md) | 已知问题闭包执行语义：discovery 必须持久捕获（Once discovered → represented until disposition）；新发现 ≠ 自动抢占当前任务；完成要求 zero unaccounted（disposition 枚举）；第一代载体 = TASK Plan 内 append-only Discovery Ledger；分层（workset / Finding / GitHub Issue） | cross-generation | Accepted |
| [ADR-0022: Agent Instruction Architecture](ADR-0022-agent-instruction-architecture.md) | 指令架构总原则：薄入口（入口文档只承担身份/invariants/优先级/分类/入口/fallback）、专能力、渐进披露、按需加载、知识≠执行、历史后置、路由必须明确、机械优先（零注意力）；总原则「薄入口、专能力、按需加载、职责单一、历史后置、路由明确、机械优先」 | gen2 | Accepted |

## 生命周期与代际

- **ADR 不物理归档。** `Superseded` / `Deprecated` 只在文件内更新状态，文件永久留在本目录原位——ADR 是长期设计决策记录，被取代不等于消失。
- **`generation` 与 `status` 是两个独立维度**（代际 = 属于哪个架构时代；状态 = 生命周期状态）。不要合并成 `status: gen1-old` 之类的混合值。
- **`generation` 取值**：`gen1`（仅 Generation-1 有效）/ `gen2`（定义 Generation-2）/ `cross-generation`（跨代继续有效）。具体决策见 ADR-0019。
- **ADR 文件按稳定 ID 引用**（如 `(ADR-0007)`、`ADR-0019`），不按路径引用——路径可能变化，ID 永久不变（ADR-0018 § 决策 3）。

## ADR 修订与演进（不能改写历史）

ADR 生命周期支持 `Proposed / Accepted / Superseded / Deprecated`，被取代后永久保留。修订一个 Accepted ADR 时按以下判定：

```text
Accepted ADR
  ↓
发现问题
  ↓
只是说明不清（typo / 措辞澄清 / 补充例子 / 补引用）？
  ├─ 是 → 直接修改原 ADR（不改变原决策语义）
  └─ 否
      ↓
   决策语义发生变化（约束 / 方向 / 边界 / 行为）
      ↓
   新建 ADR，或在原 ADR 中明确追加「后续修正」
      ↓
   原 ADR → Superseded（完全取代）或 Deprecated（不再推荐 / 逐步退出）
      ↓
   Roadmap / Plan / Research projections 跟随更新
```

- **澄清**（typo、措辞、例子、引用，不改变决策语义）→ 可直接修改原 ADR。
- **语义变化**（改变约束 / 方向 / 边界 / 行为）→ 不得静默重写原 ADR；走新 ADR 或原 ADR 内显式「后续修正」，并把旧决策标记为 `Superseded` 或 `Deprecated`。
- **历史原文与「当时为什么这么决定」必须保留**，以便追溯决策演进。

> **ADR 可以演进，但不能改写历史。**

规范示例：ADR-0016 原设计多类 archive，后因生命周期语义冲突追加「后续修正（2026-09-09）」，明确只有 Plan 物理归档，原正文保留为历史记录——这是「显式后续修正」的正确形态。

状态：Proposed / Accepted / Superseded / Deprecated。
