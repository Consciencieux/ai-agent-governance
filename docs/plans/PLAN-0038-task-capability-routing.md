---
id: PLAN-0038
status: Active
generation: gen2
target: both
---

# PLAN-0038：Phase 5 Task→Capability 适用路由（显式映射）

> **Status: Active**（Phase 5a 施工。RESEARCH-0012 v2 六问假设已采纳。**不**实现 Dispatcher；**不**搬文档物理拓扑；**不** Active PLAN-0037——0037 冻结至 2.0 后。）

把 RESEARCH-0012 的 Task / Capability / Applicability / Routing 工作假设落成 **人工可维护的显式映射 + 表征验证**，使薄入口能消费稳定 read-set。

## 目标

```text
RESEARCH-0012 假设已采纳
        ↓
种子 task_class + capability 清单
        ↓
显式 Task×Context → Capability 映射表
        ↓
表征：已知任务 → 稳定 read-set / run-set
        ↓
（可选）入口指针 / Narrow ADR
        ↓
再谈 Dispatcher（5b）/ 物理拓扑；PLAN-0037 仍冻结
```

## 范围（In）

- 种子 `task_class` 枚举与归类约定
- 种子 capability 清单（Authority 指针；可选 binds_controls）
- 显式 applicability 映射（陈述式；人工维护）
- RoutingResult 形状（read_set / run_set / defer_set / unmatched）
- 表征夹具：≥5 个典型任务
- roadmap / RESEARCH-0012 同步

## 非目标（Out）

```text
runtime Context Detector / Dispatcher / LLM 自动路由
references/ 或 docs/ 大规模搬家
把所有规则 Control 化
PLAN-0037 extraction / 发布通用 skill
完整 Phase 6 oracle 体系
知识图谱 / 句级 ontology
```

## 前置条件

1. RESEARCH-0012 v2 六问工作假设经审查 — **已满足（2026-09-12 采纳，无修订）**
2. Phase 4 EXITED — 已满足
3. 不阻塞于 consistency cluster 残留 / #9 SKIP — 已满足

## 施工权威文件

| 产物 | 路径 | 状态 |
| --- | --- | --- |
| 路由工作稿（种子 + 映射 + 夹具） | `docs/research/routing/task-capability-map.md` | v0 Working |
| 调用拓扑架构 | `docs/research/routing/call-topology.md` | v0 Working |
| 假设来源 | `docs/research/RESEARCH-0012-task-capability-routing.md` | Active v3；P0 已采纳；含拓扑分层 |

## 交付阶段

### P0 — 冻结词汇 — Done

- [x] 采纳 RESEARCH-0012 Q1–Q6（无修订）
- [x] 记录于 routing map § P0；不升格 Narrow ADR（施工权威 = RESEARCH + 本计划 + map）

### P1 — 种子清单 — Done（v0）

- [x] `task_class` 最小枚举（含 `unknown`）
- [x] capability 种子 + RESEARCH-0006 族 deferred 对账；静默 Unaccounted = 0
- [ ] 用户/下一轮审查可修订种子（不阻塞 P2 夹具）

### P2 — 显式映射 + 表征 — Done（v0 走读）

- [x] Task×Capability 触发表（高价值）
- [x] Context facet 加码规则
- [x] 表征夹具 F1–F6
- [x] 人工走读夹具（2026-09-12）：F1–F3/F5/F6 与表一致；F4 `repair` 超 8 → review-implementation / security-baseline / rule-capture 进 defer_set，机械 run_set 保留规则成立
- [x] 失败模式已登记

### P3 — 入口消费（可选） — Not started

- 仅当 P2 走读通过：AGENTS/SKILL **指针**指向 map，不塞表正文
- 禁止借机重写 lifecycle

## 完成条件（exit）

- [x] P0 假设已审查并记录
- [x] 种子清单存在且 deferred 有 revisit
- [x] 表征夹具走读通过（v0）
- [x] 无 Dispatcher；无大规模拓扑搬家；未 Active PLAN-0037
- [x] Ledger：Open=0；Unaccounted=0（R1/R2/R4 deferred 有 revisit）

## Domain sync（Target: both）

| Domain | 同步点 |
| --- | --- |
| repo-infra | RESEARCH-0012、roadmap、本计划、`docs/research/routing/*` |
| payload | P3 前保持 repo-only 映射；写入 INSTALLED 指针须 reference-closure |

## 受影响文件

- `docs/research/RESEARCH-0012-task-capability-routing.md`
- `docs/research/routing/task-capability-map.md`
- `docs/research/routing/call-topology.md`
- `docs/research/routing/README.md`
- `docs/plans/roadmap/{en,zh-CN,zh-TW}.md`
- `docs/plans/PLAN-0038-task-capability-routing.md`（本文件）
- （P3 可选）AGENTS.md / SKILL.md 指针
- CHANGELOG（行为入口指针落地时）

## 发现台账（Discovery Ledger）

| 标识（ID） | 类型 | 来源 | 问题 | 影响面 | 严重度 | 状态 | 处置 | 责任人 | 验证/证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R0 | observation | research | 无显式 Task→Capability 映射 | both | high | closed | resolved | — | routing map v0 |
| R1 | observation | review | Capability 过粗/过细会污染提取 | skill | med | closed | deferred | — | revisit: 5b/0037；0037 已冻结 |
| R2 | observation | design | Dispatcher 易被提前实现 | both | med | closed | deferred | — | revisit: 5b；Out of scope |
| R3 | observation | construction | 超预算裁剪阈值需走读验证 | both | med | closed | resolved | — | F4 走读：超 8 进 defer_set |
| R4 | observation | design | PLAN-0037 误为 2.0 必达 | both | high | closed | deferred | — | 0037 Design 冻结；2.0 后解冻 |

## 闭包对账

```text
Total known:  5
Resolved:     2  (R0, R3)
Deferred:     3  (R1, R2, R4)
Open:         0
Unaccounted:  0
```

## 参考

- RESEARCH-0012 v2 · ADR-0018 Phase 5 · ADR-0022 · ADR-0023
- RESEARCH-0006 / 0009 · PLAN-0035 / 0036 · PLAN-0037（冻结）
