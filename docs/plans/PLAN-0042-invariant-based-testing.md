---
id: PLAN-0042
status: Implemented
generation: gen2
target: repo-infra
---

# PLAN-0042：Phase 6 Invariant-based Testing

> **Status: Implemented**（P0–P4 完成。**Phase 6 checkpoint EXITED**。前置：Phase 5 EXITED。Architecture checkpoint ≠ Release；PLAN-0037 仍冻结。）

把成熟度从「N/N tests passed」改成可点名的 **Rule protection / Negative oracle coverage**。

权威约束（摘要，不重裁）：ADR-0018 决策 6 · ADR-0023 决策 2（semantics ≠ evaluator ≠ gate ≠ test）· PLAN-0035「Phase 5 vs Phase 6」表 · RESEARCH-0003 · FINDING-0006。

## 目标

```text
Phase 5 EXITED（图 + resolve + Slice B 投影）
        ↓
oracle 契约（什么算、什么不算）
        ↓
覆盖台账：CTRL / 路由不变量 → 已有夹具 / 缺口
        ↓
路由负向命中（Phase 5 表征升级为 oracle）
        ↓
CTRL-0001–0006 缺口补齐（不重写全部 suite）
        ↓
覆盖计数可查询；FINDING-0006 按种子集部分关闭或仍 Confirmed
```

## 现状

| 观察 | 含义 |
| --- | --- |
| 表征套件已多 | `security` / `docs` / `plan-delivery` / `consistency` / Safety Kernel 测「脚本今天这样跑」 |
| 不等于 oracle | 破坏义务必须变红；测试不得抄 evaluator 正则当第二权威（ADR-0023） |
| 路由套件 | [tests/suites/routing.test.js](../../tests/suites/routing.test.js) 以正向表征为主 |
| FINDING-0006 | Confirmed；E02 stack defaults 等负向缺口未关 |
| RESEARCH-0011 | 种子 CTRL-0001–0006 有 characterization 锚点；完整正负矩阵显式留给 Phase 6 |

## 范围（In）

- **oracle 定义**：夹具独立于 evaluator 实现；positive = 合法输入绿；negative = 破坏 invariant 必须红。
- **important 冻结**：RESEARCH-0011 已编号 **CTRL-0001–0006** + **路由完整性**（正/负命中 capability、orphan authority、unknown 不静默全表）+ Safety Kernel 三套件已覆盖面的显式记账。
- **覆盖台账**（仿 PLAN-0041）：`docs/research/working/oracle-inventory.v0.json` + 人读说明。行分类：`oracle_pair` / `characterization_only` / `gap`（及显式 `deferred`）。
- **表征**：每个 important 行必须登记；缺 pair 必须是显式 `gap`，禁止静默。
- **路由**：补负向/变异夹具（例：`edit_docs` 不得带 `secret-protection`；authority 缺失则红；图边被删则红）。
- **CTRL-0001–0006**：能复用已有负向例则记账；缺则补一条最小负向；不按 suite 整文件重写。优先 FINDING-0006 E02（stack defaults）。

## 非目标（Out）

```text
Phase 7 Review 三分
Phase 8 阻断权威重建
Active PLAN-0037
给 consistency 剩余集群批量发 CTRL 号
5c leftover / FINDING-0028 dogfood / FINDING-0029 残留抽出
通用 CONTROL-X runner / 独立 Control 机器文件（ADR-0023 未授权）
把 npm test 的 N/N 换成唯一指标（计数另出，runner 仍全量）
Migration 分支上把 Gen1 npm run check 改成 blocking
把「每条机械规则必须有负向 oracle」写入 INSTALLED testing.policy.md
```

CTRL-0001 已有 repo/skill CLI parity：只记账，不另造 CONTROL-X 框架。

## 设计裁决（本计划冻结）

| # | 裁决 |
| --- | --- |
| D1 | **oracle ≠ 更多测试**：P1 先拆「已有表征」与「算 oracle」，再补缺口 |
| D2 | **important 集合封闭**：本 checkpoint 只要求 0001–0006 + 路由完整性 + Safety Kernel 记账；其余 cluster 不挡 Exit |
| D3 | **Target: repo-infra**：台账与测试留在本仓；不写进 INSTALLED testing.policy（被治理项目无 CTRL 库存） |
| D4 | **测试不得成为第二语义源**：夹具断言行为/退出码，不复制 checker 正则 |
| D5 | **切片可停**：P1 可单独合入；P2/P3 可并行；P4 才标 Phase 6 EXITED |
| D6 | **PLAN-0037 仍冻结**；Phase 6 EXIT 不解冻 |

## 交付阶段

### P0 — Design 批准

- [x] 批准本 Design → `status: Active`
- [x] important 集合与 oracle 契约保持本文件冻结文

### P1 — 覆盖台账

- [x] `docs/research/working/oracle-inventory.v0.json` + 人读 `oracle-inventory.md`
- [x] `tests/suites/oracle-inventory.test.js`：缺登记则红
- [x] 现有测试分类为 `oracle_pair` / `characterization_only` / `gap`

### P2 — 路由完整性负向

- [x] `--suite routing` 增负向/变异例
- [x] unknown → unmatched；不得静默全表（已有则记账）

### P3 — 种子 CTRL 缺口

- [x] CTRL-0001–0006：gap=0 或显式 deferred 行
- [x] 优先 FINDING-0006 E02（generator stack defaults 负向）

### P4 — Exit

- [x] 覆盖计数可从台账读出（不替代 `npm test` runner）
- [x] roadmap ×3：Phase 6 Implemented / EXITED
- [x] PLAN-0037 仍 Design 冻结
- [x] Ledger Open=0；Unaccounted=0

## 完成条件（exit）

- [x] P0–P4 完成（P3 允许种子集外 cluster 仍无 CTRL 号）
- [x] important 行无静默缺口
- [x] 无 Phase 7/8 偷跑；未 Active PLAN-0037；未改 Migration Gen1 check 为 blocking
- [x] 未写入 INSTALLED testing.policy 的 CTRL 库存假设

## Domain sync（Target: repo-infra）

| Domain | 同步点 |
| --- | --- |
| repo-infra | 本计划、roadmap ×3、AGENTS 薄指针、`docs/research/working/oracle-inventory.*`（P1）、`tests/suites/oracle-inventory.test.js`（P1）、routing 套件（P2）、种子 CTRL 测试缺口（P3）、RESEARCH-0003 / 0011、FINDING-0006 线索、CHANGELOG（P1 起，非本 Design） |
| payload | **不写** INSTALLED |

## 受影响文件

- `docs/plans/PLAN-0042-invariant-based-testing.md`（本文件）
- `docs/plans/roadmap/{en,zh-CN,zh-TW}.md`
- `AGENTS.md`
- `docs/research/RESEARCH-0003-evaluation-framework.md`
- `docs/research/RESEARCH-0011-gen1-mechanical-control-inventory.md`
- `docs/findings/FINDING-0006-regression-oracle-gap.md`

P1 起另增（本 Design 不创建，故不在上表用反引号声明）：oracle-inventory.v0.json、oracle-inventory.md、oracle-inventory.test.js、run-tests.js 注册、routing.test.js 增例、种子 CTRL 相关套件、CHANGELOG。

## 发现台账（Discovery Ledger）

| 标识（ID） | 类型 | 来源 | 问题 | 影响面 | 严重度 | 状态 | 处置 | 责任人 | 验证/证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O0 | observation | FINDING-0006 | 表征 ≠ 负向 oracle；N/N 误导成熟度 | repo | high | closed | resolved | — | oracle-inventory.v0.json + suite |
| O1 | observation | PLAN-0035 | 路由负向命中 / orphan 尚未系统化 | repo | high | closed | resolved | — | routing N1–N3 |
| O2 | observation | FINDING-0006 E02 | stack defaults 可能仍无负向 | repo | med | closed | resolved | — | generator stack-defaults oracle |
| O3 | observation | ADR-0023 | CONTROL-X runner / 机器 Control 文件未授权 | repo | med | closed | deferred | — | Out；0001 parity 只记账 |
| O4 | observation | ADR-0020 | INSTALLED testing.policy 写 CTRL 库存会破 closure | payload | high | closed | deferred | — | Out；D3 |

## 闭包对账

```text
Total known:  5
Resolved:     3  (O0, O1, O2)
Deferred:     2  (O3, O4)
Open:         0
Unaccounted:  0
```

## Phase 6 Exit Criteria（checkpoint）

```text
Required:
✓ oracle 契约 + important 冻结集（本计划）
✓ 覆盖台账 v0 + fail-closed 表征
✓ 路由负向 / orphan / unknown 不静默全表
✓ CTRL-0001–0006 登记；种子 gap=0（CTRL-0003 可为 characterization_only/advisory）
✓ FINDING-0006 E02 stack defaults 负向
✓ PLAN-0037 仍冻结

Deferred by design:
- consistency 剩余集群批量 CTRL 号
- 5c leftover / FINDING-0028 dogfood / FINDING-0029
- CONTROL-X runner / INSTALLED testing.policy CTRL 库存
- Phase 7/8
```

## Phase 6 exit review（2026-09-12）

| 检查项 | 状态 |
| --- | --- |
| Exit Criteria Required 全项 | ✓ |
| Deferred by design 已显式记录 | ✓ |
| Phase 7/8 / Active PLAN-0037 / Gen1 check→blocking | **未偷跑** |
| Open blocker | **无** |

**Completion marker：** Phase 6 checkpoint = **EXITED**（PLAN-0042 `status: Implemented`）。

**Successor：** Phase 7 Review System redesign（计划待立）。

## Successor

- Phase **7** Review System redesign（Implementation / System / Research）
- FINDING-0006：种子集已有台账与 E02 oracle；全量「所有机械规则」仍不在本 checkpoint 关闭面——Finding 保持 Confirmed 直至更广覆盖
- 5c leftover / FINDING-0028 / 0029 仍不挡、不并入

## 参考

- ADR-0018 决策 6 · ADR-0023 决策 2 · ADR-0014 Safety Kernel
- RESEARCH-0003 · RESEARCH-0011 · FINDING-0006
- PLAN-0035 Phase 5 vs 6 边界 · PLAN-0038–0040 EXITED · PLAN-0037 冻结
