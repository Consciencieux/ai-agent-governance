---
id: RESEARCH-0012
status: Active
version: 4
subject_generation: gen2
---

# RESEARCH-0012：Task → Capability 适用路由（Phase 5 入口）

本 RESEARCH 是 **Phase 5 入口观察与问题框定**。施工车辆 PLAN-0038 / 0039 / 0040 已 Implemented；**Phase 5 checkpoint EXITED**（2026-09-12；见 PLAN-0040 § Phase 5 Exit Criteria）。本文件仍是系统模型，不因 checkpoint 归档。

**本文件不**实现 Dispatcher、不搬物理拓扑、不执行 PLAN-0037——那些是 Plan 的事（5b/5c 已落地；0037 仍冻结）。

系统背景：ADR-0022（thin entry / progressive disclosure / Context Economy）、ADR-0023（Control slots）、RESEARCH-0009（指令架构）、RESEARCH-0006（能力基线）。

## 观察：现在有什么 / 没有什么

| 能力 | 状态 |
| --- | --- |
| 知识类型导航（Product / Research / Finding / ADR / Plan…） | 已有（`docs/README.md`） |
| Control identity + evaluator/binding | Phase 3–4 已有 |
| **Task / Context → Applicable Capabilities** 确定性映射 | **已落地**（PLAN-0038 Implemented；`working/routing/task-capability-map.md` v0） |
| 调用拓扑（分层图 + 解析算法） | **已陈述且 5b 可调用**（`working/routing/call-topology.md` + `routing.js`） |
| 由 routing 导出的文档物理拓扑 | **5c P0–P2 已投影**（PLAN-0040；leftover 叶延后） |

现状失败模式：Agent 打开厚 `lifecycle.policy` / 多文件自搜 → token↑、漏读、跨位置关联失败（ADR-0022）。

**Gen1「能力路由」澄清：** 1.x 稳定产品**没有**独立的 Task→Capability 适用图。日常查找 ≈ 厚入口 + `lifecycle.policy` 政策仓库 + 子技能 trigger 词 + Agent 自搜（目录/记忆当 dispatcher）。Gen2 调用拓扑**替换**该查找层，而不是给旧目录树加一层别名。物理文件投影（Phase **5c**）只能按 Capability 重挂功能语义；纪律见 `docs/research/working/routing/call-topology.md` § 物理拓扑。**禁止**另造第三套查找架构。

## 目标形状（陈述，非实现）

```text
Task taxonomy
    ↓
Task / Context → Applicable Capabilities   ← 本阶段首要
    ↓
Capability → Authority / Execution leaf
    ↓
fallback / ambiguity expansion
    ↓
thin entry 消费 routing
    ↓
（随后）Dispatcher；再据 routing 重构物理 topology
```

第一阶段只要 **显式映射表 / 人工可维护的 applicability 陈述**；半自动与 runtime Dispatcher 延后。**5a–5c 现已落地**（map → resolve/CLI → Slice B 投影）；完整正反 oracle 仍归 Phase 6。

## 调用拓扑架构（v3）

**调用拓扑 ≠ 目录结构。** 它是 Task/Context 如何命中 Capability、再命中 Authority/Control 的分层图。施工全文：`docs/research/working/routing/call-topology.md`。实例：`docs/research/working/routing/task-capability-map.md`。

```text
L0 always-on → L1 TaskClass→Capability+ → L2 Facet 叠加
    → L3 Capability→AuthorityRef + 可选 Control
    → L4 RoutingResult（read_set / run_set / defer_set）
```

五类边：`always_on` · `triggers` · `facet_adds` · `has_authority` · `binds`。解析确定性：并集 → 排序 → 预算裁剪（不得删已命中 `run_set`）。物理文件只作为 AuthorityRef 的当前投影，**不是图节点**。5b Dispatcher 消费同一张图，不另造适用关系。

## Phase 5 必须先答清的六个问题

这些问题决定 PLAN-0037 将来能抽出什么；Capability / Applicability 边界错则 skill 必偏。

**采纳状态（2026-09-12）：** 六问工作假设 **全部采纳、无修订**，作为 PLAN-0038 施工权威。验证载体 = 显式映射 + 表征夹具（`docs/research/working/routing/task-capability-map.md`），不是 Dispatcher。

| # | 问题 | 本 RESEARCH 工作假设（已采纳 → Plan 验证） |
| --- | --- | --- |
| 1 | Task 如何描述？ | 稳定 **task class**（动词/意图类）+ 可选 **context facets**（树、阶段、工件、写边界）；不是自由长句 |
| 2 | Capability 粒度？ | **一个可独立加载的执行关注面**（instruction leaf / 横切执行模块）；不是文件、不是 CTRL、不是整份 lifecycle |
| 3 | Applicability 根据什么？ | 显式声明：task class ∈ triggers **或** context facet 命中；禁止「Agent 凭感觉」作为权威 |
| 4 | 可否多 capability？ | **默认一对多**（集合）；routing 输出为 set，再按依赖/阶段排序，不是单选赢家 |
| 5 | 与 Control/evaluator 关系？ | Capability ⊇ 执行指令面；Control = 可评价保证。Capability 可 **bind** 零或多个 Control；有 primitive 的先机械、再 judgment（RESEARCH-0009） |
| 6 | Routing 输出是什么？ | 结构化 **read-set / run-set / defer-set**（应读权威、应跑评价、歧义时扩大读集）；不是自然语言执行计划 |

### Q1 — Task 描述

**工作假设：** Task 有两层，不要混成一段 prompt。

```text
task_class      稳定枚举（例：edit_docs · change_code · git_write · release · audit · research_write）
context         可选 facet：
                  trees: [docs|references|scripts|repo-tools|…]
                  phase: [understand|plan|implement|validate|…]   # lifecycle 阶段若适用
                  artifacts: [plan|adr|finding|…]
                  write_boundary: [none|worktree|commit|tag|release]
```

Agent 自然语言任务先 **归类** 到 `task_class`（人工表 + 薄启发式即可）；归类失败 → `defer-set` 扩大读入口/问用户，不假装命中。

**禁止：** 把完整用户对话当 Task schema；把「任意字符串」当主键。

### Q2 — Capability 粒度

**工作假设：** Capability = **单一执行关注面的可路由单元**。

判据（同时满足才算一个 capability）：

1. 有明确 **Authority leaf**（该读哪份语义/指令，可指针到 policy 节或未来 capability 目录）
2. 可回答「当前 Task 要不要加载它？」（applicability）
3. 去掉它，Agent 会漏掉一类可命名的执行约束或动作
4. **不是**「整份 lifecycle / 整份 AGENTS」这种容器

反例（过粗）：`lifecycle`、`governance`、`docs`  
反例（过细）：「CHANGELOG 空行规则」「某一 CTRL 的一条 regex」→ 属 Control/规则，挂在 capability 下，不单独当 capability

Gen1 线索（描述，非清单定稿）：RESEARCH-0009 已点名 change-hygiene、root-cause-repair、git-write、evidence、release、security、rule-capture、review 等应从 lifecycle 内嵌章节升为独立 capability。种子表由 PLAN-0038 从 RESEARCH-0006 / sub-skills / policies 对账起草，本 RESEARCH 不定完整枚举。

### Q3 — Applicability 判据

**工作假设：** Applicability 是 **陈述式**（与 ADR-0023 Control.applicability 同族），权威是映射表，不是模型临场发明。

```text
capability C applicable iff
  task_class ∈ C.triggers
  OR any context facet matches C.context_match
```

冲突策略（假设）：

- 多个 C 同时 applicable → 全部进入 read-set（见 Q4）
- 无命中 → 仅 always-on invariant + 入口 routing 说明；记录 `unmatched` 供审查，不静默全量加载
- 命中过多（超过预算阈值，阈值由 Plan 定）→ 按 priority / phase 排序，其余进 defer-set，**禁止**为省 token 丢掉已命中的机械 Control

### Q4 — 多 Capability

**工作假设：** 一对多是常态（例：`delete_file` → change-hygiene + reference-closure + testing + evidence）。

Routing **不是**分类器选一个标签；是 **集合解析**。顺序：always-on → task-triggered → phase-triggered → ambiguity expansion。

### Q5 — Capability vs Control

```text
Capability          执行时「应加载的指令/流程关注面」
Control (CTRL)      可评价保证（identity · semantics · evaluator · binding · evidence）
Evaluator           机械/启发式/审查 实现
```

关系（假设）：

| | Capability | Control |
| --- | --- | --- |
| 主要消费者 | Agent 读集 / 薄入口路由 | Dispatcher / gate / CI |
| 可否无对方 | 可（纯 judgment 面） | 可（纯机械、无长指令） |
| 绑定 | Capability.binds_controls[] 可选 | Control.applicability 可与 task/context 对齐但不等于 capability 名 |

禁止：Capability 1:1 改名为 CTRL；禁止「所有 Markdown 默认 Control 化」。

### Q6 — Routing 输出

**工作假设：** 最小可消费结构（说明性，非正式 schema）：

```text
RoutingResult:
  task_class: <id>
  context: { … }
  always_on: [invariant pointers]
  capabilities: [ { id, authority_refs[], controls[], priority } ]
  read_set:    ordered authority refs   # Agent 应读
  run_set:     control ids              # 应评价 / 可机械跑
  defer_set:   [reason + candidate refs] # 歧义或超预算时扩大
  unmatched:   bool
```

薄入口只消费此结果（或人工维护的同构表），不内嵌规则正文。

示例（说明性）：

```text
task_class: delete_file
requires → capabilities:
  change-hygiene · reference-closure · testing · evidence
```

## 明确禁止（防过度工程）

```text
万能知识图谱 / 每句规则唯一 ID / 段落 dependency ontology
LLM 自动判断一切任务并生成 execution plan
把所有 Markdown 规则默认 Control 化
无 routing 的大规模文档搬家
现在执行 PLAN-0037 / 复制 docs/ 为 skill
```

判断标准：只让**高价值关系**进入系统；其余保持普通文档。

## 与 Phase 4 / PLAN-0037 的交接

Phase 4（PLAN-0035 / 0036）已 EXITED。剩余 consistency clusters / #9 = deferred by design，**不**作为 Phase 5 前置 blocker。

PLAN-0037 Extraction boundary：抽 **Gen2 control plane portable semantics**，不抽本仓 docs topology。本 RESEARCH / Phase 5 Plan 验证的 capability 粒度与 applicability 判据，是 PLAN-0037 的前置输入。

## 后续产物

| 产物 | 状态 |
| --- | --- |
| 本 RESEARCH v2（六问工作假设） | 本文件；**已采纳**；v4 = Phase 5 EXITED 记录 |
| **PLAN-0038** Phase 5a | **Implemented** / 5a EXITED |
| **PLAN-0039** Phase 5b | **Implemented** / 5b EXITED |
| **PLAN-0040** Phase 5c | **Implemented** / 5c P0–P2；**Phase 5 EXITED** |
| 必要时 Narrow ADR（routing 权威表示） | 映射稳定且需升格后 |
| PLAN-0037 Active | **2.0 后**解冻（Design 冻结；非 2.0 blocker） |

## 开放项（Phase 5 外）

1. 与 ADR-0023 Control.applicability 的对齐方式（共享 facet 词汇 vs 分表）
2. 超预算 / unmatched 人工审查协议的走读确认（非 token 门禁）
3. 5c leftover Capability 叶 / 可选 rename（不重开 Phase 5）

## 参考

- ADR-0018 Phase 5 · ADR-0020 · ADR-0022 · ADR-0023
- RESEARCH-0004 / 0006 / 0009 / 0010 / 0011
- PLAN-0035 / PLAN-0036 Exit · PLAN-0037 Design 冻结 · PLAN-0038 / 0039 / 0040 Implemented（Phase 5 EXITED）
