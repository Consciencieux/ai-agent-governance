---
id: PLAN-0034
status: Active
generation: gen2
target: both
---

# PLAN-0034：Governance Core / Rule Model（Phase 3 checkpoint）

> （进行中。2026-09-10：ADR-0023 consistency pass 已收口；完成条件按选项 B 复核为可做 exit review。未宣布 Completed，待 exit review。）

Phase 3 的执行主体。回答「Control / Rule 如何建模」；**不**拆 Gen1 checker、**不**建 Dispatcher、**不**移动 `references/` 政策单体。

## 背景

Phase 2（`346bb749`）已封板 Documentation Knowledge Architecture。Roadmap 当前阶段为 3，但此前无 Active Plan。ADR-0018 要求 Gen2 阶段通过 Active Plan 执行；PLAN-0032 R23 要求 Phase 3 入口前重新取回 AGENTS/SKILL 瘦身边界。

Phase 1（ADR-0020 / PLAN-0031）已给出 ownership 与 CONTROL-X 契约，并明确：`owner: core` 只是概念词汇；正式 Control / slot 规范留待本阶段（ADR-0023）。独立机器序列化不在本阶段强制交付。

## Phase 3 入口：R23 取回（AGENTS / SKILL 边界）

**问题（R23）**：`AGENTS.md`（~28KB）与 `SKILL.md`（~30KB）仍是厚入口；ADR-0022 要求薄入口，但完整瘦身不能在 Control Model 尚未存在时盲目拆文件（无路由目标会把「记规则」变成「找规则」）。

**Phase 3 期间入口职责（本 checkpoint 冻结）：**

| 入口 | Phase 3 允许 | Phase 3 禁止 |
| --- | --- | --- |
| `AGENTS.md` | 增加/修正**指向**本阶段 Accepted ADR / Active Plan / repo-domain 执行文档的薄指针；修正明显错误路由 | 把 Rule Model / Control schema 正文写入 AGENTS；全量重写；把领域政策塞回入口 |
| `SKILL.md` | 增加指向已接受 Control Model 家的**指针**（仅当 Accepted ADR 已定家；**禁止**指向本仓库 `docs/`） | 在 SKILL 内嵌完整 Control schema；编码尚未接受的 Gen2 语义；改 INIT/AUDIT/RELEASE 编排本体以「假装」已有 Dispatcher |
| 根 `README*.md` | 用户可见导航微调 | 变成内部 Rule Model 说明书 |

**与 Frozen Gen1（ADR-0014）的关系：**

```text
允许：入口指针、文档/ADR/Research 中的模型设计、characterization
禁止：在 Gen1 JS/checker 中编码新 Gen2 semantics；拆 lifecycle.policy / sub-skills.md；建 Dispatcher
完整入口瘦身：清单必须有；执行可延后（E1）——不阻塞本计划 exit（选项 B）
```

**R23 处置**：本计划入口节即取回记录；完整瘦身执行列为后续交付（见台账 E1），不在入口当天完成。

## 目标

本阶段结束时，仓库必须能回答（并有 Accepted 规范或等价权威载体）：

```text
什么是 Control identity？
什么是 authoritative rule semantics（semantics_ref）？
Applicability 怎么表达？
Evaluator / enforcement binding 怎么关联？
Decision effect 如何挂在 binding 上（而非 Control 单值）？
Shared semantic authority 与 repo / skill profile 怎么分？
```

并交付一份 **serialization-agnostic canonical slot model**（字段名不预锁为 YAML 键），用 3–5 个 Gen1 真实控制做 vertical slice 验证同一模型能否表达：

```text
Secret protection
Git policy / consent
Document freshness（拆成文档过旧 vs 译文滞后）
Plan delivery
```

（具体取样可在执行中调整，但不得少于 3 个跨 profile 或单域对照样例。）

## 明确不在范围（Out of scope）

```text
拆 check-doc-consistency.js / 重写全部 checker     → Phase 4
移动 lifecycle.policy / 拆 sub-skills.md           → 后续；本阶段不授权
建立 Dispatcher / Context Detector                 → Phase 5
可路由 Control 叶节点 / 完整入口瘦身执行           → E1 deferred；非本计划 blocker
独立 machine-readable 序列化文件                   → E4 deferred
Invariant testing 体系 / Review 三类拆分           → Phase 6 / 7
正式 Release / SemVer tag / skill tarball          → 禁止（ADR-0014）
```

## Target: both — 同步点

| 域 | 本阶段可交付 | 同步约束 |
| --- | --- | --- |
| repo-infra | ADR / Research / Plan / Roadmap；必要时 AGENTS 薄指针 | 模型规范进 ADR；系统描述进 Research；不把 slot 正文堆进 AGENTS |
| payload | 本阶段**不**为 Control Model 改 `scripts/*.js` 或拆 `references/policies/*` | SKILL 若提及只放指针且不得指向本仓库 `docs/` |

## 提议交付物

1. **Control / Rule 概念关系**（Research 描述 + ADR 规范）。
2. **Serialization-agnostic canonical slot model**（ADR-0023；**不是**已完成的 machine-readable 文件）。
3. **Vertical slice**：≥3 个 Gen1 控制映射（CTRL-0001–0005；不要求新 JS）。
4. **入口收敛清单**：AGENTS/SKILL 可下沉条目（执行可延后，清单必须有）。

## 完成条件

- R23 入口边界已写入本计划且执行期间未被违反。
- 至少一份 Accepted ADR 定义 Control/Rule 规范边界；配套 Research 描述系统模型（Research 不裁决 MUST）。
- **Slot model** 有单一权威落点（ADR-0023）；AGENTS/SKILL 若提及则只做指针。独立机器序列化**不是**完成条件（E4）。
- Vertical slice ≥3，覆盖至少一处 shared-semantic / cross-profile 关注点。
- Discovery Ledger `Unaccounted = 0`；无 Open 项（Deferred 必须带 revisit trigger）。
- 未引入 Phase 4/5 范围的文件拆分或 Dispatcher 实现；未打 release tag。
- **E1（完整入口瘦身 / 可路由叶节点）不是完成条件**——清单存在即可；执行属后续（选项 B）。

## 受影响文件

- `docs/plans/PLAN-0034-governance-core-rule-model.md` —— 本计划
- `docs/plans/roadmap/{en,zh-CN,zh-TW}.md` —— Current Phase Plan → 本计划
- `docs/plans/archive/PLAN-0032-documentation-knowledge-architecture-closure.md` —— R23 取回注记（已归档）
- `docs/research/RESEARCH-0010-governance-control-model.md` —— Control 系统模型（描述层）
- `docs/design-decisions/ADR-0023-governance-control-model.md` —— Control Model / slot 规范
- `docs/design-decisions/ADR-0018-generation-2-dev-path.md` · `ADR-0020-…` —— 指针与预告字段退役
- `docs/research/README.md` · `docs/design-decisions/README.md` · `docs/glossary.md` · `AGENTS.md` —— 索引 / 术语 / 入口指针
- 独立机器 schema 文件、`references/` 政策单体、`scripts/*.js` —— **本阶段不改**

## 验证方法

1. Migration Mode：Gen1 full gate 仅 observational；不以旧 gate 全绿为完成条件。
2. 权威矩阵五问：新增 ADR/Research 时执行（ADR-0016）。
3. Impact-face：任何拟改 `references/` / `scripts/` 的提议必须能指出 Accepted ADR 授权，否则拒绝。
4. Vertical slice 评审：同一 slot model 能描述所选 Gen1 控制的 semantics / profile / binding / decision_effect（文档级即可）。

## 发现台账（Discovery Ledger）

| 标识（ID） | 来源 | 问题 | 范围 | 状态 | 处置 | 证据 |
| --- | --- | --- | --- | --- | --- | --- |
| E0 | PLAN-0032 R23 | Phase 3 入口须确认 AGENTS/SKILL 瘦身边界 | repo+skill | closed | resolved | 本计划 § Phase 3 入口 |
| E1 | E0 | 完整入口瘦身 / 可路由叶节点 | repo+skill | closed | deferred（revisit: 出现可路由 Control 叶节点或 Dispatcher 之前不拆厚入口；**不阻塞本计划 exit**） | ADR-0022 · ADR-0023 §10 · 本计划 § E1 取回 |
| E2a | ADR-0020 | Control canonical slot semantics 未定 | both | closed | resolved | ADR-0023 决策 4 + consistency pass |
| E2b | E2a | serialization / machine-readable representation | both | closed | deferred（= E4；revisit: 第二个真实机器 consumer） | ADR-0023 决策 6 |
| E3 | user review | Completed Plan 曾错误绑定 Release 才归档 | repo | closed | resolved | ADR-0016；PLAN-0031/0032/0033 → archive |
| E4 | ADR-0023 | 独立 machine-readable 文件尚未授权 | both | closed | deferred（revisit: Dispatcher / CONTROL-X runner / 生成器） | ADR-0023 决策 6 |
| E5 | user review | ADR-0023 首版：Model authority 措辞 / decision·guarantee 层级泄漏 | repo | closed | resolved | ADR-0023 2026-09-10 consistency pass |

## 闭包对账

```text
Total known:  7
Resolved:     4  (E0, E2a, E3, E5)
Deferred:     3  (E1 入口瘦身执行；E2b=E4 序列化)
Open:         0
Unaccounted:  0
```

**Exit readiness（选项 B）**：完成条件已满足；E1/E2b/E4 为合法 deferred，不阻止 Phase 3 exit review。本计划仍为 `Active`，直到 exit review 明确关闭并归档。

## E1 取回：AGENTS / SKILL 可下沉清单（不执行）

Control Model 已有 Accepted 规范（ADR-0023），但**还不是** Agent 可按任务加载的叶节点。当场执行完整瘦身会重演 FINDING-0015。决定：**本阶段只允许指针；正文下沉延后；不阻塞 exit。**

| 入口段落 | 与 Control 的关系 | 现在 | 何时可下沉 |
| --- | --- | --- | --- |
| AGENTS 原则索引 | 路由 | 已加 ADR-0023 一行 | 保持指针 |
| AGENTS § Git Operation Safety Protocol | CTRL-0002 投影 | 保留 | 与 FINDING-0001 修复同期 |
| AGENTS 预提交 `check-secrets` | CTRL-0001 调用 | 保留调用句 | 有 hook / 门禁接线后可缩短 |
| SKILL 政策层大段 | 多条未建模 Control | **不得**指向本仓库 `docs/` | payload 内 INSTALLED Control 投影之后 |
| `lifecycle.policy.md` / `sub-skills.md` | 政策单体 | 不拆 | Phase 4+ |

## 未决风险（不阻塞 exit）

- 过早物化 YAML（E4 挡住）。
- Phase 4 若按文件 inventory 会压扁 CTRL-0003/0004。
- FINDING-0001 duplicated consent 正文仍在。

## 参考

- 阶段顺序：ADR-0018
- Migration / Frozen Gen1：ADR-0014
- Producer/Product 边界：ADR-0020 · PLAN-0031
- 指令架构 / 薄入口：ADR-0022 · RESEARCH-0009
- 知识权威矩阵：ADR-0016
- Phase 2 baseline：`346bb749`
- Control Model：RESEARCH-0010 · ADR-0023（含 consistency pass）
- Control Model 首登：`a11f608`
