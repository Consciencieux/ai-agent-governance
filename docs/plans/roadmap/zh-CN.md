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

## Generation 2 开发阶段

### Phase 0 — Architecture Migration Mode

目的：

> 为 Generation-1 → Generation-2 的架构迁移建立安全但不过度阻碍重构的开发环境。

迁移期间：

- Generation-1 大部分 gate 降级为观察性证据
- 不再扩展旧 checker / policy 体系，除非涉及安全、数据损失或 release corruption
- 使用 targeted validation 与 architecture checkpoint
- 保留最小 Refactor Safety Kernel
- 禁止正式发布不完整的 2.0 架构
- `main` 保持 1.x stable baseline
- 破坏性重构在 `migration/2.0-governance-architecture` 上进行

退出条件：

- 新控制架构具备可执行基线
- 关键 Generation-1 regressions 已迁移
- 新 release path 可以独立证明完整性

### Phase 1 — Producer / Product Governance Separation

这是 Generation 2 的第一项核心架构工作。

目标：

```text
Governance Core
      │
 ┌────┴────┐
 ▼         ▼
Repo       Skill
Profile    Profile
```

重点解决：

- repo governance 与 skill governance ownership
- 清理模糊的 `scope = both`
- 共享语义与具体实现分离
- shared control 明确消费者
- repo-only 与 skill-only control 独立
- cross-profile contract tests

原则：

> Shared semantics does not imply shared implementation.

产品代码可以成为测试对象，但本仓库关键治理不能完全依赖正在被修改的 working-tree 产品实现。

### Phase 2 — Governance Core

建立中立的 Governance Core。

Core 负责：

- control identity
- control schema
- evaluator contracts
- evidence semantics
- decision semantics
- shared primitives
- profile contracts

Core 不直接决定某个规则是否属于 repo 或 skill。

Profile 决定：

- applicability
- implementation
- enforcement boundary
- runtime adapter
- profile-specific policy

### Phase 3 — Rule / Control Registry

把治理执行语义从 Markdown 中抽离为 machine-readable controls。

最小控制模型需要明确区分：

```text
Applicability
Evaluator Type
Mechanism
Effect
Enforcement Boundary
```

Evaluator 类型包括：

```text
mechanical
heuristic
review
guidance
```

Decision effect 包括：

```text
allow
deny
warn
require-review
observe
```

二者不能混为同一维度。

Markdown 继续承担：

- rationale
- explanation
- examples
- human-readable policy

但不再作为唯一执行事实源。

### Phase 4 — Checker Primitives 与 Evidence Model

不删除成熟 checker，而是重新定位。

现有 checker 中稳定、可靠的能力应逐渐抽象为 reusable primitives，例如：

```text
required-file
forbidden-pattern
structured-value
cross-file-equality
projection-sync
command-result
negative-oracle
package-boundary
```

每个执行结果产生结构化 Evidence，而不是仅剩：

```text
exit 0
exit 1
```

Evidence 应能够回答：

- 哪个 control 被执行
- 为什么适用
- 使用了什么 mechanism
- 检查了什么对象
- 得到什么结果
- 哪个 boundary 使用了该结果

### Phase 5 — Context Detector 与 Dispatcher

这是 Generation 2 控制平面的核心执行层。

目标：

```text
Event / Change Context
        ↓
Context Detector
        ↓
Applicable Controls
        ↓
Dispatcher
        ↓
Minimal Required Mechanisms
```

系统应逐渐从：

```text
Agent chooses npm command
```

迁移到：

```text
System resolves required controls
```

Dispatcher 应支持：

- file / path impact
- control ownership
- profile
- lifecycle event
- release context
- explicit task context

并以最小充分验证为目标，而不是默认全量执行。

### Phase 6 — Invariant-Centric Testing

测试体系从 suite 数量转向 control protection。

重要 mechanical control 应具备：

```text
positive oracle
+
negative oracle
```

核心指标逐步转向：

- declared control count
- executable carrier coverage
- negative oracle coverage
- trigger coverage
- blocking boundary coverage
- false positive rate
- false negative rate

测试数量本身不再作为治理成熟度代理指标。

### Phase 7 — Review Architecture

现有 review-manager 保留并重新定位为：

**Implementation Review**，关注：

- logic bug
- test weakness
- security
- regression
- fixture realism
- checker correctness
- documentation inconsistency

同时增加：

**System Review**，关注：

- responsibility boundaries
- control topology
- duplication
- architecture coherence
- trigger / enforcement gaps
- governance complexity
- producer / product coupling

以及：

**Research Review**，关注：

- hypotheses
- measurements
- experimental validity
- false positive / false negative
- attention dependence
- long-term effectiveness

系统性 review 默认：

```text
Find
→ Collect Evidence
→ Classify
→ Search Siblings
→ Determine Root Cause
→ THEN Remediate
```

避免直接把所有问题降级为局部 patch。

### Phase 8 — Runtime Adapters

Repository-level governance core 必须保持工具中立。

运行时 hard enforcement 通过 adapter 层实现：

```text
Portable Governance Core
        ↓
Adapter Protocol
        ↓
Codex
Claude Code
Cursor
opencode
Other runtimes
```

可能支持：

```text
before_write
before_shell
before_commit
before_release
```

但 runtime-specific enforcement 不得污染 portable core。

不同运行时可以提供不同 guarantee level。

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
Generation 1
Document-Centric Governance
        ↓
Architecture Migration
        ↓
Producer / Product Separation
        ↓
Governance Core
        ↓
Control Registry
        ↓
Evidence + Primitives
        ↓
Context Detector + Dispatcher
        ↓
Invariant-Centric Validation
        ↓
Review Architecture
        ↓
Runtime Adapters
        ↓
Generation 2
Policy-Driven Governance Control Plane
```
