---
id: PLAN-0039
status: Design
generation: gen2
target: repo-infra
---

# PLAN-0039：Phase 5b Context Detector / Dispatcher

> **Status: Design**（待批准后 Active。消费 PLAN-0038 / 调用拓扑同一张图；把「查表 → RoutingResult」从人工走读变成**可调用程序**。**不**另发明适用关系；**不**全自动 LLM 路由；**不**搬物理拓扑；**不** Active PLAN-0037。）

把 5a 的确定性解析（`call-topology.md` L4）做成 **repo-only 可执行入口**：Context Detector 归类任务，Dispatcher 输出 `read_set` / `run_set` / `defer_set` / `unmatched`。

## 目标

```text
PLAN-0038 Implemented（图 + 表征 + AGENTS 指针）
        ↓
机器可读图投影（与 map 同源；测试不再分叉硬编码）
        ↓
resolve() = call-topology 解析算法（唯一实现）
        ↓
Context Detector（机械启发式优先）→ task_class + facets
        ↓
CLI / 模块：查表决定应读 / 应跑
        ↓
AGENTS 消费「先 route 再读」
        ↓
（后）物理拓扑投影 · Narrow ADR · payload 升格 — 本计划外或可选尾声
```

## 范围（In）

- **共享 `resolve(task_class, context) → RoutingResult`**：算法权威 = `docs/research/routing/call-topology.md`；数据权威 = `task-capability-map.md` 的机器投影
- **机器可读图**：triggers / always_on / facet_adds / binds / authority 投影；禁止测试与 CLI 各维护一份逻辑
- **Context Detector（窄）**：路径 / 写边界 / 工件提示 → `task_class` + facets；显式 `--task` 优先；失败 → `unknown` + `unmatched`（问用户 / defer）
- **Dispatcher CLI（repo-only）**：例 `node repo-tools/route-task.js …` 打印 L4 JSON / 人类可读摘要
- **表征**：现有 `routing` suite 改为调共享模块；Detector 另加 ≥3 夹具
- **AGENTS.md**：薄指针改为「先跑 route / 再读 read_set」（仍不写 SKILL.md → docs/）

## 非目标（Out）

```text
全自动 LLM 路由 / 向量检索选 capability
另造第二套 applicability（与 map 分叉）
references/ 或 docs/ 大规模搬家
把 Dispatcher 写入 INSTALLED 载荷（本切片默认 repo-only）
Active PLAN-0037 / 2.0 skill-release
Phase 6 正负 oracle 体系
知识图谱 / 句级 ontology
合并 Capability 图与 Control.applicability 成一张表
```

## 前置条件

1. PLAN-0038 Implemented — **已满足**
2. `call-topology.md` + `task-capability-map.md` + `routing` suite 绿 — **已满足**
3. 本 Design 获用户批准后才 Active / 写代码

## 设计裁决（本计划冻结）

| # | 裁决 |
| --- | --- |
| D1 | **一套解析**：Agent 手查与 Dispatcher 程序必须同算法同图；分叉 = 缺陷 |
| D2 | **机械优先**：Detector 用路径启发式 + 显式覆盖；LLM 归类不进本切片 |
| D3 | **map 为人权威，投影为机权威**：改边先改 `task-capability-map.md`，再更新投影；CI/表征对投影 |
| D4 | **repo-only**：产物落在 `repo-tools/` + `docs/research/routing/` + `tests/`；不进 tarball |
| D5 | **预算规则不变**：read 预算 8；不得因预算丢掉已命中 `run_set` Control |

## 交付阶段

### P0 — 契约冻结

- [ ] 批准本 Design → `status: Active`
- [ ] 固定 CLI/模块 I/O：`RoutingResult` 字段与 call-topology L4 对齐
- [ ] 选定投影路径（建议：`docs/research/routing/graph.v0.json` 或 `repo-tools/lib/routing-graph.js` 由 map 手工同步；本切片不建 markdown→json 生成器 unless 便宜）

### P1 — 共享 resolve + 去分叉

- [ ] 抽出 `resolve`（从 `tests/suites/routing.test.js` 硬编码图迁出）
- [ ] 投影与 map v0 对账（triggers / facet / binds / budget）
- [ ] `routing` suite 改调共享模块；7 夹具仍绿

### P2 — Context Detector

- [ ] 启发式：路径前缀 → `trees` / 候选 `task_class`；`write_boundary` 由 flag 或 git 意图词
- [ ] 多树冲突 / 无法唯一归类 → `unknown`（不静默猜）
- [ ] Detector 表征夹具 ≥3（含 unmatched）

### P3 — Dispatcher CLI + 入口

- [ ] `repo-tools/route-task.js`（名称可微调）：输入 task/context → 打印 RoutingResult
- [ ] `AGENTS.md` § Task→Capability：要求本仓施工先 route 再读
- [ ] `docs/research/routing/README.md` 标明 5b 消费方式

### P4 — Exit

- [ ] Ledger Open=0；Unaccounted=0
- [ ] roadmap ×3：5b Implemented；下一入口 Phase 6 或物理拓扑决策切片
- [ ] CHANGELOG（行为：可调用 route）；Narrow ADR **可选**（映射已稳且要升格时再开）

## 完成条件（exit）

- [ ] P0–P4 完成
- [ ] `node tests/run-tests.js --suite routing` 绿（含共享模块）
- [ ] CLI 对 F1–F6 等价输入给出与表征一致的 L4
- [ ] 无 LLM 自动路由；无大规模搬家；未 Active PLAN-0037；未写入 INSTALLED

## Successor

打开条件：本计划 Implemented。顺序偏好（非强制二选一锁死，但 **5c 不得早于 5b**）：

1. **Phase 5c — 物理拓扑投影**（另开 Plan）：`references/` 等 **按 Capability 重排**；只改 `AuthorityRef`；纪律全文见 `docs/research/routing/call-topology.md` § 物理拓扑。**不**按 1.0 目录骨架细切；**不**另造查找架构。
2. Phase **6** Invariant-based Testing（正负 oracle）——可与 5c 交错，但 5c 不是 Phase 6。
3. Narrow ADR：routing 权威表示升格（若要进 payload / SKILL 指针）。

## Domain sync（Target: repo-infra）

| Domain | 同步点 |
| --- | --- |
| repo-infra | 本计划、roadmap、`docs/research/routing/*`、投影、`repo-tools/route-task.js`（或同等）、`tests/suites/routing*.js`、AGENTS.md、CHANGELOG |
| payload | **本切片不写** INSTALLED / SKILL.md docs 链 |

## 受影响文件

- `docs/plans/PLAN-0039-context-detector-dispatcher.md`（本文件）
- `docs/plans/roadmap/{en,zh-CN,zh-TW}.md`
- `docs/research/RESEARCH-0012-task-capability-routing.md`
- `docs/research/routing/{README,call-topology,task-capability-map}.md`
- `docs/research/routing/graph.v0.json`（或同等投影；P0 定名）
- `repo-tools/`（resolve 模块 + `route-task.js`）
- `tests/suites/routing.test.js`（及可选 `routing-detector.test.js`）
- `tests/run-tests.js`
- `AGENTS.md`
- `CHANGELOG.md`（P4）

## 发现台账（Discovery Ledger）

| 标识（ID） | 类型 | 来源 | 问题 | 影响面 | 严重度 | 状态 | 处置 | 责任人 | 验证/证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D0 | observation | PLAN-0038 | 解析逻辑与 map 分叉（测试硬编码） | repo | high | open | — | — | revisit: P1 |
| D1 | observation | RESEARCH-0012 | Detector 过宽会静默错分 task_class | repo | med | open | — | — | revisit: P2 unmatched 纪律 |
| D2 | observation | design | JSON 投影与 md 双写漂移 | repo | med | open | — | — | revisit: P1 对账夹具 |
| D3 | observation | ADR-0020 | 过早写入 INSTALLED 破坏 reference-closure | payload | high | open | deferred | — | Out；revisit: Narrow ADR |
| D4 | observation | PLAN-0038 R1 | Capability 粒度仍可能过粗/过细 | skill | med | open | deferred | — | revisit: 0037 / map 修订 |

## 闭包对账

```text
Total known:  5
Resolved:     0
Deferred:     2  (D3, D4)
Open:         3  (D0, D1, D2)
Unaccounted:  0
```

## 参考

- RESEARCH-0012 · `call-topology.md` · `task-capability-map.md`
- PLAN-0038 Implemented · PLAN-0035 Phase 5 交接命题
- ADR-0022 Context Economy · ADR-0023 Control（分表，不合并）
