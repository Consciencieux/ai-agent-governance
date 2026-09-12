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

## 当前状态：Generation 1

当前稳定版本属于 **Generation-1 Document-Centric Governance**。

它已经具备较完整的治理能力，包括：

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

## Generation 2 开发阶段

Roadmap 不独立定义或裁决 phase order；它只镜像/索引 ADR-0018 的当前 projection（下表即该 projection，非新裁决）。每个 Phase 由对应 `PLAN-xxxx` 在 Accepted ADR 约束下执行。

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

**当前阶段：下一入口 Phase 6（5c = [PLAN-0040](../PLAN-0040-capability-physical-projection.md) Implemented）。** 稳定产品仍是 Generation 1（`main` / 1.x）。本分支已完成 Phase 0–4、5a、5b、5c（P0–P2）。Plan archive ≠ Release（ADR-0016）；Migration Mode 下 Phase 完成 ≠ SemVer / skill-release（ADR-0014）。

## 现在 → 2.0（索引）

Roadmap 只列顺序与车辆，不复制 Plan 步骤 / Affected Files / 验收命令。权威：ADR-0018（阶段）· 各 PLAN（施工）· ADR-0020 / PLAN-0037（skill 提炼边界）。

### 已完成（checkpoint）

| Phase | 车辆 | 状态 |
| --- | --- | --- |
| 0 | ADR-0014 Migration Mode | 已启用（gate 观测化；Safety Kernel 阻断） |
| 1 | [PLAN-0031](../archive/PLAN-0031-producer-product-governance-separation.md) | Archived |
| 2 | [PLAN-0032](../archive/PLAN-0032-documentation-knowledge-architecture-closure.md) · [PLAN-0033](../archive/PLAN-0033-known-issue-closure.md) | Archived |
| 3 | [PLAN-0034](../archive/PLAN-0034-governance-core-rule-model.md) · ADR-0023 | Archived；baseline `24021c4` |
| 4 | [PLAN-0035](../PLAN-0035-checker-primitive-restructuring.md) · [PLAN-0036](../PLAN-0036-payload-discovery-ledger.md) | Implemented / EXITED |

### 下一步（必须按此序；不跳过审查）

| 步 | 内容 | 车辆 | 一句话 |
| --- | --- | --- | --- |
| **现在** | Phase 6 不变量测试 | *（计划待立 / PLAN-0040 successor）* | 正负 oracle；5c = PLAN-0040 Implemented |
| 5b | Context Detector / Dispatcher | [PLAN-0039](../PLAN-0039-context-detector-dispatcher.md)（**Implemented**） | 消费 5a 映射；禁止另造适用关系、禁止全自动 LLM 路由、禁止无路由搬家 |
| 5c | 按 Capability 物理投影 | [PLAN-0040](../PLAN-0040-capability-physical-projection.md)（**Implemented**） | 只改 AuthorityRef；不按 1.0 目录骨架；见 call-topology § 物理拓扑 |
| 6 | Invariant-based Testing | 后续 Plan | 每条重要 Control：positive + negative oracle |
| 7 | Review 三类拆分 | 后续 Plan | Implementation / System / Research |
| 8 | 重建 mandatory gates | 后续 Plan | 阻断权威交到新 control plane |
| **2.0** | 本仓 Gen2 skill 发布 | `repo-workflows/skill-release.md` | **仅 Phase 8 后**；checkpoint ≠ Release |

[PLAN-0037](../PLAN-0037-governance-skill-extraction.md) **冻结在 Design**（不是 Archived）。全文 Stage A–D **不是** 2.0 必达项；2.0 产品 = 本仓 INSTALLED Gen2 skill。过滤边界仍约束迁移期载荷。解冻：2.0 发布之后。

Phase 5 内部顺序（索引自 PLAN-0035 / `call-topology.md`，非新裁决）：**5a** 显式映射 → 薄入口 → **5b** Dispatcher（PLAN-0039）→ **5c** 按 Capability 投影物理文件（只改 `AuthorityRef`；5b EXIT 后另开 Plan）。Gen1 无真正 Task→Capability 图；5c **不**按 1.0 目录骨架细切，**不**另造查找架构。纪律：`docs/research/working/routing/call-topology.md` § 物理拓扑。

### 故意延后（不挡 Phase 5 开工）

剩余 consistency clusters · principles-index #9 SKIP · Discovery Ledger L2 · 独立 machine-readable Control 文件 · **5c 剩余 Capability 叶 / 可选 rename** · **lifecycle 残留抽出 / `state.json` phase 降为 facet**（概念闭包：[FINDING-0029](../../findings/FINDING-0029-lifecycle-name-concept-drift.md)；不另开「推翻 lifecycle」阶段）· **脚本 disposition 后续**（dogfood / retire 隔离；L0 台账 = [PLAN-0041](../PLAN-0041-script-inventory.md) Implemented — **禁止**按 `v1.0.2` 日期整夹进阁楼）· **PLAN-0037 全文提炼（2.0 后解冻）**。


### 本仓 vs 2.0 产品

- **本仓**：实验场 + 参考实现 + 科研回溯（[RESEARCH-0013](../../research/RESEARCH-0013-research-provenance-and-context-economy.md)）。
- **2.0 skill**：本仓 INSTALLED Gen2 载荷（portable 语义随迁移写入，不是 PLAN-0037 另开通用包）。

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
- Migration Mode 期间不以正式 Release（SemVer / tag / skill-release）标记 Phase 完成（见 ADR-0014）

## Success Criteria

Generation 2 成功不以「新增多少能力」为主要标准。

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
P0–P4  checkpoint EXITED
P5a    Task→Capability map — EXITED（PLAN-0038）
P5b    Dispatcher — EXITED（PLAN-0039）
P5c    Physical projection by Capability — **done**（PLAN-0040 Implemented）
P6     Invariant-based Testing — **current**（计划待立）
P6 Invariant-based Testing
P7 Review System redesign
P8 Rebuild mandatory gates
        ↓
2.0 skill-release（本仓 Gen2 载荷）
        ↓
PLAN-0037  跨项目 portable 提炼（冻结至 2.0 后；非 Archived）
        ↓
Generation 2 — Policy-Driven Governance Control Plane + reusable method
```
