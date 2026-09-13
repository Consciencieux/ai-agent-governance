---
id: PLAN-0037
status: Active
generation: gen2
target: both
---

# PLAN-0037：可复用治理 Skill 提炼（Governance Skill Extraction）

> **Status: Active**（2026-09-12 人类解冻。Gate 1–3 已满足；[ADR-0025](../design-decisions/ADR-0025-gen2x-product-path.md) H1 为当前产品主线。**禁止 Archived**，直至 Stage D 验证通过并 exit review。）

本文件是 **execution contract**：做什么、为何现在、依赖、阶段、验收、当前状态。Facts / Rationale / Pattern / L1–L3 候选 **不**写在这里——权威在 [RESEARCH-0014](../research/RESEARCH-0014-portable-governance-patterns.md)。

一句话：把已验证的 Gen2 治理原则提炼为可复用 skill，并划分 L1 invariant / L2 pattern / L3 project customization。权威边界见 ADR-0020。

## 目标

```text
本仓库（实验场 + 参考实现）
        ↓ 验证 Gen2（含 Phase 5 Task→Capability routing）
        ↓ 提炼不可变原则（L1）与推荐模式（L2）
        ↓ 形成可复用 governance skill
        ↓ 治理其他项目（L3 由目标项目定制）
```

## 为何需要

没有 extraction plan，容易把本仓实验实现写成「所有被治理项目必须如此」。本计划强制：**写死结构性约束，不写死项目实例**（目录名、编号、本仓迁移剧本属 L3）。

2.0 已发布的是 **本仓 INSTALLED Gen2 skill**；本计划提炼的是可复用原则包，不是复制本仓目录。

## 范围（In）

- Instruction architecture（thin entry · progressive disclosure · Context Economy）
- Document type boundaries（Research / Finding / ADR / Plan · Policy/Workflow/Template）
- Metadata governance（封闭 schema · budget）
- Canonical ownership（单事实单 owner）
- Capability-based organization
- Routing contract（Task → Capability → Authority → Execution → Verification）
- Discovery disposition 语义（可追踪 + disposition + closure；**不**强制本仓表列 schema）

## 非目标（Out）

```text
创建「万能 AI 治理 Skill」或通用治理平台
复制本仓 docs/ 树 / 全部 ADR·Finding·Research
硬编码本仓目录名、CTRL-NNNN、Phase 0–8 / PLAN-003x 剧本
实现自动治理系统 / 全自动 Dispatcher / 知识图谱
现在立刻改写 INSTALLED 载荷或新建平行 skill 包并发布
把未验证的 Phase 5 早期模型固化进 skill
清理 / 删除 / 整夹隔离 Gen1 脚本（ADR-0025 决策 9–10）
给 check-doc-consistency.js 加规则、例外或 flag（属 H2b）
把本仓 router 写入 INSTALLED 默认面（属 H2d）
把本仓 AGENTS.md / SKILL.md 瘦身当作本计划完成条件
新建「Gen1 能力 → 2.x 去向」权威表（消费 script-inventory，不另建 ledger）
把 Facts / L1–L3 目录写进本 Plan 正文（属 RESEARCH-0014；FINDING-0030）
```

## 前置条件

1. Phase 4 EXITED（PLAN-0035 / PLAN-0036）— **已满足**
2. Phase 5 Task→Capability routing 已验证 — **已满足**
3. 已退出 Migration Mode / `v2.0.0` 已发布 — **已满足**
4. ADR-0020 L1/L2/L3 分层仍为 Accepted — **仍成立**

```text
v2.0.0 已发布 · H0 归档完成
        ↓
本计划 Active — Stage A→D（ADR-0025 H1）
        ↓
跨项目 portable skill 验证（干净目标）
```

### Extraction boundary

```text
错误：本仓投影（docs/ 树、语言布局、目录名）→ 通用 skill
正确：验证后的 Gen2 control plane → portable semantics → governance skill
```

**In：** Control / Rule · Applicability · Evidence · Decision · Profiles · Task→Capability **语义**（非本仓路径）。

**Out：** 本仓 docs topology · language layout · CTRL-NNNN / Phase 剧本 · skill 目录形状（Stage C 才定）。

本仓 `docs/` 知识对象系统已存在；本计划 **不**重新设计文档体系。

## 提取协议（过程，不是目录）

ADR-0020 的 L1/L2/L3 是 **skill 产物分层**。下面是 **如何到达** 的流程。二者正交。

禁止一次 prompt 出 skill；禁止把中间产物堆进本文件。

```text
Project Facts          本仓实际怎么做（不抽象）     → RESEARCH-0014
        ↓ 审查
Design Rationale        为何存在、删了会怎样         → RESEARCH-0014
        ↓ 审查
Reusable Pattern       跨项目成立 vs 绑死本仓         → RESEARCH-0014
        ↓ 审查
Skill L1 / L2 / L3     invariant / pattern / L3      → RESEARCH-0014（候选）
        ↓ Stage C
Skill 文件形状          载荷，非本仓 docs/ 拷贝
```

示例（语言边界；说明用）：Fact = Roadmap 三语 / Plan 单语 → Rationale = canonical 单一源语言 → Pattern = projection ≠ authority → Skill = language ownership policy，**不**写死路径。

每条候选 L1 必须能回溯到 Fact；缺 Rationale 不得升格。

## 执行阶段

读本 Plan 做调度；改候选 invariant / pattern 时再读 RESEARCH-0014。**不要**把 ADR-0020 / ADR-0025 / RESEARCH-0012 全文复述进本文件。

### Stage A — Hard Invariants（L1）候选

| | |
| --- | --- |
| 输入 | ADR-0020…0025 · RESEARCH-0006 · RESEARCH-0011 / 0012 · must-ship gates · oracle inventory · routing graph / map · script-inventory · ADR-0025 H1 纪律 |
| 输出 | [RESEARCH-0014](../research/RESEARCH-0014-portable-governance-patterns.md) § Facts → Rationale → Pattern → L1/L2/L3 **候选** |
| 验收 | L1-01…12 = Provisional-Freeze（2026-09-13）；可在 Stage D 回退 |
| 状态 | **done**（知识在 RESEARCH-0014，不在本文件） |

覆盖面指针（条文在 RESEARCH-0014）：thin entry · closed metadata · one owner · document-type SRP · history ≠ default context · explicit routing · mechanical-first · control shape · discovery disposition。

### Stage B — Patterns（L2）

| | |
| --- | --- |
| 输入 | RESEARCH-0014 Stage A |
| 输出 | 同文件内 L2-01…11 稳定叙述；O1–O3 书面裁定 |
| 验收 | L2 有意图/做法/反模式；不把本仓路径/CTRL/Phase 写成强制；L1 本 Stage 不增不删 |
| 状态 | **draft-stable**。进 Stage C 须人类确认（清单在 RESEARCH-0014 § 审查清单；**尚未勾选**） |

### Stage C — Skill 结构（载荷形状）

**未开始。** 人类确认前不要施工。

| | |
| --- | --- |
| 输入 | RESEARCH-0014（Provisional L1 + L2-01…11） |
| 输出 | skill 文件形状（示意路径可改名；**不得**复制本仓 `docs/`） |
| 验收 | 每文件 internally 分 Hard Rules / Recommended Patterns / Project Customization；过滤层仍成立 |

示意（Stage C 定稿，现在不当交付）：

```text
governance-skill/
  SKILL.md
  references/
    instruction-architecture.md
    document-model.md
    metadata-policy.md
    capability-model.md
    decision-records.md
    discovery-and-verification.md
    migration-method.md
    workflow/  templates/
```

### Stage D — 验证

**未开始。**

| | |
| --- | --- |
| 输入 | Stage C skill + RESEARCH-0014 |
| 输出 | 干净目标上的真实证据（非宣称） |
| 验收 | 能抑制：metadata 膨胀、入口变百科、Research↔ADR 混乱、规则多处复制、启动即全量读治理树 |

失败 → 回 RESEARCH-0014 修订 L1，不得宣称 Implemented。

## Domain sync（Target: both）

| Domain | 触及时必须同步 |
| --- | --- |
| payload | skill 入口与 references；INIT/分发角色；reference-closure |
| repo-infra | ADR-0020 / roadmap；characterization tests；CHANGELOG（行为落地时）；skill-release 若触及发布 |

禁止：只改本仓 `docs/` 叙述却宣称「可复用 skill 已存在」。

## 完成条件

- [x] 前置条件满足后才转为 Active
- [x] Facts / Rationale / Patterns / L1 候选有审查记录且落在 RESEARCH-0014（非一次抽象、非塞进本 Plan）
- [ ] 人类确认可进 Stage C
- [ ] L1 成文且与 ADR-0020 分层一致；每条可回溯 Fact；无复制型/空泛型（Stage D 后勾）
- [ ] L2 / L3 边界显式；无本仓目录/CTRL/Phase 进 L1
- [ ] Skill 结构落地并可 INIT/打包（或明确分发形态）
- [ ] Stage D 干净目标验证有真实证据
- [ ] Discovery Ledger：Open=0；Unaccounted=0；Deferred 有 revisit
- [ ] 未越权实现万能平台或自动治理系统
- [ ] 未把脚本清理、INSTALLED routing、本仓入口瘦身或第三份去向表当作本计划交付（ADR-0025 决策 9–13）

## 受影响文件

（随 Stage 增量；禁止一次写完宣称完成。）

- [RESEARCH-0014](../research/RESEARCH-0014-portable-governance-patterns.md)（Stage A/B 知识产物）
- ADR-0020 · RESEARCH-0012（前置）
- 已归档 PLAN-0035 / 0036 / 0038
- roadmap ×3
- [FINDING-0030](../findings/FINDING-0030-artifact-placement-routing-gap.md)
- Stage C 后的 skill 入口与 references
- CHANGELOG（行为交付时）
- Stage D 干净目标证据

## 发现台账（Discovery Ledger）

| 标识（ID） | 类型 | 来源 | 问题 | 影响面 | 严重度 | 状态 | 处置 | 责任人 | 验证/证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| X0 | observation | design | 过早抽取会固化未验证 routing | skill | high | closed | resolved | — | Phase 5 EXITED + 2.0 后解冻 |
| X1 | observation | review | 「不写死」易被读成软建议 | skill | high | closed | resolved | — | ADR-0020 L1 硬约束修正 |
| X2 | migration_gap | design | extraction 未闭合至 Stage D | both | med | open | — | — | A/B 知识在 RESEARCH-0014；Stage D 后关闭 |
| X3 | observation | review | 一次抽象会复制实现或空泛口号 | skill | high | closed | resolved | — | § 提取协议；产物分层 ≠ 提取流程 |
| X4 | observation | review | 全文 0037 作 2.0 必达项过大 | both | high | closed | resolved | — | 2.0=本仓 Gen2 载荷；A–D 为 2.x H1 |
| X5 | observation | review | H1 清脚本 / 装 router / 瘦入口会偏离提炼 | both | high | closed | resolved | — | ADR-0025 2026-09-13 决策 9–13 |
| X6 | observation | review | Stage 产物误放 `research/working/extraction/` | both | med | closed | resolved | — | 曾并入 Plan 正文（过度纠偏）；现 RESEARCH-0014 |
| X7 | observation | review | Plan 吸收 Facts/L1–L3 → 权威膨胀 + Context Economy 自打脸 | both | high | closed | resolved | — | 2026-09-13 拆到 RESEARCH-0014；FINDING-0030 扩围 |

## 闭包对账（Active 基线）

```text
Total known:  8
Resolved:     7  (X0, X1, X3, X4, X5, X6, X7)
Deferred:     0
Open:         1  (X2 — Stage D 交付后须 0)
Unaccounted:  0
```

Active 期间允许 X2 Open；完成 Stage D 后须 Open=0。

## 参考

- [RESEARCH-0014](../research/RESEARCH-0014-portable-governance-patterns.md)（提炼知识；执行时按需读）
- ADR-0020 · ADR-0025 H1（含 2026-09-13 决策 9–13）· ADR-0018 · ADR-0022 · ADR-0023
- RESEARCH-0012（前置）
- FINDING-0030（Plan = 执行合同；知识产物走类型对象）
- PLAN-0035 / PLAN-0036（Phase 4 EXITED）
