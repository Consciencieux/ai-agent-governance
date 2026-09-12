---
id: PLAN-0037
status: Active
generation: gen2
target: both
---

# PLAN-0037：可复用治理 Skill 提炼（Governance Skill Extraction）

> **Status: Active**（2026-09-12 人类解冻：「归档，解冻」。Gate 1–3 已满足；[ADR-0025](../design-decisions/ADR-0025-gen2x-product-path.md) H1 现为当前产品主线。过滤层约束仍生效：禁止把本仓 `docs/`、CTRL 编号、Phase 剧本当 portable invariant。按提取协议 Stage A→D 施工，禁止一次抽象出 skill。**禁止 Archived**，直至 Stage D 验证通过并 exit review。）

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

## 前置条件（Gate — 转 Active 前须满足）

1. Phase 4 EXITED（PLAN-0035 / PLAN-0036）— **已满足**（已归档）
2. Phase 5 **Task→Capability routing** 已验证（RESEARCH-0012 → PLAN-0038 → 5b Dispatcher）— **已满足**（Phase 5 EXITED）
3. Phase 8 阻断权威已交接，且已退出 Migration Mode / 完成 2.0 skill-release — **已满足**（`v2.0.0`）
4. ADR-0020 L1/L2/L3 分层仍为 Accepted；无 Narrow 撤销 — **仍成立**

**当前顺序：**

```text
v2.0.0 已发布 · H0 归档完成
        ↓
本计划 Active — Stage A→D（ADR-0025 H1）
        ↓
跨项目 portable skill 验证（干净目标）
```

2.0 已发布的是 **本仓 INSTALLED Gen2 skill**；本计划提炼的是可复用原则包，不是复制本仓目录。过滤约束（Extraction boundary）在 Active 期仍约束产物撰写。

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

### Extraction boundary（Design 约束；Active 前不得展开 skill 目录/模板）

```text
错误：本仓投影（docs/ 树、语言布局、目录名）→ 通用 skill
正确：验证后的 Gen2 control plane → portable semantics → governance skill
```

**In scope（portable semantics）：** Control / Rule model · Applicability resolution · Evidence model · Decision semantics · Profiles · Task→Capability routing patterns · 与之配套的 instruction / document-type / metadata / ownership **语义**（非本仓路径）。

**Out of scope（本仓投影，不得当 invariant）：** repository-specific docs topology · language layout · current directory structure · project-specific identifiers（CTRL-NNNN、Phase/PLAN 剧本）· skill 目录形状 / metadata schema / template / 文档迁移规则（均依赖 Phase 5 验证后再定）。

本仓 `docs/` 知识对象系统已存在且合理；PLAN-0037 **不**重新设计文档体系。Capability 粒度与 Applicability 判据由 Phase 5（RESEARCH-0012 → PLAN-0038）验证——边界错则 skill 必偏。

## 提取协议（Design 约束；Active 时按此执行，禁止一次 prompt 出 skill）

ADR-0020 的 L1/L2/L3 是 **skill 产物分层**（invariants / patterns / customization）。下面是 **如何到达那一层** 的工程流程。二者正交，不得混用编号。

最大难点是 **抽象层级选择**：一次从本仓跳到通用 skill，只会落进两个极端。

```text
极端 1 复制型抽象     提取 WHAT（路径、CTRL 号、三语目录）当 invariant
极端 2 空泛型抽象     只剩口号（「要有语言策略」「保持清晰」）无约束
正确                 保留 WHY + CONSTRAINT + PATTERN，再写成 L1/L2/L3
```

禁止：

```text
原项目  →  通用 Skill
```

必须经过中间产物与审查点（每步只做低风险判断，不要求模型一次性「高级抽象正确」）：

```text
Project Facts          本仓实际怎么做（不抽象、不解释）
        ↓ 审查
Design Rationale        为何存在、解决什么、删了会怎样
        ↓ 审查
Reusable Pattern       哪些 rationale 跨项目成立；哪些绑死本仓环境
        ↓ 审查
Skill L1 / L2 / L3     才写成 invariant / pattern / template
```

示例（语言边界；说明用，非现在定稿）：

| 层 | 内容 |
| --- | --- |
| Fact | Roadmap 三语；Plan / ADR 单语；Product 三语 |
| Rationale | 执行对象要单一 canonical；用户/贡献者边界对象允许多语 projection |
| Pattern | Canonical object = 一种源语言；boundary object 可翻译，projection ≠ authority |
| Skill | Language ownership policy（分类 + 防 drift）；**不**写死 `roadmap/{en,zh-CN,zh-TW}` |

Active 时每条候选 invariant 必须能回溯到 Fact 行；缺 Rationale 不得升格为 L1。审查否决复制型/空泛型后再进入 Stage A–D。

这也是本计划 **现在不 Active** 的原因之一：Phase 5 routing 未验证时，Fact 层仍会变（例如「Capability-first」可能被「Task-context routing」修正）；提前抽 Skill 会冻结错误模型。

## 执行阶段（仅当 Active 后）

Active 后先跑提取协议（Facts → Rationale → Patterns），再写 skill 正文。

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

- [ ] 前置条件全部满足后才曾转为 Active（含 2.0 / Phase 8；非 2.0 路径上的 Active）
- [ ] 提取协议四段产物均有审查记录（Facts / Rationale / Patterns / Skill）；无「一次抽象」交付
- [ ] L1 invariants 成文且与 ADR-0020 分层一致；每条可回溯到 Fact；无复制型/空泛型
- [ ] L2 / L3 边界显式；无本仓目录/CTRL/Phase 剧本硬编码进 L1
- [ ] Skill 结构落地并可 INIT/打包（或明确的分发形态）
- [ ] Stage D 干净目标验证有真实证据（非宣称）
- [ ] Discovery Ledger：Open=0；Unaccounted=0；Deferred 有 revisit
- [ ] 未越权实现「万能平台」或自动治理系统

## 受影响文件

（Active；交付清单随 Stage A–D 增量冻结，禁止一次写完宣称完成。）

- ADR-0020（权威边界；已含 2026-09-10 修正）
- RESEARCH-0012（前置；routing 验证）
- `docs/plans/archive/PLAN-0035-…` / `PLAN-0036-…` / `PLAN-0038-…`（前置已归档）
- roadmap ×3（索引本计划为 H1 Active）
- 提炼落地时的 skill 入口与 references（路径 Stage C 定稿）
- CHANGELOG（行为交付时）
- 验证用干净目标证据（tests 或记录）

## 发现台账（Discovery Ledger）

| 标识（ID） | 类型 | 来源 | 问题 | 影响面 | 严重度 | 状态 | 处置 | 责任人 | 验证/证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| X0 | observation | design | 过早抽取会固化未验证 routing | skill | high | closed | resolved | — | Phase 5 EXITED + 2.0 后解冻（2026-09-12） |
| X1 | observation | review | 「不写死」易被读成软建议 | skill | high | closed | resolved | — | ADR-0020 L1 硬约束修正 |
| X2 | migration_gap | design | 尚无 extraction 执行产物 | both | med | open | — | — | Active 后按 Stage A–D 关闭 |
| X3 | observation | review | 一次抽象会复制实现或空泛口号 | skill | high | closed | resolved | — | 本计划 § 提取协议；产物分层 ≠ 提取流程 |
| X4 | observation | review | 全文 0037 作 2.0 必达项过大且与产品定义重叠 | both | high | closed | resolved | — | 2.0=本仓 Gen2 载荷已发布；A–D 为 2.x H1 |

## 闭包对账（Active 基线）

```text
Total known:  5
Resolved:     4  (X0, X1, X3, X4)
Deferred:     0
Open:         1  (X2 — Stage A–D 交付后须 0)
Unaccounted:  0
```

Active 期间允许 X2 Open；完成 Stage D 后须 Open=0。

## 参考

- ADR-0020（skill 提炼边界 · L1/L2/L3）· ADR-0025 H1
- ADR-0018 Phase 5 · ADR-0022 · ADR-0023
- RESEARCH-0012（前置）
- PLAN-0035 / PLAN-0036（Phase 4 EXITED；已归档）
