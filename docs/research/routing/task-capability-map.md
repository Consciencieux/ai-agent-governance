---
id: ROUTING-MAP-0012
status: Working
plan: PLAN-0038
research: RESEARCH-0012
version: 0
authority: construction
---

# Task → Capability 路由表（工作稿 · PLAN-0038）

**权威级别：** 施工权威（RESEARCH-0012 假设已采纳 + PLAN-0038 Active）。非正式 schema；升格 Narrow ADR 前不得当 INSTALLED 硬规范。  
**位置：** repo-only（`docs/research/routing/`）。**不**写入薄入口正文。  
**禁止：** Dispatcher runtime · LLM 自动路由 · 无路由文档搬家 · Active PLAN-0037。

架构（节点/边/解析）：`call-topology.md`。本文件是该图的本仓实例。

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
| `change-hygiene` | 变更卫生 / 影响面 | lifecycle / coding policy 相关节 | edit_* · repair · git_write | — | keep |
| `reference-closure` | 引用闭合 / 安装后可达 | AGENTS Reference-closure · role-completeness | edit_references · edit_scripts · edit_skill_entry | — | keep |
| `git-write` | Git 写边界与确认 | git.policy | git_write · release | — | keep |
| `secret-protection` | 密钥/秘密扫描 | CTRL-0001 语义 · check-secrets | git_write · release · edit_scripts | CTRL-0001 | keep |
| `testing-evidence` | 测试与证据 | testing policy · tests | test_change · repair · edit_scripts | — | keep |
| `root-cause-repair` | 根因 / 同类闭合 | lifecycle 根因协议 · ADR-0021 相关 | repair | — | keep |
| `discovery-ledger` | 发现台账闭包 | lifecycle Discovery Ledger · ADR-0021 | plan_write · repair · 中大型 TASK | — | keep |
| `plan-delivery` | Plan 交付声明 | plan-delivery gate | plan_write | CTRL plan-delivery（若绑定） | keep |
| `release-governance` | 发布/tag 纪律 | release workflow · skill-release | release | — | keep |
| `review-implementation` | 实现层审查 | review-manager（Impl） | audit · repair · 可选 | — | keep |
| `security-baseline` | 安全横切 | security.policy | edit_scripts · release · git_write | — | keep |
| `rule-capture` | 规则捕获进治理文件 | lifecycle Rule Capture | repair · edit_references · edit_skill_entry | — | keep |

### Unaccounted / deferred（不得静默丢）

| 簇（RESEARCH-0006 族） | 处置 | revisit |
| --- | --- | --- |
| Governance State / lock / manifest 四态 | deferred | Phase 5b / 状态模型 Plan |
| Product Modes INIT/AUDIT/MIGRATE 全编排 | deferred | 非本切片；映射到 `audit`/`release` 局部即可 |
| Review System / Research 两类 | deferred | Phase 7 |
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
read_set: thin-entry, context-economy, change-hygiene, reference-closure, testing-evidence, root-cause-repair, discovery-ledger
defer_set: review-implementation, security-baseline, rule-capture  # 超预算示例
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
- INSTALLED 指针消费留待 PLAN-0038 P3（可选）

## 走读记录（2026-09-12）

| 夹具 | 结果 |
| --- | --- |
| F1 edit_docs | pass |
| F2 edit_scripts | pass |
| F3 git_write | pass |
| F4 repair | pass（>8 → defer_set；run_set 机械项保留） |
| F5 plan_write | pass |
| F6 unknown | pass（unmatched=true） |
