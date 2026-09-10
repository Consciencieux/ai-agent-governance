---
id: PLAN-0037
status: Design
generation: gen2
target: both
---

# PLAN-0037：可复用治理 Skill 提炼（Governance Skill Extraction）

> **Status: design plan, not implemented**（Phase 5 routing 验证之后再 Active；**不是**当前执行主线。本计划是过滤层：防止把本仓实验实现硬编码成「所有项目必须如此」。Architecture checkpoint ≠ Release。）

将 `ai-agent-governance` 中**已验证**的 Gen2 治理原则提炼为可复用 Agent Governance Skill，并显式划分 **L1 invariants / L2 patterns / L3 project customization**。权威边界见 ADR-0020（2026-09-10 修正）。

## 目标

```text
本仓库（实验场 + 参考实现）
        ↓ 验证 Gen2（含 Phase 5 Task→Capability routing）
        ↓ 提炼不可变原则（L1）与推荐模式（L2）
        ↓ 形成可复用 governance skill
        ↓ 治理其他项目（L3 由目标项目定制）
```

**一句话：** 把已验证的 Gen2 治理原则提炼为可复用 skill，并定义哪些内容属于 invariant、哪些属于 project customization。

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
```

## 前置条件（Gate — 未满足则不得 Active）

1. Phase 4 EXITED（PLAN-0035 / PLAN-0036）— 已满足
2. Phase 5 **Task→Capability routing** 模型已验证（RESEARCH-0012 → 后续 Phase 5 Plan）：capability 边界、applicability 表达、routing 合同稳定
3. ADR-0020 L1/L2/L3 分层仍为 Accepted；无 Narrow 撤销

**当前顺序：**

```text
Phase 4 exit
    ↓
Phase 5 routing model（RESEARCH-0012 → Phase 5 Plan）
    ↓
验证 capability / applicability 边界
    ↓
本计划 Active（PLAN-0037）
    ↓
发布可复用 skill（另循 skill-release；本计划不吞并 release）
```

## 为何需要本计划（过滤层）

Phase 5 将产生 Task taxonomy、Capability routing、Applicability、Dispatcher 等大量概念。没有 extraction plan，容易把：

```text
ai-agent-governance 的实验实现
```

直接写成：

```text
所有被治理项目必须如此
```

本计划强制：**写死结构性约束，不写死项目实例**（目录名、编号、本仓迁移剧本属 L3）。

## 执行阶段（仅当 Active 后）

### Stage A — 提取 Hard Invariants（L1）

输出：`Governance invariants`（skill 硬约束，宜可机械检查）

至少覆盖：

- Entry documents thin（identity · scope · invariants · routing only）
- Metadata schema closed（新增字段须 ADR；禁止冗余/正文回填）
- One canonical owner per fact
- Document type single responsibility（禁止跨类型混用）
- History not default execution context
- Capability requires explicit routing
- Critical guarantees prefer mechanical enforcement
- Mechanical control shape（若采用）：identity · semantic owner · evaluator · binding · evidence（**不**强制 CTRL-NNNN）
- Discovery disposition：可追踪 + disposition + closure（**不**强制本仓 YAML 列名）

### Stage B — 提取 Patterns（L2）

推荐、非强制路径：Research/Finding/ADR/Plan 分离；Capability → Authority → Execution；Progressive disclosure；Discovery Ledger 模式；抽象 migration stages。

### Stage C — 定义 Skill 结构（载荷形状，非本仓路径拷贝）

示意（路径名可在 Active 时定稿；不得等于「复制本仓 docs/」）：

```text
governance-skill/
  SKILL.md                    # 薄入口
  references/
    instruction-architecture.md
    document-model.md
    metadata-policy.md
    capability-model.md
    decision-records.md
    migration-method.md
    workflow/
    templates/
```

每个文件 internally 分：**Hard Rules / Recommended Patterns / Project Customization**。

### Stage D — 验证（必须，不止写文档）

用**新项目 / 干净目标**验证 skill 能否抑制：

- metadata 膨胀
- README / 入口变百科
- Research ↔ ADR 混乱
- 规则全文多处复制
- Agent 启动即全量读取治理树

验证失败 → 回 Stage A/B 修订 L1，不得宣称 Implemented。

## Domain sync（Target: both）

| Domain | 本计划触及时必须同步的点 |
| --- | --- |
| payload | skill 入口与 references 方法论文件；INIT/分发角色；reference-closure |
| repo-infra | ADR-0020 / roadmap 索引；characterization tests；CHANGELOG（行为落地时）；skill-release 若触及发布 |

禁止：只改本仓 `docs/` 叙述却宣称「可复用 skill 已存在」。

## 完成条件（Active 后的 exit）

- [ ] 前置条件全部满足后才曾转为 Active
- [ ] L1 invariants 成文且与 ADR-0020 分层一致
- [ ] L2 / L3 边界显式；无本仓目录/CTRL/Phase 剧本硬编码进 L1
- [ ] Skill 结构落地并可 INIT/打包（或明确的分发形态）
- [ ] Stage D 干净目标验证有真实证据（非宣称）
- [ ] Discovery Ledger：Open=0；Unaccounted=0；Deferred 有 revisit
- [ ] 未越权实现「万能平台」或自动治理系统

## 受影响文件

（Design；交付门禁跳过。Active 时再冻结清单。）

- ADR-0020（权威边界；已含 2026-09-10 修正）
- RESEARCH-0012（前置；routing 验证）
- 后续 Phase 5 Plan（routing 施工；本计划前置）
- roadmap ×3（索引本计划为后置项）
- 提炼落地时的 skill 入口与 references（路径 Active 时定）
- CHANGELOG（行为交付时）
- 验证用干净目标证据（tests 或记录）

## 发现台账（Discovery Ledger）

| 标识（ID） | 类型 | 来源 | 问题 | 影响面 | 严重度 | 状态 | 处置 | 责任人 | 验证/证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| X0 | observation | design | 过早抽取会固化未验证 routing | skill | high | closed | deferred | — | revisit: Phase 5 routing 验证后 Active |
| X1 | observation | review | 「不写死」易被读成软建议 | skill | high | closed | resolved | — | ADR-0020 L1 硬约束修正 |
| X2 | migration_gap | design | 尚无 extraction 执行车辆 | both | med | open | — | — | 本计划；Active 后关闭 |

## 闭包对账（Design 基线）

```text
Total known:  3
Resolved:     1  (X1)
Deferred:     1  (X0 — revisit: Phase 5 后)
Open:         1  (X2 — 本计划尚未 Active/交付)
Unaccounted:  0
```

Design 阶段允许 X2 Open；转为 Active 并完成 Stage D 后须 Open=0。

## 参考

- ADR-0020（skill 提炼边界 · L1/L2/L3）
- ADR-0018 Phase 5 · ADR-0022 · ADR-0023
- RESEARCH-0012（前置）
- PLAN-0035 / PLAN-0036（Phase 4 EXITED）
