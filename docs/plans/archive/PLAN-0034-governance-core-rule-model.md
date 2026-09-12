---
id: PLAN-0034
status: Archived
generation: gen2
---

# PLAN-0034：Governance Core / Rule Model（Phase 3 checkpoint）

> （已归档。2026-09-10 Phase 3 exit review 通过；按 ADR-0016 Plan archive ≠ Release，于 lifecycle closure 移入 archive。Phase 3 baseline：`24021c4`。checkpoint ≠ Release。）

Phase 3 的执行主体。回答「Control / Rule 如何建模」；**不**拆 Gen1 checker、**不**建 Dispatcher、**不**移动 `references/` 政策单体。

## 背景

Phase 2（`346bb749`）已封板 Documentation Knowledge Architecture。ADR-0018 要求 Gen2 阶段通过 Active Plan 执行。Phase 1（ADR-0020）给出 ownership；正式 Control / slot 规范由本阶段 ADR-0023 承担。

## Phase 3 入口：R23 取回（AGENTS / SKILL 边界）

入口职责冻结：允许薄指针；禁止把 Control schema 正文写入 AGENTS/SKILL；完整瘦身列入 E1 deferred（不阻塞 exit，选项 B）。

## 目标（已达成）

```text
Control identity                  ✓  CTRL-xxxx
semantics_ref authority           ✓  每条 Control 独立；≠ ADR-0023 Model authority
applicability model               ✓  陈述式；无 Dispatcher
evaluation/enforcement binding    ✓  profile × evaluator × boundary
decision effect placement         ✓  挂在 binding，非 Control 单值
repo/skill shared semantics       ✓  ADR-0020 + ADR-0023；CTRL-0002 跨 profile
```

交付：RESEARCH-0010（描述）+ ADR-0023（规范，含 consistency pass）+ CTRL-0001–0005 vertical slices + serialization-agnostic slot model。独立机器序列化未做（E4 deferred）。

## 明确未发生（exit 核对）

```text
Gen1 checker restructuring     ✗ 未做（Phase 4）
Dispatcher                     ✗ 未做（Phase 5）
references monolith split      ✗ 未做
release / tag / skill tarball  ✗ 未做（ADR-0014）
```

## 提议交付物（终态）

1. Control / Rule 概念关系 — RESEARCH-0010 + ADR-0023 ✓
2. Serialization-agnostic canonical slot model — ADR-0023 ✓（≠ machine-readable 文件）
3. Vertical slice ≥3 — CTRL-0001–0005 ✓
4. 入口收敛清单 — E1 表 ✓（执行 deferred）

## 完成条件（exit review 2026-09-10）

| 条件 | 结果 |
| --- | --- |
| R23 边界写入且未被违反 | pass |
| Accepted ADR + Research | ADR-0023 Accepted；RESEARCH-0010 Active |
| Slot model 单一权威落点 | ADR-0023；独立序列化非条件 |
| Vertical slice ≥3 + cross-profile | CTRL-0001–0005；CTRL-0002 |
| Ledger Unaccounted=0；无 Open；Deferred 有 revisit | pass（见下） |
| 未引入 Phase 4/5 拆分或 Dispatcher；无 release tag | pass |
| E1 非完成条件（选项 B） | pass |

## 发现台账（Discovery Ledger）— 终态

| 标识（ID） | 来源 | 问题 | 范围 | 状态 | 处置 | 证据 |
| --- | --- | --- | --- | --- | --- | --- |
| E0 | PLAN-0032 R23 | Phase 3 入口须确认 AGENTS/SKILL 瘦身边界 | repo+skill | closed | resolved | 本计划 § Phase 3 入口 |
| E1 | E0 | 完整入口瘦身 / 可路由叶节点 | repo+skill | closed | deferred（revisit: 可路由 Control 叶节点或 Dispatcher；**不阻塞 exit**） | ADR-0022 · ADR-0023 §10 |
| E2a | ADR-0020 | Control canonical slot semantics 未定 | both | closed | resolved | ADR-0023 决策 4 + consistency pass |
| E2b | E2a | serialization / machine-readable representation | both | closed | duplicate → E4 | 与 E4 同一 revisit |
| E3 | user review | Completed Plan 曾错误绑定 Release 才归档 | repo | closed | resolved | ADR-0016；PLAN-0031/0032/0033 → archive |
| E4 | ADR-0023 | 独立 machine-readable 文件尚未授权 | both | closed | deferred（revisit: 第二个真实机器 consumer——Dispatcher / CONTROL-X runner / 生成器） | ADR-0023 决策 6 |
| E5 | user review | ADR-0023 首版 Model authority / decision·guarantee 层级泄漏 | repo | closed | resolved | ADR-0023 consistency pass（`24021c4`） |

## 闭包对账（exit）

```text
Total known:   7
Resolved:      4  (E0, E2a, E3, E5)
Deferred:      2  (E1, E4)
Duplicate:     1  (E2b → E4)
Open:          0
Unaccounted:   0
```

## E1 取回清单（历史；执行属后续）

见 Active 期间正文；归档后仍有效作 deferred worklist。摘要：AGENTS 仅指针；SKILL 不得指 `docs/`；不拆 lifecycle.policy / sub-skills.md。

## 受影响文件（交付）

- `docs/research/RESEARCH-0010-governance-control-model.md`
- `docs/design-decisions/ADR-0023-governance-control-model.md`
- `docs/design-decisions/ADR-0018-…` / `ADR-0020-…`（指针）
- `docs/research/README.md` · `docs/design-decisions/README.md` · `docs/glossary.md` · `AGENTS.md`
- `CHANGELOG.md` `[Unreleased]`
- 本文件 → `docs/plans/archive/`

## 参考

- ADR-0018 · ADR-0014 · ADR-0020 · ADR-0022 · ADR-0016
- RESEARCH-0010 · ADR-0023
- Phase 2 baseline：`346bb749`
- Phase 3 model commit：`a11f608`；consistency：`24021c4`
- 后继：PLAN-0035（Phase 4 checkpoint）；E4 随真实机器 consumer 取回
