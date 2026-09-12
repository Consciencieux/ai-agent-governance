---
id: PLAN-0039
status: Archived
generation: gen2
target: repo-infra
---

# PLAN-0039：Phase 5b Context Detector / Dispatcher

> （已归档。Phase checkpoint EXITED；按 ADR-0016 于 lifecycle closure 移入 archive。Plan archive ≠ Release。）

> **Status: Implemented**（Phase 5b EXITED。共享 `resolve` + Context Detector + `repo-tools/route-task.js` 已落地；消费 PLAN-0038 同一张图。物理投影已由 PLAN-0040 完成。**Phase 5 checkpoint EXITED**（见 PLAN-0040 § Phase 5 Exit Criteria）。**未**另造适用关系；**未** LLM 自动路由；**未** Active PLAN-0037。Architecture checkpoint ≠ Release。）

把 5a 的确定性解析（`call-topology.md` L4）做成 **repo-only 可执行入口**：Context Detector 归类任务，Dispatcher 输出 `read_set` / `run_set` / `defer_set` / `unmatched`。

## 目标

```text
PLAN-0038 Implemented（图 + 表征 + AGENTS 指针）
        ↓
机器可读图投影 graph.v0.json（与 map 同源）
        ↓
resolve() = call-topology 解析算法（唯一实现）
        ↓
Context Detector（机械启发式）→ task_class + facets
        ↓
CLI：node repo-tools/route-task.js
        ↓
AGENTS 消费「先 route 再读」
```

## 交付记录

| 产物 | 路径 |
| --- | --- |
| 机器图投影 | `docs/research/working/routing/graph.v0.json` |
| 共享模块 | `repo-tools/lib/routing.js`（`resolve` / `detect` / `route`） |
| Dispatcher CLI | `repo-tools/route-task.js` |
| 表征 | `tests/suites/routing.test.js`（F1–F6 + D1–D3 + route shape；11/11） |

## 设计裁决（已冻结）

| # | 裁决 |
| --- | --- |
| D1 | 一套解析：手查与程序同算法同图 |
| D2 | Detector 机械优先；LLM 归类不进本切片 |
| D3 | map 为人权威，`graph.v0.json` 为机权威 |
| D4 | repo-only；不进 tarball |
| D5 | read 预算 8；不得因预算丢掉已命中 `run_set` Control |

## 阶段勾选

### P0 — 契约冻结 — Done

- [x] Design 批准 → Active → Implemented
- [x] RoutingResult 字段与 call-topology L4 对齐
- [x] 投影路径：`docs/research/working/routing/graph.v0.json`

### P1 — 共享 resolve + 去分叉 — Done

- [x] `repo-tools/lib/routing.js` `resolve`
- [x] 投影与 map v0 对账（triggers / facet / binds / budget）
- [x] `routing` suite 改调共享模块

### P2 — Context Detector — Done

- [x] 路径启发式 + 显式 `--task`
- [x] 多树冲突 → `unknown`
- [x] Detector 夹具 D1–D3

### P3 — CLI + 入口 — Done

- [x] `repo-tools/route-task.js`
- [x] AGENTS.md 先 route 再读
- [x] `docs/research/working/routing/README.md` 5b 消费方式

### P4 — Exit — Done

- [x] Ledger Open 项在本切片内关闭或仍 deferred（见下）
- [x] roadmap ×3：5b Implemented；下一入口 5c 或 Phase 6
- [x] CHANGELOG

## 完成条件（exit）

- [x] P0–P4 完成
- [x] `node tests/run-tests.js --suite routing` 绿
- [x] CLI 对 F 等价输入与表征一致
- [x] 无 LLM 自动路由；无大规模搬家；未 Active PLAN-0037；未写入 INSTALLED

## Successor

1. **Phase 5c** — [PLAN-0040](PLAN-0040-capability-physical-projection.md)（**Implemented**）。**Phase 5 EXITED**。
2. Phase **6** Invariant-based Testing（[PLAN-0042](PLAN-0042-invariant-based-testing.md) Implemented / EXITED）
3. Narrow ADR（routing 升格进 payload 时）
4. 5c leftover Capability 叶 / 可选 rename（不重开 Phase 5）

## Domain sync（Target: repo-infra）

| Domain | 同步点 |
| --- | --- |
| repo-infra | 本计划、roadmap、routing/*、graph.v0.json、repo-tools/lib/routing.js、route-task.js、tests/suites/routing.test.js、AGENTS.md、CHANGELOG、architecture ×3 |
| payload | **未写** INSTALLED |

## 发现台账（Discovery Ledger）

| 标识（ID） | 类型 | 来源 | 问题 | 影响面 | 严重度 | 状态 | 处置 | 责任人 | 验证/证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D0 | observation | PLAN-0038 | 解析逻辑与 map 分叉（测试硬编码） | repo | high | closed | resolved | — | shared `routing.js` + graph.v0.json |
| D1 | observation | RESEARCH-0012 | Detector 过宽会静默错分 task_class | repo | med | closed | resolved | — | conflict → unknown；D3 夹具 |
| D2 | observation | design | JSON 投影与 md 双写漂移 | repo | med | closed | resolved | — | 表征锁投影；改边先改 map 再改 JSON |
| D3 | observation | ADR-0020 | 过早写入 INSTALLED 破坏 reference-closure | payload | high | closed | deferred | — | Out；revisit: Narrow ADR |
| D4 | observation | PLAN-0038 R1 | Capability 粒度仍可能过粗/过细 | skill | med | closed | deferred | — | revisit: 0037 / map 修订 |

## 闭包对账

```text
Total known:  5
Resolved:     3  (D0, D1, D2)
Deferred:     2  (D3, D4)
Open:         0
Unaccounted:  0
```

## 参考

- RESEARCH-0012 · `call-topology.md` · `task-capability-map.md` · `graph.v0.json`
- PLAN-0038 Implemented · ADR-0022 · ADR-0023
