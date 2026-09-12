# Roadmap

[English](en.md) · [简体中文](zh-CN.md) · [繁體中文](zh-TW.md)

## 愿景

AI Agent Governance 的目标不是为 AI 编码 Agent 堆积更多提示词、规则文档和检查脚本，而是建立一套：

- 仓库原生
- 工具中立
- 可验证
- 可追踪
- 可渐进采用
- 可扩展到不同 Agent runtime

的治理框架。

长期目标是让治理从：

```text
文档声明
    ↓
Agent 阅读并记住
    ↓
Agent 自行判断适用规则
    ↓
Agent 自行选择检查命令
    ↓
脚本返回 exit code
```

演进为：

```text
Machine-readable Controls
        ↓
Context Detection
        ↓
Applicability Resolution
        ↓
Dispatcher
        ↓
Evaluator / Mechanism
        ↓
Evidence
        ↓
Decision
        ↓
Explicit Enforcement Boundary
```

治理系统应尽可能减少对 Agent 注意力、记忆和自觉性的依赖。

## 当前状态：v2.0.0（Generation 2 必装切片）

当前产品是 **`v2.0.0`**：可安装、可在干净目标上直接使用的 INSTALLED 必装切片。CI 阻断权威是 `npm run check:must-ship`。Migration Mode 已退出；`main` 就是 2.0 产品线。权威：[ADR-0024](../../design-decisions/ADR-0024-gen2-product-freeze.md) · [ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md)。

这 **不是**「Generation-1 限制已消失」。2.0 把已验证的控制面接到可发布 skill 上；底层仍大量是文档 + 脚本 + WRAP 后的 checker。Generation 1 的六条限制仍描述剩余架构债，只是不再挡住已发布的必装面。

Generation 1（1.x）仍是历史基线，具备：

- INIT / AUDIT / RELEASE 生命周期
- 确定性治理生成器
- 治理文件与状态管理
- Git / release policy
- secret scanning
- sync checking
- documentation consistency
- release management
- plan delivery verification
- review-manager
- 多语言产品文档
- regression test suites
- repo / payload 物理分发边界

Generation 1 已证明：

> AI 编码治理可以通过仓库内文档、脚本、测试、CI 与 release workflow 获得比纯 Prompt 更强的约束能力。

但当前架构仍以：

```text
Markdown / SKILL / AGENTS
        +
npm scripts
        +
independent checkers
```

为主要控制方式。

其机械能力已经明显超过最初设计模型能够清晰表达和调度的范围。

## Generation 1 的主要限制

已知限制引用自 `docs/findings/`（FINDING-0001..0019），此处不复述；Roadmap 只保留影响长期方向的结论。

具体证据、缺陷和研究记录由 `docs/findings/` 与 `docs/research/` 管理；Roadmap 只保留影响长期方向的结论。

### 1. Producer Governance 与 Product Governance 边界不清

本仓库自身的治理与分发给用户的 Skill Governance 已经在物理分发层面分离，但在治理语义、checker ownership 和 shared rules 上仍存在隐式耦合。

当前部分规则仍表现为：

```text
repo
skill
both
```

这种模型无法清楚回答：

- 谁拥有规则语义
- 谁负责执行
- 哪些实现必须同步
- 哪些控制只属于仓库
- 哪些控制属于被治理项目

这是 Generation 2 的首要架构问题。

### 2. Policy Declaration 与 Enforcement 分离

大量规则仍主要存在于 Markdown、SKILL、AGENTS 或 policy 文档中。

系统通常依赖 Agent：

1. 阅读规则
2. 判断规则是否适用
3. 记住需要执行什么
4. 选择正确 gate
5. 正确解释结果

因此：

```text
MUST
```

并不天然意味着：

```text
deny
```

声明强度与实际 enforcement strength 尚未形成统一模型。

### 3. Trigger 依赖 Agent 注意力

本地治理通常仍是：

```text
Agent
  ↓
决定是否运行检查
```

而不是：

```text
Context
  ↓
系统自动确定 applicable controls
```

这意味着部分治理保证依赖 Agent 的注意力与上下文完整性。

### 4. Validation Routing 不够精确

当前已经存在不同 gate scope，但整体仍以 npm script / suite 为中心。

系统尚不能稳定从：

```text
change impact
```

推导：

```text
minimal required controls
```

因此可能出现：

- 简单变更执行过多验证
- 复杂变更遗漏真正相关的控制
- CI 运行范围过粗
- 本地验证范围依赖 Agent 判断

### 5. Checker 与测试仍以历史缺陷驱动增长

Generation 1 中大量可靠性来自：

```text
incident
→ patch
→ checker
→ regression test
```

这种方式非常适合保护已知缺陷，但长期容易造成：

- checker 增殖
- regex / structural heuristic 堆积
- governance machinery 自身复杂化
- 绿色测试数量与真实控制成熟度脱节

Generation 2 需要从 checker-centric 转向 control / invariant-centric。

### 6. Enforcement Boundary 尚未统一

当前治理强度分布在：

```text
Prompt
Git hooks
local scripts
CI
release workflow
human approval
```

这些机制的阻断能力不同，但尚未被统一描述。

尤其：

- Git hook 可绕过
- CI 只能在提交后阻断
- Prompt 只是 guidance
- runtime interception 依赖具体 Agent 工具

因此未来必须明确：

```text
规则在哪个 boundary 上生效？
```

## Generation 2 目标架构

Generation 2 的目标不是重写所有现有机制，而是给现有成熟能力建立统一控制平面。

目标模型：

```text
Governance Core
│
├── Control / Rule Model
├── Applicability Model
├── Evidence Model
├── Decision Semantics
├── Shared Primitives
└── Contracts
        │
        ├───────────────┐
        ▼               ▼
Repo Governance      Skill Governance
Profile              Profile
        │               │
        └───────┬───────┘
                ▼
          Context Detector
                ↓
            Dispatcher
                ↓
      ┌─────────┼──────────┐
      ▼         ▼          ▼
 Mechanical  Heuristic   Review
 Evaluator   Evaluator   Evaluator
      └─────────┬──────────┘
                ↓
             Evidence
                ↓
             Decision
                ↓
 allow / deny / warn / require-review
```

> 注：上图 Governance Core 组成（Control / Rule Model、Applicability Model、Evidence Model、Decision Semantics、Shared Primitives、Contracts）是**目标架构示意**，不是 Phase 3 schema 决策；确切归属（Core vs profile）与 machine-readable schema 由 Phase 3 决定（ADR-0018 Phase 边界纪律；ADR-0020）。

## Generation 2 开发阶段（迁移路径，已关闭）

Roadmap 不独立定义或裁决 phase order。下表镜像 ADR-0018 的 **已关闭** 迁移 projection。2.x 工作带镜像 [ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md)，见后文。

| Phase | 名称（ADR-0018） | 一句话成果 |
| --- | --- | --- |
| 0 | Architecture Migration Mode | 安全而不阻塞的重构环境（gate 观测化、Safety Kernel 阻断） |
| 1 | Producer / Product Separation | repo/skill ownership 边界明确，`scope = both` 架构性退役（残留保留，FINDING-0001） |
| 2 | Research / Findings / Traceability | 系统模型 → 观察到的问题 → 溯源闭环 |
| 3 | Governance Core / Rule Model | shared semantics, separate profiles |
| 4 | Checker / Primitive restructuring | 成熟 checker → 可复用 primitive + evidence |
| 5 | Dispatcher | context detection → applicability → mechanical / heuristic / review |
| 6 | Invariant-based Testing | 每个 control 有 positive + negative oracle |
| 7 | Review System redesign | Implementation / System / Research 三类 review |
| 8 | Rebuild mandatory gates | 在新 control plane 上重建阻断权威 |

权威：ADR-0018（`docs/design-decisions/ADR-0018-generation-2-dev-path.md`）。

**迁移阶段已关闭：** Phase 0–8 EXITED；**`v2.0.0` 已发布**（2026-09-12）。Plan archive ≠ Release（ADR-0016）。**当前工作带 = ADR-0025 H1**（[PLAN-0037](../PLAN-0037-governance-skill-extraction.md) **Active**）。H0（[PLAN-0045](../archive/PLAN-0045-post-2.0-doc-truth.md)）已归档。

## 2.0 已发布（索引）

Roadmap 只列顺序与施工计划，不复制 Plan 步骤 / Affected Files / 验收命令。迁移顺序权威：ADR-0018。2.x 顺序权威：ADR-0025。产品切片：ADR-0024。提炼边界：ADR-0020 / PLAN-0037。

### 已完成（checkpoint）

| Phase | 施工计划 | 状态 |
| --- | --- | --- |
| 0 | ADR-0014 Migration Mode | **已退出**（2026-09-12）；CI 阻断 = `check:must-ship` |
| 1 | [PLAN-0031](../archive/PLAN-0031-producer-product-governance-separation.md) | Archived |
| 2 | [PLAN-0032](../archive/PLAN-0032-documentation-knowledge-architecture-closure.md) · [PLAN-0033](../archive/PLAN-0033-known-issue-closure.md) | Archived |
| 3 | [PLAN-0034](../archive/PLAN-0034-governance-core-rule-model.md) · ADR-0023 | Archived；baseline `24021c4` |
| 4 | [PLAN-0035](../archive/PLAN-0035-checker-primitive-restructuring.md) · [PLAN-0036](../archive/PLAN-0036-payload-discovery-ledger.md) | Implemented / EXITED |
| 5 | [PLAN-0038](../archive/PLAN-0038-task-capability-routing.md) · [PLAN-0039](../archive/PLAN-0039-context-detector-dispatcher.md) · [PLAN-0040](../archive/PLAN-0040-capability-physical-projection.md) | Implemented / EXITED（5a 图 · 5b resolve/CLI · 5c P0–P2 投影；leftover 延后） |
| 6 | [PLAN-0042](../archive/PLAN-0042-invariant-based-testing.md) | Implemented / EXITED（oracle 台账 + 路由负向 + 种子 CTRL；全量机械规则仍延后） |
| 7 | [PLAN-0043](../archive/PLAN-0043-review-system-redesign.md) | Implemented / EXITED（Impl must-ship；System/Research repo-keep；路由 N4） |

### 发布记录

| 项 | 状态 |
| --- | --- |
| 8 重建 mandatory gates | [PLAN-0044](../archive/PLAN-0044-rebuild-mandatory-gates.md) Implemented / EXITED |
| 2.0 skill-release | **已发布** `v2.0.0`（清单：[skill-release-2.0-checklist.md](../archive/skill-release-2.0-checklist.md) 历史） |

[PLAN-0037](../PLAN-0037-governance-skill-extraction.md) **已解冻为 Active**（2026-09-12）。过滤边界仍约束提炼产物：禁止把本仓目录 / CTRL 号 / Phase 剧本当 L1。

Phase 5 已 EXITED（索引自 PLAN-0035 / `call-topology.md`，非新裁决）：**5a** 显式映射 → **5b** Dispatcher → **5c** 按 Capability 投影（只改 `AuthorityRef`）。残留叶 / 可选 rename **不**重开 Phase 5。纪律：`docs/research/working/routing/call-topology.md` § 物理拓扑。

## 2.x 工作带（索引 ADR-0025）

Roadmap 不裁决顺序。成员来自 ADR-0024 `later`；顺序来自 ADR-0025。施工只走 Active Plan。

| 带 | 一句话 | 施工 | 状态 |
| --- | --- | --- | --- |
| **H0** 文档与生命周期对账 | 入口/路线图/计划位置与 `v2.0.0` 对齐 | [PLAN-0045](../archive/PLAN-0045-post-2.0-doc-truth.md) | **Archived**（九份 Phase 4–8 计划已归档） |
| **H1** 可复用治理 Skill 提炼 | L1/L2/L3 提取协议 → 干净目标验证 | [PLAN-0037](../PLAN-0037-governance-skill-extraction.md) | **Active** |
| **H2** 控制面补完 | 残留抽出 → 检查器/台账 → 机器 Control / CONTROL-X → 载荷调度与可移植性 | 另开 Plan；输入见下表 | 未开工 |
| **H3** 运行时与科研 | L3、测量、注意力实验；不挡 2.1 | 无 Active Plan | 远 |

### H0 已完成

已归档 PLAN-0035 / 0036 / 0038–0044 与 PLAN-0045；`mode-exit-proposal` / `skill-release-2.0-checklist` 移入 `docs/plans/archive/`。`docs/plans/` 当前施工计划仅 [PLAN-0037](../PLAN-0037-governance-skill-extraction.md)。

### H2 输入（按子带；不挡已发布的 2.0）

| 子带 | 索引（Finding / 残留，非施工步骤） |
| --- | --- |
| H2a 残留抽出 | 5c leftover Capability 叶 · [FINDING-0029](../../findings/FINDING-0029-lifecycle-name-concept-drift.md) · [FINDING-0028](../../findings/FINDING-0028-script-generation-disposition-gap.md)（L0 台账 = [PLAN-0041](../archive/PLAN-0041-script-inventory.md)） |
| H2b 检查器与台账 | 剩余 consistency clusters · principles-index #9 · [FINDING-0011](../../findings/FINDING-0011-adr-status-false-positive.md) · [FINDING-0019](../../findings/FINDING-0019-check-doc-consistency-meta-checker-monolith.md) · [FINDING-0021](../../findings/FINDING-0021-roadmap-checker-vacuous.md) · Discovery Ledger L2 · [FINDING-0022](../../findings/FINDING-0022-recursive-discovery-workset-gap.md) · [FINDING-0024](../../findings/FINDING-0024-metadata-projection-drift.md) · ADR-0016 parser 迁移 |
| H2c 跨 profile / 机器 Control | [FINDING-0001](../../findings/FINDING-0001-producer-product-governance-coupling.md) CONTROL-X · [FINDING-0002](../../findings/FINDING-0002-missing-governance-control-plane.md) · [FINDING-0025](../../findings/FINDING-0025-governance-sync-mapping-gap.md) · [FINDING-0026](../../findings/FINDING-0026-templates-instruction-source-mix.md) |
| H2d 载荷调度与可移植性 | [FINDING-0003](../../findings/FINDING-0003-declaration-enforcement-gap.md) 判断型 MUST · [FINDING-0004](../../findings/FINDING-0004-trigger-coverage-gap.md) · [FINDING-0005](../../findings/FINDING-0005-validation-routing-overhead.md) · [FINDING-0006](../../findings/FINDING-0006-regression-oracle-gap.md) 全量 oracle · [FINDING-0007](../../findings/FINDING-0007-portability-enforcement-boundary.md) adapter · [FINDING-0010](../../findings/FINDING-0010-gitlab-ci-stack-template-mismatch.md) · [FINDING-0012](../../findings/FINDING-0012-lock-not-atomic.md) · Git consent 机械 evaluator · MIGRATE 入口 · [FINDING-0014](../../findings/FINDING-0014-review-manager-layer-mismatch.md) L0–L4 工具 · [FINDING-0016](../../findings/FINDING-0016-canonical-example-not-constraint.md) · [FINDING-0017](../../findings/FINDING-0017-adr-no-continuous-enforcement.md) |

### H3 输入（远；不挡 2.1）

[FINDING-0008](../../findings/FINDING-0008-governance-measurement-gap.md) 测量 · [FINDING-0015](../../findings/FINDING-0015-static-prompt-attention-burden.md) 静态 vs 注入 · L3 运行时拦截 · 完整 `activity.jsonl`。

### 本仓 vs 2.x 产品

- **本仓**：实验场 + 参考实现 + 科研回溯（[RESEARCH-0013](../../research/RESEARCH-0013-research-provenance-and-context-economy.md)）。
- **已发布 skill（2.0）**：可安装必装切片，不是 PLAN-0037 另开通用包。
- **2.x 产品主线（H1）**：[PLAN-0037](../PLAN-0037-governance-skill-extraction.md) **Active** — 把已验证原则提炼为可复用 skill。

## Guarantee Levels

Generation 2 逐步明确治理保证等级：

```text
L0 — Guidance
     Agent-readable instruction

L1 — Repository Mechanical
     Repository checker can independently verify

L2 — Workflow Blocking
     CI / Git / release workflow can block progression

L3 — Runtime Interception
     Agent runtime can intercept the action before execution
```

任何治理能力都不应仅用「支持 / 不支持」描述，而应明确其 guarantee level。

## Research Direction

项目后续不仅评价「实现了多少功能」，还要研究治理机制是否真正有效。

重点研究问题包括：

### Zero-Attention Governance

如果 Agent 完全忘记治理规则：

> 哪些保证仍然成立？

任何被称为 mechanical guarantee 的能力都应该能回答这个问题。

### Static Prompt vs Dynamic Policy Injection

研究：

```text
静态上下文规则
vs
决策点动态注入
```

对以下指标的影响：

- attention failure
- token burden
- compliance
- task quality

### Full Validation vs Impact-Driven Validation

比较：

```text
full suite
vs
dispatcher-selected controls
```

在以下指标上的差异：

- runtime
- detection rate
- false negative
- developer latency

### Enforcement Strength

研究不同 boundary：

```text
Prompt
Hook
CI
Release
Runtime
```

在真实 Agent workflow 中提供的实际保证强度。

### Governance Operating Cost

治理成熟度必须同时衡量成本。

长期指标包括：

```text
Runtime cost
Token burden
Human review cost
Maintenance cost
False positive rate
False negative rate
Attention failure rate
```

## Non-goals

Generation 2 明确不追求：

- 不继续通过无限增加 Markdown policy 解决所有治理问题
- 不为每一个 incident 创建新的永久 checker
- 不把所有 judgment rule 强制机械化
- 不假设 green gate 等于语义正确
- 不追求所有 Agent runtime 完全相同
- 不把 tool-specific runtime 能力写入 portable core
- 不为目录、规则或抽象的形式对称性增加无实际价值的机制
- 不以测试数量、checker 数量或规则数量衡量成熟度
- 不让治理框架自身的复杂度增长成为默认方向
- 不为了保持 Generation-1 兼容而长期维护两套架构
- 不以正式 Release 标记已关闭的迁移 Phase 完成（ADR-0014 历史纪律；Mode 已退出）
- 不把 ADR-0024 `later` 扁平清单当作施工顺序（顺序权威 = ADR-0025）
- 不跳过 Stage A–D 一次抽象出 portable skill
- 不把本仓目录名 / CTRL 号 / Phase 剧本当 L1

## Success Criteria

Generation 2 成功不以「新增多少能力」为主要标准。2.0 门槛已在 `v2.0.0` 满足。下列长期标准 **不是** 每一次 2.x tag 的门槛；2.x 验收面由当时 Active Plan 写，默认不把 H3 / CONTROL-X / PLAN-0037 全文绑死（[ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md) 决策 8）。

更重要的是：

```text
Policy can be mechanically located.
Applicability can be systematically resolved.
Execution can be dispatched without relying on Agent memory.
Evidence can be independently inspected.
Enforcement strength can be explicitly stated.
Critical controls have negative oracles.
Repo and Skill governance ownership is explicit.
Validation cost scales with change impact.
Runtime-specific enforcement remains outside the portable core.
```

长期目标是：

> 用更少的 Agent 注意力、更少的治理机制和更清晰的执行边界，获得更强、更可解释、更可验证的治理保证。

## Roadmap 与其他知识对象的关系

Roadmap 只表达长期方向，不承担详细问题记录或执行计划。

```text
Research
   ↓ provides model

Findings
   ↓ identify observed gaps

ADR
   ↓ records architectural decisions

Roadmap
   ↓ defines long-term direction

Plan
   ↓ executes a bounded phase

Implementation
   ↓

Measurement / Regression
```

具体问题进入：

```text
docs/findings/
```

系统模型、实验和评价框架进入：

```text
docs/research/
```

长期设计决策进入：

```text
docs/design-decisions/
```

具体执行工作进入：

```text
docs/plans/
```

已完成执行计划进入：

```text
docs/plans/archive/
```

## Roadmap 维护规则

Roadmap 是当前长期方向的声明，不是不可修改的承诺。

在以下事件发生时重新评估：

- architecture generation transition
- major architecture finding
- major phase completion
- research evidence 推翻现有假设
- target architecture 发生实质变化

普通 patch、bug fix 或 release 不要求自动重排 Roadmap。

重大方向变化必须能够追溯到：

```text
Finding
Research
ADR
```

Roadmap 不保存详细历史执行记录，也不作为 CHANGELOG 使用。

旧路线如果具有研究价值，通过 Git history 或明确的 roadmap history snapshot 保留，而不是让当前 Roadmap 无限累积「已完成事项」。

## 当前长期方向

```text
Generation 1 — Document-Centric Governance
        ↓
  Generation 2 migration（ADR-0018 Phase 0–8）
        ↓
P0–P7  checkpoint EXITED
         P6 = PLAN-0042（oracle 台账 + 路由负向 + 种子 CTRL）
         P7 = PLAN-0043（Review 三类；Impl must-ship）
P8     Rebuild mandatory gates — EXITED（PLAN-0044）
        ↓
v2.0.0 skill-release — **已发布**（2026-09-12）
        ↓
H0     文档与生命周期对账 — EXITED / Archived（PLAN-0045）
        ↓
H1     PLAN-0037 跨项目 portable 提炼 — **current / Active**
        ↓
H2     控制面补完（ADR-0024 later 机械债）
        ↓
H3     运行时与科研（L3 / 测量；不挡 2.1）
        ↓
Generation 2 — Policy-Driven Governance Control Plane + reusable method
```
