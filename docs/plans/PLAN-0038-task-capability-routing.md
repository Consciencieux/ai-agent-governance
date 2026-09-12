---
id: PLAN-0038
status: Implemented
generation: gen2
target: both
---

# PLAN-0038：Phase 5 Task→Capability 适用路由（显式映射）

> **Status: Implemented**（Phase 5a EXITED。调用拓扑 + 显式 map + 表征套件 + AGENTS 薄指针已落地。Dispatcher / 物理投影已由 PLAN-0039 / PLAN-0040 完成。**Phase 5 checkpoint EXITED**（见 PLAN-0040 § Phase 5 Exit Criteria）。**未** Active PLAN-0037。Architecture checkpoint ≠ Release；归档另按 ADR-0016。）

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
AGENTS 薄指针（repo-only；非 INSTALLED）
        ↓
再谈 Dispatcher（5b）/ 物理拓扑；PLAN-0037 仍冻结
```

## 范围（In）

- 种子 `task_class` 枚举与归类约定
- 种子 capability 清单（Authority 指针；可选 binds_controls）
- 显式 applicability 映射（陈述式；人工维护）
- RoutingResult 形状（read_set / run_set / defer_set / unmatched）
- 表征夹具：≥5 个典型任务 + `tests/suites/routing.test.js`
- AGENTS.md 指针（repo-only）
- roadmap / RESEARCH-0012 同步

## 非目标（Out）

```text
runtime Context Detector / Dispatcher / LLM 自动路由
references/ 或 docs/ 大规模搬家
把所有规则 Control 化
PLAN-0037 extraction / 发布通用 skill
完整 Phase 6 oracle 体系
知识图谱 / 句级 ontology
SKILL.md 写入 docs/ 路径（违反 reference-closure）
```

## 前置条件

1. RESEARCH-0012 v2 六问工作假设经审查 — **已满足（2026-09-12 采纳，无修订）**
2. Phase 4 EXITED — 已满足
3. 不阻塞于 consistency cluster 残留 / #9 SKIP — 已满足

## 施工权威文件

| 产物 | 路径 | 状态 |
| --- | --- | --- |
| 调用拓扑架构 | `docs/research/working/routing/call-topology.md` | v0 Working |
| 路由工作稿（种子 + 映射 + 夹具） | `docs/research/working/routing/task-capability-map.md` | v0 Working |
| 确定性解析表征 | `tests/suites/routing.test.js` | 7/7 pass |
| 假设来源 | `docs/research/RESEARCH-0012-task-capability-routing.md` | Active v3 |
| 薄入口指针 | `AGENTS.md` § Task→Capability routing | repo-only |

## 交付阶段

### P0 — 冻结词汇 — Done

- [x] 采纳 RESEARCH-0012 Q1–Q6（无修订）
- [x] 记录于 routing map § P0；不升格 Narrow ADR（施工权威 = RESEARCH + 本计划 + map）

### P1 — 种子清单 — Done（v0）

- [x] `task_class` 最小枚举（含 `unknown`）
- [x] capability 种子 + RESEARCH-0006 族 deferred 对账；静默 Unaccounted = 0

### P2 — 显式映射 + 表征 — Done

- [x] Task×Capability 触发表 + Context facet 加码
- [x] 表征夹具 F1–F6 + 人工走读
- [x] `routing` 测试套件：确定性解析对齐 call-topology（预算裁剪不丢 bound Control）

### P3 — 入口消费 — Done（窄）

- [x] `AGENTS.md` 原则索引 + § Task→Capability routing（指针 only）
- [x] **不**写入 `SKILL.md`（map 在 `docs/`，INSTALLED 不可引用）

## 完成条件（exit）

- [x] P0–P3 完成
- [x] 表征套件绿
- [x] 无 Dispatcher；无大规模拓扑搬家；未 Active PLAN-0037
- [x] Ledger：Open=0；Unaccounted=0

## Successor

Phase **5b**：[PLAN-0039](PLAN-0039-context-detector-dispatcher.md)（**Implemented**）。Phase **5c**：[PLAN-0040](PLAN-0040-capability-physical-projection.md)（**Implemented**）。**Phase 5 EXITED**；下一入口 Phase 6（计划待立）。

## Domain sync（Target: both）

| Domain | 同步点 |
| --- | --- |
| repo-infra | RESEARCH-0012、roadmap、本计划、`docs/research/working/routing/*`、AGENTS.md、`tests/suites/routing.test.js` |
| payload | **未**写入 INSTALLED；5b/Narrow ADR 前保持 repo-only |

## 受影响文件

- `docs/research/RESEARCH-0012-task-capability-routing.md`
- `docs/research/working/routing/task-capability-map.md`
- `docs/research/working/routing/call-topology.md`
- `docs/research/working/routing/README.md`
- `docs/plans/roadmap/{en,zh-CN,zh-TW}.md`
- `docs/plans/PLAN-0038-task-capability-routing.md`（本文件）
- `AGENTS.md`
- `tests/run-tests.js` · `tests/suites/routing.test.js`
- `CHANGELOG.md`

## 发现台账（Discovery Ledger）

| 标识（ID） | 类型 | 来源 | 问题 | 影响面 | 严重度 | 状态 | 处置 | 责任人 | 验证/证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R0 | observation | research | 无显式 Task→Capability 映射 | both | high | closed | resolved | — | routing map v0 |
| R1 | observation | review | Capability 过粗/过细会污染提取 | skill | med | closed | deferred | — | revisit: 0037 / map 修订 |
| R2 | observation | design | Dispatcher 易被提前实现 | both | med | closed | resolved | — | PLAN-0039 Implemented；未另造适用关系 |
| R3 | observation | construction | 超预算裁剪启发式需走读验证 | both | med | closed | resolved | — | routing suite F4 |
| R4 | observation | design | PLAN-0037 误为 2.0 必达 | both | high | closed | deferred | — | 0037 Design 冻结 |
| R5 | observation | construction | SKILL 不可链 docs/ 路由表 | payload | med | closed | resolved | — | P3 仅 AGENTS |

## 闭包对账

```text
Total known:  6
Resolved:     4  (R0, R2, R3, R5)
Deferred:     2  (R1, R4)
Open:         0
Unaccounted:  0
```

## 参考

- RESEARCH-0012 v3 · ADR-0018 Phase 5 · ADR-0022 · ADR-0023
- RESEARCH-0006 / 0009 · PLAN-0035 / 0036 · PLAN-0037（冻结）
