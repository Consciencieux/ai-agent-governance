# Findings 档案（Issue / Finding Archive）

本目录是本仓库的 **Issue / Finding Archive**：长期保存研究观察、缺陷证据、失败模式与治理缺口。它回答的是「**实际发现了什么**」，与 `plans/`（准备做什么）、`design-decisions/`（为什么做这个架构决定）严格分工。

| 类型 | 回答的问题 | 语言 | 生命周期 |
| --- | --- | --- | --- |
| Plan | 准备怎么做？ | Active 三语 | Active → Archive |
| Finding | 实际发现了什么？ | 简体中文单语 | 状态变化，路径不变 |
| ADR | 为什么做这个架构决定？ | 简体中文单语 | 永久记录 |
| Archived Plan | 最后实际完成了什么？ | 简体中文单语 | 冻结历史 |

## 定位与分工

```text
Finding = 知识（发现了什么、证据、根因、为什么值得处理）
GitHub Issue = 协作对象（讨论、open/closed 状态）
Plan = 工作设计（怎么解决、涉及哪些文件、实施顺序）
ADR = 决策（对长期架构做出了什么决定）
```

**repo 内 Finding 是 canonical research record；GitHub Issue 是 collaboration projection。** 两者不是双向镜像：GitHub Issue 可以有大量讨论，本目录只保存稳定的信息（观察、证据、根因、解决、回归保护）。**不要把 GitHub Issue 全文同步进来**——那会立刻制造 Declaration ↔ Projection drift。

## 目录结构

```text
docs/findings/
├── README.md                     # 本页：taxonomy、schema、生命周期、语言政策
└── FINDING-xxxx-<slug>.md        # 每条一个文件，按状态变化更新，不移动路径
```

文件名用英文 ASCII slug（`FINDING-0001-producer-product-governance-coupling.md`），正文用简体中文；代码、命令、错误日志和专有术语保持原文。

**编号规则**：`FINDING-xxxx` 独立编号，新对象 = 该类型现有 max(编号)+1，**永久不复用、不重排**（统一规则见 ADR-0018 § 决策 3）。

**不建立 `active/` / `archive/` 子目录，也不归档到 `docs/plans/archive/`。** Finding 本身就是长期 evidence record，即使问题修复后仍留在原处，只更新状态字段。

**代际标记用 `observed_in` / `resolved_in`，不用单值 `generation`。** 一个 Finding 可能在 Gen1 被发现、Gen2 仍未解决——`generation: gen1` 容易被误读成「它只属于 Gen1」。`observed_in`（何时发现）与 `resolved_in`（何时解决，未解决留空）分别表达这两个时间点。`Resolved` / `Superseded` / `Invalidated` 都只在文件内更新状态，永久留原位。

## Taxonomy：研究方向（7 方向）

Finding 按**研究对象和根因**分类，不按脚本/域分类——避免 `docs/findings/` 退化成零散 bug 堆。

| 方向 | 主题 | 核心 Finding |
| --- | --- | --- |
| **A. Producer / Product Separation** | 仓库治理与 Skill 产品治理的隔离 | A01 逻辑耦合 · A02 ADR-0006 只解决 artifact-level · A03 control-level 隐性狗粮 · A04 repo 修复不传播到 skill · A05 `scope = both` 模糊 ownership |
| **B. Policy / Control Plane** | 规则模型与执行控制平面 | B01 缺统一治理执行架构 · B02 document-centric · B03 AI 注意力当 trigger · B04 缺 Rule Registry · B05 npm scripts 充当 dispatcher |
| **C. Enforcement Gap** | 声明与执行强度脱节 | C01 MUST ≠ deny · C02 复杂语义规则无 carrier · C03 prompt 是 guidance 非 control · C04 enforcement semantics 未统一 · C05 enforcement boundary 未定义 |
| **D. Validation / Dispatch Efficiency** | 验证调度效率 | D01 简单过重复杂不足 · D02 scope tiering 仍跑 full suite · D03 无自动 impact routing · D04 本地靠 AI / CI 太粗 |
| **E. Checker Correctness / Regression** | checker 正确性与回归保证 | E01 vacuous pass · E02 fix 无 negative oracle · E03 测试数量误导 · E04 meta-checker monolith · E05 GitLab 多栈模板缺陷 · E06 ADR status false positive |
| **F. Portability / Runtime Boundary** | 可移植性与运行时边界 | F01 hooks 非 hard boundary · F02 lock 非原子 · F03 portability vs runtime enforcement 冲突 · F04 portable core 与 adapter 分层 |
| **G. Evidence / Research Methodology** | 证据模型与科研方法 | G01 evidence 依赖 Agent 自述 · G02 缺 traceability · G03 缺 zero-attention model · G04 缺测量框架 · G05 治理自身膨胀 |

## Taxonomy：层级与 Finding Type（L0–L4）

Finding 用 `type` 字段绑定抽象层级（这也是 review 时的分类轴）。3 层模型是粗粒度视角，L0–L4 是精细分类；`type` 直接取 L0–L4 的枚举值。

```text
L0 — defect               具体实现错误            例：错误 regex / GitLab Go template executes npm
L1 — mechanism-gap        某机制不完整            例：没有 negative oracle
L2 — control-gap          Rule→Trigger→Evidence→Block 链不完整  例：Agent 必须自己启动 gate
L3 — architecture-gap     责任边界或核心模型有问题  例：repo/product governance coupling
L4 — research-observation 关于治理有效性的可实验假设 例：static prompt vs dynamic injection
```

**提升规则（比增加 checklist 更有效）**：如果一个 L0 bug 在多个 subsystem/profile 出现，必须向上检查是否存在 L1/L2/L3 finding。recurrent defect 必须追溯 systemic finding，或显式声明「无系统性根因」。

**review 先分类再修复**：Full/System Audit 默认 `review is read-only until findings are classified`——Find → Collect evidence → Classify abstraction level → Search sibling/systemic instances → Determine root cause → THEN decide remediation（见 FINDING-0014）。

**系统性发现必须升级为 finding**：任何发现的系统性问题，不应直接关闭为 patch。先判断：这是独立 bug，还是系统性 failure mode 的实例？若是后者，必须先落 finding（按 type 分层），再决定 patch vs 架构变更。例：`GitLab template 使用 npm` 是 defect；「所有 stack template 都没有 contract model」是 mechanism/architecture-gap，须升级为 finding 进入架构规划。否则会「一直修微观问题，把项目变成精致的狗屎」。

## 根因树（R1–R5）

```text
R1 Policy Structure          policy 未充分结构化
R2 Trigger                   trigger 非系统控制
R3 Validation Routing        validation 非 invariant/impact 驱动
R4 Enforcement Boundary      enforcement boundary 不明确
R5 Producer/Product Isolation producer 与 product 治理缺乏显式隔离与共享契约所有权
```

后续具体 findings 都挂到这五棵树下；每条 Finding 在 frontmatter 用 `root_cause` 声明归属。**R5 应优先处理**：producer/product ownership 未分清前，设计 Rule Registry / Dispatcher 时容易把当前 `repo / skill / both` 的混乱直接编码进新架构。

## Frontmatter schema

```yaml
---
id: FINDING-0001
status: Confirmed               # Proposed / Confirmed / Resolved / Superseded / Invalidated
type: architecture-gap          # L0–L4：defect / mechanism-gap / control-gap / architecture-gap / research-observation
direction: A                    # A–G（见 taxonomy）
root_cause: R5                  # R1–R5（见根因树）
severity: Critical              # Critical / High / Medium / Low（与 status 分离：曾是 Critical 问题，现已 Resolved 完全合理）
affected:
  - repo                        # 影响域：repo（本仓库治理） / skill（载荷/被治理项目）
  - skill
github_issue: 7                 # 关联 GitHub issue 编号（collaboration projection）
opened: 2026-09-08              # 创建日期
updated: 2026-09-08             # 最近一次状态/内容更新日期
observed_in: gen1               # 发现该 finding 的架构时代（gen1 / gen2）
resolved_in:                    # 解决的架构时代（未解决留空）
resolved:                       # Resolved 时填写
related:
  plans: []                     # 关联计划（按名称，不用路径）
  adrs: []                      # 关联 ADR（如 ADR-0015）
  issues: []                    # 关联 GitHub issue（如 "#123"）
---
```

## 正文结构

```markdown
# 标题

## 观察 Observation

发生了什么。

## 证据 Evidence

怎么证明（命令输出、gate 结果、测量数据）。层级发现可在此列证据子项。

## 根因 Root cause

当前已知根因。

## 影响 Impact

影响哪些 control / profile / release。

## 关闭条件 Resolution criteria

满足什么条件才允许标记 Resolved。

## 解决 Resolution

解决后填写（关联 plan / ADR / release）。

## 回归保护 Regression protection

哪个 negative oracle / contract test 防止再次发生。
```

## Defect 的两种处理方式

具体缺陷（bug / false positive / typo）有两种归属，避免 `findings/` 退化成「一个 bug 一个 finding」：

1. **作为 Evidence**：如果只是支撑某个更大的研究结论，就作为一级 finding 的证据子项，不单独建文件。
2. **单独建文件**：如果问题本身值得长期独立追踪（明确产品 bug、独立生命周期），则单独建 `FINDING-xxxx-<slug>.md`。

判断标准：`这个问题独立追踪比挂在一个大 finding 下更有价值吗？` 是 → 单独建；否 → 作为 Evidence。

## 生命周期（状态机）

**不用 Open / Closed。** Issue 回答「我要不要做这件事？」；Finding 回答「这个事实是否存在？」。即使问题已解决，finding 仍是重要历史记录——`Closed` 会产生「知识消失」的错误语义。

状态在文件内更新，路径永不移动：

```text
             ┌─────────────┐
             │  Proposed   │
             └──────┬──────┘
                    │ evidence added
                    ▼
             ┌─────────────┐
             │  Confirmed  │
             └──────┬──────┘
                    │ fix + validation
                    ▼
             ┌─────────────┐
             │  Resolved   │
             └─────────────┘

Confirmed
    │  replaced by better model
    ▼
Superseded

Confirmed
    │  evidence disproves
    ▼
Invalidated
```

| 状态 | 含义 |
| --- | --- |
| `Proposed` | 初步观察，尚未确认是否是真问题 |
| `Confirmed` | 已有证据证明问题存在 |
| `Resolved` | 已经采取措施解决，并有验证证据 |
| `Superseded` | 问题描述或方案被新的 finding/ADR 替代 |
| `Invalidated` | 后续证明原始判断错误 |

限制：

- **`Resolved` 不删除文件**。
- **`Superseded` 不删除旧 finding**。
- **`Invalidated` 也保留**——错误判断本身有研究价值。

Resolved finding ≠ archived finding。修复后它仍要回答：当时发现了什么？怎么复现？根因？后来怎么解决？哪个 regression test 保护？关联哪个 ADR / Plan / Issue？

## 关联方式（引用，不复制）

```text
Finding → Related Issue: #5   → Related Plan: TASK-0042 → Related ADR: ADR-0015
```

Plan 侧写 `Related Findings: [FINDING-0012, FINDING-0015]`。不要在两处复制同一份内容。

研究链：`Observation → Finding → Decision/Plan → Implementation → Regression protection → Resolution`

## 语言政策

> **Active operational knowledge 可以多语言；historical/research evidence 使用单一 canonical language。**

当前 canonical language 是简体中文。本目录属于后者，从创建开始就是简体中文单语，不进入三语树，不参与 parity / freshness 检查——避免重新制造 translation sync / parity / freshness / review 成本。

## 未来科研指标（数据源）

从本目录可自动统计：

```text
Total governance findings
Mechanical gaps
Trigger gaps
False positives / False negatives
Cross-profile defects (affected 含 repo+skill)
Vacuous passes
Attention failures
Median time-to-resolution
Regression-protected %
```
