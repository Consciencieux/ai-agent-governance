---
id: RESEARCH-0012
status: Active
version: 4
subject_generation: gen2
---

# RESEARCH-0012：Task → Capability 适用路由（Phase 5 入口）

**一个编号 = 一个文件。** 施工表（拓扑 / 路由表 / 投影 / Review 剧本）都在本文件附录，不是第二份 `RESEARCH-0012-*`，也不是 `repo-tools/*.md`。机读图只有 `repo-tools/routing-graph.v0.json`（`routing.js` 读它）。

**本文件不**实现 Dispatcher、不搬物理拓扑、不执行 PLAN-0037——那些是 Plan 的事（5b/5c 已落地；0037 仍冻结）。

系统背景：ADR-0022（thin entry / progressive disclosure / Context Economy）、ADR-0023（Control slots）、RESEARCH-0009（指令架构）、RESEARCH-0006（能力基线）。

## 观察：现在有什么 / 没有什么

| 能力 | 状态 |
| --- | --- |
| 知识类型导航（Product / Research / Finding / ADR / Plan…） | 已有（`docs/README.md`） |
| Control identity + evaluator/binding | Phase 3–4 已有 |
| **Task / Context → Applicable Capabilities** 确定性映射 | **已落地**（PLAN-0038 Implemented；本文件 § 路由表） |
| 调用拓扑（分层图 + 解析算法） | **已陈述且 5b 可调用**（本文件 § 调用拓扑 + `routing.js`） |
| 由 routing 导出的文档物理拓扑 | **5c P0–P2 已投影**（PLAN-0040；leftover 叶延后） |

现状失败模式：Agent 打开厚 `lifecycle.policy` / 多文件自搜 → token↑、漏读、跨位置关联失败（ADR-0022）。

**Gen1「能力路由」澄清：** 1.x 稳定产品**没有**独立的 Task→Capability 适用图。日常查找 ≈ 厚入口 + `lifecycle.policy` 政策仓库 + 子技能 trigger 词 + Agent 自搜（目录/记忆当 dispatcher）。Gen2 调用拓扑**替换**该查找层，而不是给旧目录树加一层别名。物理文件投影（Phase **5c**）只能按 Capability 重挂功能语义；纪律见本文件 § 物理拓扑。**禁止**另造第三套查找架构。

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

第一阶段只要 **显式映射表 / 人工可维护的 applicability 陈述**；半自动与 runtime Dispatcher 延后。**5a–5c 现已落地**（map → resolve/CLI → Slice B 投影）；Phase 6 种子 oracle 已落地（[PLAN-0042](../plans/archive/PLAN-0042-invariant-based-testing.md) EXITED）；全量正反矩阵仍延后。

## 调用拓扑架构（v3）

**调用拓扑 ≠ 目录结构。** 它是 Task/Context 如何命中 Capability、再命中 Authority/Control 的分层图。施工全文与实例见本文件附录。

```text
L0 always-on → L1 TaskClass→Capability+ → L2 Facet 叠加
    → L3 Capability→AuthorityRef + 可选 Control
    → L4 RoutingResult（read_set / run_set / defer_set）
```

五类边：`always_on` · `triggers` · `facet_adds` · `has_authority` · `binds`。解析确定性：并集 → 排序 → 预算裁剪（不得删已命中 `run_set`）。物理文件只作为 AuthorityRef 的当前投影，**不是图节点**。5b Dispatcher 消费同一张图，不另造适用关系。

## Phase 5 必须先答清的六个问题

这些问题决定 PLAN-0037 将来能抽出什么；Capability / Applicability 边界错则 skill 必偏。

**采纳状态（2026-09-12）：** 六问工作假设 **全部采纳、无修订**，作为 PLAN-0038 施工权威。验证载体 = 显式映射 + 表征夹具（本文件 § 路由表），不是 Dispatcher。

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


---

## 施工附录（本编号唯一正文 · 原独立 md 已废）

人读施工权威全部在本文件。`repo-tools/` 只保留 `routing-graph.v0.json` 与 `routing.js` / `route-task.js`。


### 调用拓扑

# 调用拓扑架构（Phase 5a）

本文件规划 **调用拓扑**（谁在何种任务下被加载 / 被评价），不是目录树，不是 Dispatcher 实现。

实例表见下文 § 路由表。系统假设见 RESEARCH-0012。升格 Narrow ADR 前为施工权威。

## 一句话

```text
调用拓扑 = 分层有向图

节点：TaskClass · ContextFacet · Capability · AuthorityRef · Control
边：  always_on · triggers · facet_adds · has_authority · binds
解析：并集 → 排序 → 预算裁剪 → RoutingResult
```

物理文件不是节点。路径只出现在 `AuthorityRef` 的**当前投影**里，可随搬家改指针而不改图。

## 为何先有图、后拆文件

```text
无图先拆目录  → Agent 仍自搜 → 「找规则」成本
有图再投影文件 → 搬家只改 AuthorityRef，边不变
```

Capability 边界（语义拆分）只细到 **图上需要独立触发的粒度**。不为对称或「一个文件一个能力」而拆。

## 分层（固定顺序，禁止跳层发明）

```text
L0  Always-on
      thin-entry · context-economy
      （及将来真正 always 的 invariant）
        ↓ 并入
L1  TaskClass → Capability+
      一对多；unknown → unmatched，不静默全表
        ↓ 叠加（不替换 L1）
L2  ContextFacet → Capability+
      trees / phase / artifacts / write_boundary
        ↓
L3  Capability → AuthorityRef+ 且可选 Control+
      读指令走 authority；跑保证走 control
        ↓
L4  RoutingResult
      always_on · capabilities · read_set · run_set · defer_set · unmatched
```

薄入口只消费 L4（或与 L4 同构的表）。不要在入口展开 L1–L3。

```text
                    ┌─ AuthorityRef (read)
 TaskClass ─┐       │
            ├─► Capability ─┼─ Control (run, 0..n)
 Facet ─────┘       │
 Always-on ─────────┘
```

横切（security、change-hygiene）挂在 **多个 TaskClass / Facet** 上，不挂进某一个 lifecycle 文件当唯一家。

## 节点类型

| 类型 | 身份 | 不是 |
| --- | --- | --- |
| **TaskClass** | 稳定枚举 id | 用户原话、一次会话全文 |
| **ContextFacet** | 四轴：`trees` · `phase` · `artifacts` · `write_boundary` | 自由标签云 |
| **Capability** | 可独立加载的执行关注面 | 目录、CTRL、整份 lifecycle |
| **AuthorityRef** | 语义指针（文件+节 / ADR / policy） | 文件身份本身 |
| **Control** | 可评价保证（ADR-0023） | Capability 的别名 |

禁止：Capability 1:1 等于一个 Markdown 文件；禁止 Capability 1:1 改名为 CTRL。

## 边类型（仅这五种）

| 边 | 从 → 到 | 语义 |
| --- | --- | --- |
| `always_on` | ⊤ → Capability | 每任务并入；失败不得卸掉 |
| `triggers` | TaskClass → Capability | L1 命中 |
| `facet_adds` | Facet → Capability | L2 叠加 |
| `has_authority` | Capability → AuthorityRef | 应读 |
| `binds` | Capability → Control | 应跑（可空） |

不建：段落依赖、句级 ontology、embedding 相似边、LLM 动态边。高价值关系才进图；其余保持普通文档。

## 解析算法（确定性）

输入：`task_class` + `context`（可空）。

```text
1. 归类：自然语言 → TaskClass；失败则 task_class=unknown
2. caps ← { C | always_on(C) }
3. 若 unknown：
     read_set ← Authority(caps)
     unmatched ← true
     defer_set ← ask-user / expand-entry
     停止（不跑全表）
4. caps ∪ { C | triggers(task_class, C) }
5. caps ∪ { C | facet_adds(f, C) for f in context }
6. 去重
7. 排序：always_on → task-triggered → facet → 其余
8. read_set ← flatten has_authority(caps) 按上序
9. run_set  ← flatten binds(caps)
10. 若 |read_set 的 capability 计数| > 预算（暂定 8）：
      尾部 capability 的 authority 进 defer_set
      run_set 中已命中 Control 不得因预算删除
11. unmatched ← false
```

Agent / 将来 Dispatcher **同一套解析**。5b 只是把本算法从查表变成程序，不另发明适用关系。

## 与 Control.applicability 的关系

两张表，允许对齐、禁止合并成一张。

| | Capability 图（本拓扑） | Control.applicability（ADR-0023） |
| --- | --- | --- |
| 问 | 现在该 **读** 哪类执行关注面？ | 现在该 **评价** 哪条保证？ |
| 消费者 | Agent read_set | gate / CI / 将来 Dispatcher run_set |
| 可空 | Capability 可不 bind Control | Control 可不对应长指令 |

共享 **facet 词汇**（trees / phase / write_boundary）为佳；不要求 id 一一对应。对齐方式仍开放（RESEARCH-0012 v4 开放项）。

## 物理拓扑（明确后置 · Phase 5c）

Phase 5 内部切片（索引；非独立 ADR Phase）：

| 切片 | 施工计划 | 做什么 |
| --- | --- | --- |
| **5a** | PLAN-0038 | 显式图 + 表征 + 薄入口指针 |
| **5b** | PLAN-0039 | Detector + 共享 `resolve` + CLI（同一张图） |
| **5c** | [PLAN-0040](../plans/archive/PLAN-0040-capability-physical-projection.md)（Implemented） | `references/` / 入口文件 **按 Capability 投影**；只改 `AuthorityRef` |

```text
调用拓扑（本文件 + map）     5a EXITED（PLAN-0038）
        ↓
薄入口指针消费 L4            PLAN-0038 P3
        ↓
Dispatcher 跑同一解析        5b EXITED（PLAN-0039）
        ↓
references/ 按 Capability 投影  5c P0–P2 EXITED（PLAN-0040）；leftover 延后
        ↓
**Phase 5 checkpoint EXITED** → Phase 6（[PLAN-0042](../plans/archive/PLAN-0042-invariant-based-testing.md) Implemented / EXITED）→ Phase 7（[PLAN-0043](../plans/archive/PLAN-0043-review-system-redesign.md) Active；须消费 [ADR-0024](../design-decisions/ADR-0024-gen2-product-freeze.md)）
```

未稳定前移动 `lifecycle.policy.md` 等 = **无路由拆分**（禁止）。

### Gen1 查找 vs 本图（对比裁决）

| | Generation 1（1.x / `main` 稳定产品） | 本调用拓扑（Gen2 施工权威） |
| --- | --- | --- |
| 查找模型 | 厚入口 + 目录/章节位置 + Agent 记忆与自搜 | `TaskClass` + Facet → Capability 集合 → Authority / Control |
| 「路由」实体 | **没有**独立 Task→Capability 适用图；trigger 词与目录充数 | 显式边 + 确定性解析（L4） |
| 文件角色 | 文件/章节 ≈ 能力边界（易把 lifecycle 当政策仓库） | 文件只是 `AuthorityRef` 的**当前投影**，**不是**图节点 |
| 横切能力 | 常内嵌进 lifecycle 某 Phase 小节 | 独立 Capability，由图挂到多个 Task/Facet |

结论：**不要另造第三套能力查找架构。** 5b/5c 只是把本图程序化并投影到磁盘；1.0 目录分类（按生成方式、按 lifecycle Phase 堆横切）**不得**再当查找权威。

### 5c 迁移纪律（投影时必须遵守）

1. **架构以本图为准；1.0 只提供可迁移的功能语义**（规则条文、保证、检查意图）。
2. **按 Capability 重排位置**，不按 1.0 目录树「细切开」装回旧骨架。
3. **搬家只改 `AuthorityRef`（及 INIT/生成契约中的路径）**；`always_on` / `triggers` / `facet_adds` / `binds` **不变**。边要变 → 先改 map + 表征，再搬家。
4. **横切不单挂一个 lifecycle 节点**（与 ADR-0022 目标形态一致）。
5. **禁止**无 map 命中面的「对称拆文件」。5c leftover 不重开 Phase 5。

5c **不是** Phase 6（正负 oracle），也不是 PLAN-0037 extraction。

## 演进规则

- 新增 TaskClass / Capability / 边 → 先改本架构是否仍够用，再改 map 与夹具
- 新边类型 = 新研究；默认拒绝
- **禁止**平行维护第二套 Task→Capability 查找模型（与 D1「一套解析」同族）
- 本图不承担科研回溯（那是 RESEARCH-0013 的对象链，on-demand）


### 路由表

# Task → Capability 路由表（工作稿 · PLAN-0038）

**权威级别：** 施工权威（RESEARCH-0012 假设已采纳 + PLAN-0038 Implemented；Phase 5 EXITED）。非正式 schema；升格 Narrow ADR 前不得当 INSTALLED 硬规范。  
**位置：** 本文件（一个 RESEARCH-0012）。**不**写入薄入口正文。  
**禁止（5a 完成时）：** LLM 自动路由 · 无路由文档搬家 · Active PLAN-0037。  
**5b：** 程序化查表 = [PLAN-0039](../plans/archive/PLAN-0039-context-detector-dispatcher.md)（**Implemented**；`repo-tools/routing-graph.v0.json` + `repo-tools/lib/routing.js` + `route-task.js`）。  
**5c：** [PLAN-0040](../plans/archive/PLAN-0040-capability-physical-projection.md)（**Implemented**）· 投影表 下文 § 投影表 · `routing-graph.v0.json` `authorities`。只改 `AuthorityRef`；不按 1.0 目录骨架细切。纪律：上文 § 物理拓扑。

架构见上文 § 调用拓扑。下文是该图的本仓实例。

## P0 — 冻结词汇（采纳）

采纳 RESEARCH-0012 v2 六问假设，无修订：

| # | 采纳结论 |
| --- | --- |
| Q1 | Task = `task_class` + 可选 context facets |
| Q2 | Capability = 可独立加载的执行关注面（非文件 / 非 CTRL / 非整份 lifecycle） |
| Q3 | Applicability = 显式表；非 Agent 临场发明 |
| Q4 | 默认一对多（集合） |
| Q5 | Capability 可 bind 0..n Control；禁止 1:1 改名 |
| Q6 | 输出 read_set / run_set / defer_set / unmatched |

超预算阈值（暂定）：单次任务 `read_set` 权威指针 **≤ 8**；超出部分进 `defer_set`，**不得**丢掉已命中机械 Control 的 `run_set`。

## P1 — 种子 `task_class`

最小枚举（可扩展；未知 → `unmatched`）：

| id | 含义 | 典型本仓场景 |
| --- | --- | --- |
| `edit_docs` | 改 `docs/` 知识/产品文档 | Research / Finding / ADR / Plan / roadmap |
| `edit_references` | 改 INSTALLED `references/` | policy / template / workflow |
| `edit_scripts` | 改 `scripts/` 或 `repo-tools/` | checker / gate |
| `edit_skill_entry` | 改 SKILL / AGENTS 薄入口 | 指针与 always-on |
| `git_write` | 暂存/提交/推送等写 git | 一次确认序列 |
| `release` | 发布/tag/skill-release | Phase 8 后才正式；迁移期观测 |
| `audit` | 只读巡检 / 一致性审计 | AUDIT · check |
| `research_write` | 新增/修订 Research | RESEARCH-xxxx |
| `finding_write` | 新增/修订 Finding | FINDING-xxxx |
| `adr_write` | 新增/修订 ADR | ADR-xxxx |
| `plan_write` | 新增/修订/归档 Plan | PLAN-xxxx |
| `repair` | 缺陷修复（含根因与同类闭合） | bug / gate red |
| `test_change` | 改测试或表征夹具 | `tests/` |
| `unknown` | 无法归类 | 必须 defer / 问用户 |

## P1 — 种子 Capability

每条：可路由执行关注面。`authority_ref` 为**当前**本仓指针（L3 实例，非 portable 硬编码目标）。

| id | 关注面 | authority_ref（本仓） | 典型 triggers | binds_controls（可选） | 对账 |
| --- | --- | --- | --- | --- | --- |
| `thin-entry` | 薄入口 / always-on | ADR-0022 · AGENTS/SKILL 入口 | always | — | keep |
| `context-economy` | 读集纪律 / 不重推 | ADR-0022 Context Economy · RESEARCH-0013 | always · 中大型任务 | — | keep |
| `doc-knowledge` | 知识对象路由与边界 | docs/README · RESEARCH-0007 · ADR-0016 | edit_docs · research_write · finding_write · adr_write · plan_write | — | keep |
| `change-hygiene` | 变更卫生 / 影响面 | `references/capabilities/change-hygiene.md` | edit_* · repair · git_write | — | keep |
| `reference-closure` | 引用闭合 / 安装后可达 | AGENTS Reference-closure · role-completeness | edit_references · edit_scripts · edit_skill_entry | — | keep |
| `git-write` | Git 写边界与确认 | git.policy | git_write · release | — | keep |
| `secret-protection` | 密钥/秘密扫描 | CTRL-0001 语义 · check-secrets | git_write · release · edit_scripts | CTRL-0001 | keep |
| `testing-evidence` | 测试与证据 | testing policy · tests | test_change · repair · edit_scripts | — | keep |
| `root-cause-repair` | 根因 / 同类闭合 | `references/capabilities/root-cause-repair.md` | repair | — | keep |
| `discovery-ledger` | 发现台账闭包 | `references/capabilities/discovery-ledger.md` | plan_write · repair · 中大型 TASK | — | keep |
| `plan-delivery` | Plan 交付声明 | plan-delivery gate | plan_write | CTRL plan-delivery（若绑定） | keep |
| `release-governance` | 发布/tag 纪律 | release workflow · skill-release | release | — | keep |
| `review-implementation` | 实现层审查（仅 Impl；非 System/Research） | review-manager（`sub-skills.md` §8） | audit · repair · 可选 | — | keep · must-ship |
| `review-system` | 系统/架构审查 | 本文件 § System Review | system_review | — | keep · repo-keep |
| `review-research` | 研究/评价审查 | 本文件 § Research Review | research_review | — | keep · repo-keep |
| `security-baseline` | 安全横切 | security.policy | edit_scripts · release · git_write | — | keep |
| `rule-capture` | 规则捕获进治理文件 | `references/capabilities/rule-capture.md` | repair · edit_references · edit_skill_entry | — | keep |

### Unaccounted / deferred（不得静默丢）

| 簇（RESEARCH-0006 族） | 处置 | revisit |
| --- | --- | --- |
| Governance State / lock / manifest 四态 | deferred | Phase 5b / 状态模型 Plan |
| Product Modes INIT/AUDIT/MIGRATE 全编排 | deferred | 非本切片；映射到 `audit`/`release` 局部即可 |
| Review System / Research 两类 | **keep（PLAN-0043）** | `review-system` / `review-research`；见 本文件 § Review 三类 |
| Translation / trilingual parity 专面 | deferred | 已有 doc-parity；能力升格另议 |
| Engineering Restraint 专面 | merge → `change-hygiene` + ADR-0022 | — |
| Generated sub-skill 生命周期机制 | deferred | 指令拓扑重构后 |

**P1 对账：** 上表 keep 行覆盖本切片施工所需；其余 deferred 有 revisit；Unaccounted（静默丢失）= 0。

## P2 — Task×Context → Capability（高价值）

图例：`A` = always_on 并入；`•` = 默认加入 read_set；空 = 不因该 task 触发。

| task_class | thin-entry | context-economy | doc-knowledge | change-hygiene | reference-closure | git-write | secret-protection | testing-evidence | root-cause-repair | discovery-ledger | plan-delivery | release-governance | review-implementation | security-baseline | rule-capture |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| always | A | A | | | | | | | | | | | | | |
| edit_docs | A | A | • | • | | | | | | • | | | | | |
| edit_references | A | A | | • | • | | | | | | | | | • | • |
| edit_scripts | A | A | | • | • | | • | • | | | | | | • | |
| edit_skill_entry | A | A | | • | • | | | | | | | | | | • |
| git_write | A | A | | • | | • | • | | | | | | | • | |
| release | A | A | | • | | • | • | • | | | | • | | • | |
| audit | A | A | • | | | | | | | | | | • | | |
| research_write | A | A | • | • | | | | | | • | | | | | |
| finding_write | A | A | • | • | | | | | | • | | | | | |
| adr_write | A | A | • | • | | | | | | • | | | | | |
| plan_write | A | A | • | • | | | | | | • | • | | | | |
| repair | A | A | | • | • | | | • | • | • | | | • | • | • |
| test_change | A | A | | • | | | | • | | | | | | | |
| unknown | A | A | | | | | | | | | | | | | |

Context facet 加码（叠加，不替换）：

| facet | 额外 capability |
| --- | --- |
| `trees ∋ references` | reference-closure |
| `trees ∋ scripts` 或 `repo-tools` | testing-evidence · secret-protection |
| `write_boundary ∈ {commit,tag,release}` | git-write · secret-protection |
| `write_boundary = release` | release-governance |
| `artifacts ∋ plan` 且中大型 | discovery-ledger · plan-delivery |
| `phase = validate` | testing-evidence |

## P2 — 表征夹具（≥5）

输入 → 期望（顺序：always_on 先行，其余按表；超出 8 的进 defer_set）。

### F1 `edit_docs`（改 RESEARCH）

```text
task_class: edit_docs
context: { trees:[docs], artifacts:[research] }
read_set: thin-entry, context-economy, doc-knowledge, change-hygiene, discovery-ledger
run_set: []   # 除非触及已绑定 CTRL
unmatched: false
```

### F2 `edit_scripts`（改 checker）

```text
task_class: edit_scripts
context: { trees:[scripts] }
read_set: thin-entry, context-economy, change-hygiene, reference-closure, secret-protection, testing-evidence, security-baseline
run_set: [CTRL-0001]  # 若改动触及秘密扫描面
unmatched: false
```

### F3 `git_write`

```text
task_class: git_write
context: { write_boundary: commit }
read_set: thin-entry, context-economy, change-hygiene, git-write, secret-protection, security-baseline
run_set: [CTRL-0001]
unmatched: false
```

### F4 `repair`（gate 失败修复）

```text
task_class: repair
context: { phase: implement }
# always(2)+triggers(8)=10 → 预算 8：尾部进 defer_set；不得删 run_set 机械项
read_set: thin-entry, context-economy, change-hygiene, reference-closure, testing-evidence, root-cause-repair, discovery-ledger, review-implementation
defer_set: security-baseline, rule-capture
run_set: []  # 依失败 CTRL 叠加
unmatched: false
```

### F5 `plan_write`（中大型 TASK）

```text
task_class: plan_write
context: { artifacts:[plan], phase: plan }
read_set: thin-entry, context-economy, doc-knowledge, change-hygiene, discovery-ledger, plan-delivery
run_set: []
unmatched: false
```

### F6 `unknown`

```text
task_class: unknown
read_set: thin-entry, context-economy
defer_set: [ask-user / expand-entry]
unmatched: true
```

## 失败模式登记

| 模式 | 定义 | 处置 |
| --- | --- | --- |
| unmatched | 无 task_class 或仅 unknown | 不静默全量加载；问用户 / defer |
| 过宽命中 | read_set > 8 | 按优先级裁进 defer_set；保留 run_set 机械项 |
| 复制型 capability | 如 `lifecycle` 整包 | 拒绝入库；拆回关注面 |
| 1:1 CTRL 冒充 capability | 规则行当 capability | 拒绝；挂到 binds_controls |

## 修订规则

- 增删 `task_class` / capability → 更新本文件 + PLAN-0038 Ledger + 表征夹具
- 不得在未改本表时声称「路由已变」
- P3 入口：仅 `AGENTS.md` 薄指针（repo-only）；**不**在 SKILL.md / INSTALLED 链本表

## 走读记录（2026-09-12）

| 夹具 | 结果 |
| --- | --- |
| F1 edit_docs | pass |
| F2 edit_scripts | pass |
| F3 git_write | pass |
| F4 repair | pass（10→预算8：security-baseline, rule-capture → defer_set） |
| F5 plan_write | pass |
| F6 unknown | pass（unmatched=true） |


### 投影表

# Capability → Authority 投影表（Phase 5c · PLAN-0040）

施工权威：本表 + `repo-tools/routing-graph.v0.json` `authorities`。人表摘要见上文 § 路由表 P1。  
纪律：上文 § 物理拓扑 — 只改 AuthorityRef；边不变。

| capability | slice | target_path（本仓权威文件） | installed（若有） |
| --- | --- | --- | --- |
| `thin-entry` | A | `docs/design-decisions/ADR-0022-agent-instruction-architecture.md` | — |
| `context-economy` | A | `docs/design-decisions/ADR-0022-agent-instruction-architecture.md` | — |
| `doc-knowledge` | A | `docs/README.md` | — |
| `change-hygiene` | B | `references/capabilities/change-hygiene.md` | `docs/rules/capabilities/change-hygiene.md` |
| `reference-closure` | A | `AGENTS.md` | — |
| `git-write` | C | `references/policies/git.policy.md` | — |
| `secret-protection` | C | `scripts/check-secrets.js` | — |
| `testing-evidence` | C | `references/policies/testing.policy.md` | — |
| `root-cause-repair` | B | `references/capabilities/root-cause-repair.md` | `docs/rules/capabilities/root-cause-repair.md` |
| `discovery-ledger` | B | `references/capabilities/discovery-ledger.md` | `docs/rules/capabilities/discovery-ledger.md` |
| `plan-delivery` | A | `repo-tools/check-plan-delivery.js` | — |
| `release-governance` | C | `references/workflows/release.md` | — |
| `review-implementation` | A | `references/templates/sub-skills.md` | — |
| `review-system` | A | 本文件 § System Review | —（repo-keep；非默认 INSTALLED） |
| `review-research` | A | 本文件 § Research Review | —（repo-keep；非默认 INSTALLED） |
| `security-baseline` | C | `references/policies/security.policy.md` | — |
| `rule-capture` | B | `references/capabilities/rule-capture.md` | `docs/rules/capabilities/rule-capture.md` |

**Slice：** A = authority 机读化；B = lifecycle 横切抽出（本计划主交付）；C = 1:1 域文件指针澄清（path 已写死，未强制 rename）。

**边冻结：** `always_on` / `triggers` / `facet_adds` / `binds` 不因本表变更。


### Review 三类

# Review 三类（施工权威 · PLAN-0043 / ADR-0024）

**权威级别：** 施工权威（Phase 7）。非正式 INSTALLED 规范全文。  
**产品边界：** [ADR-0024](../design-decisions/ADR-0024-gen2-product-freeze.md) — Implementation = `must-ship`；System / Research = `repo-keep`。  
**动机：** [ADR-0018](../design-decisions/ADR-0018-generation-2-dev-path.md) 决策 5 · [FINDING-0014](../findings/FINDING-0014-review-manager-layer-mismatch.md)。

## 三类（互斥问题集）

| 类 | Capability id | 问什么 | 产品档 | 权威 |
| --- | --- | --- | --- | --- |
| Implementation Review | `review-implementation` | 这次变更有没有具体缺陷（逻辑 / 安全 / 测试空洞 / 文档矛盾 / 治理工件） | must-ship | `references/templates/sub-skills.md` § review-manager |
| System Review | `review-system` | 架构 / control topology / producer–product 耦合 / 系统性过度工程是否在恶化 | repo-keep | 本文件 § System Review |
| Research Review | `review-research` | 我们如何理解与评价系统；证据是否支撑主张 | repo-keep | 本文件 § Research Review |

禁止：把 System/Research 的问题塞进 Implementation 五域再贴标签。  
禁止：把 System/Research 打进 INSTALLED 默认子技能（ADR-0024）。

## 触发（路由）

| 用户意图（例） | task_class | 默认 read Capability |
| --- | --- | --- |
| review this / 审核一下 / deep review（变更集缺陷） | `audit` | `review-implementation`（+ 既有 doc-knowledge 等） |
| system review / 架构审查 / control topology review | `system_review` | `review-system` |
| research review / 研究审查 / 评价框架审查 | `research_review` | `review-research` |

**负向不变量：** 默认 `audit` / 普通 `repair` **不得**静默把 `review-system` / `review-research` 全文加入 read_set。

## 默认工作流纪律

```text
Find → 取证 → 分类抽象层级 → 搜同类/系统实例 → 判根因
        → 再决定 remediation（修局部 vs 开 Finding vs 改架构）
```

System / Research：**默认只读至分类完成**（FINDING-0014）。Implementation 可按既有 review-manager 流程；发现疑似 L2+ 问题时 **升级** 到 System/Research，而不是在 Impl 五域里「顺便」做架构裁决。

## Finding Level（最小约定；全量工具化 later）

| 级 | 含义 | 典型去向 |
| --- | --- | --- |
| L0 | 局部缺陷 | Implementation 修复 |
| L1 | 机制缺口 | Finding / Control 补齐 |
| L2 | 控制缺口 | Finding + Control model |
| L3 | 架构缺口 | System Review → ADR/Plan |
| L4 | 研究问题 | Research Review → RESEARCH |

同一 L0 在多子系统重复出现 → 必须向上检查 L1+（FINDING-0014 关闭条件 5）。

## 与 Phase 8 / 2.0

本文件不授权重建 gate。Phase 7 Exit 只证明三类可加载且边界互斥。2.0 发布门槛仍是 ADR-0024。


### System Review

# System Review（repo-keep · PLAN-0043）

**档位：** ADR-0024 `repo-keep` — 本仓可运行；**不**进入 skill 默认子技能。  
**配对：** 本文件 § Review 三类 · 不要替代 [Implementation Review](../../references/templates/sub-skills.md)（§ review-manager）。

## 何时用

- 怀疑「局部越修越精致、整体不简单」
- producer / product 耦合、Control 拓扑、Dispatcher/适用性、迁移期双权威
- 连续多轮 Implementation Review 后用户仍感觉系统变重

## 不问什么

- 不把 PR 逐行 bug 清单当主输出（那是 Implementation）
- 不评价 RESEARCH 主张是否成立（那是 Research Review）
- 不借机 Active PLAN-0037 或重写全部 Gen1 gate

## 必问清单（固定；可增补备注，不可换成 Impl 五域）

1. **控制拓扑**：语义 / evaluator / gate / test 是否被混成一个文件或一个「全面审查」？
2. **所有权**：共享语义是否仍双写（repo vs skill）？ADR-0020 / ADR-0024 是否被绕过？
3. **适用性**：规则是否在错误 task_class 上静默加载（路由负向）？
4. **耦合**：repo-infra 修复是否未传播到 INSTALLED（或反向）？
5. **复杂度方向**：本次变更是降低注意力负担，还是增加必须记住的规则面？
6. **过度工程**：是否引入无当前需求证明的机制（工程克制）？
7. **迁移诚实性**：是否把 checkpoint 绿当成产品可用 / 2.0 可发？

## 工作流（默认只读）

1. 选定范围（子系统 / 路径 / 近期架构变更），**先不改代码**。
2. 对照上表取证（文件 + 节 + 行为）。
3. 每条发现标注 Finding Level（L0–L4，见 review-kinds）。
4. 搜同类实例；L0 复发 → 上查 L1+。
5. 输出：**分类后的 Finding/观察列表** + 建议处置（修局部 / 开 Finding / ADR / Plan）。**分类完成前禁止边审边修。**

## 输出模板

```text
System Review
范围: …
只读至分类: yes
发现:
- [Ln] 摘要 — 证据 — 建议处置
升级自 Impl（若有）: …
不做: INSTALLED 默认子技能化 / Phase 8 偷跑 / PLAN-0037
```

## 路由

- `task_class`: `system_review`
- Capability: `review-system`
- Authority: 本文件


### Research Review

# Research Review（repo-keep · PLAN-0043）

**档位：** ADR-0024 `repo-keep` — 本仓可运行；**不**进入 skill 默认子技能。  
**配对：** 本文件 § Review 三类 · 不替代 Implementation / System Review。

## 何时用

- 审查 RESEARCH / 评价框架 / 成熟度主张是否被证据支撑
- 问「我们如何理解这个系统」「机械绿是否被误当成语义正确」
- 对 Zero-Attention / 动态策略注入等研究问题做方法学检查

## 不问什么

- 不扫 PR 缺陷（Implementation）
- 不直接裁决架构迁移动线（可建议开 System Review 或 ADR；本类不代替 ADR）
- 不把「测试数量」当作研究结论

## 必问清单

1. **主张 ↔ 证据**：文中主张是否指向可核验证据（文件 / 测量 / Finding）？
2. **层混淆**：是否把 Research 描述写成 ADR 规范或 Plan 施工？
3. **指标诚实**：是否用 N/N tests 或 checker 绿代替 invariant / oracle 覆盖？
4. **可证伪性**：结论怎样会被证伪？有没有负向证据路径？
5. **范围**：是否把 later/deferred 写成已交付？
6. **注意力模型**：是否假设 Agent 会稳定记住长规则，而无机械兜底？

## 工作流（默认只读）

1. 选定 RESEARCH / 评价文档 / 主张集合。
2. 逐条映射主张 → 证据；缺口记为 L4（或 L2 若已伪装成控制）。
3. 输出：主张表 + 证据缺口 + 建议（补 RESEARCH / 开 Finding / 降级措辞）。**分类完成前不改产品行为。**

## 输出模板

```text
Research Review
范围: …
只读至分类: yes
主张检查:
- 主张 — 证据 — 缺口 — 建议
不做: 伪装成 PR review / 偷跑 Phase 8 / Active PLAN-0037
```

## 路由

- `task_class`: `system_review` 的对称类 `research_review`
- Capability: `review-research`
- Authority: 本文件