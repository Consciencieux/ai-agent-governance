---
id: PLAN-0045
status: Archived
generation: gen2
target: repo-infra
---

# PLAN-0045：H0 发布后文档真相与计划归档

> （已归档。2026-09-12 P0+P1 完成：ADR-0025、三语 Roadmap、入口现在时、九份 Implemented 计划归档、人类解冻 PLAN-0037。按 ADR-0016 Plan archive ≠ Release。）

`v2.0.0` 已发布后，把文档系统现在时与计划生命周期对齐到事实；不改 INSTALLED 行为。

## 目标（已达成）

```text
v2.0.0 已发布
        ↓
入口 / 路线图 / ADR 现在时对齐          ✓
Phase 4–8 Implemented 计划归档          ✓
H0 关闭 → PLAN-0037 由人类解冻 Active   ✓
```

## 交付记录

### P0 — 当前真相

- [x] ADR-0025 Accepted
- [x] 三语 Roadmap：当前产品 = v2.0.0；2.x = H0–H3
- [x] `AGENTS.md`：CI = must-ship 阻断
- [x] 2.0 checklist / Mode 退出提案标完成
- [x] ADR-0014 / 0017 / 0018 / 0024 追加发布后现在时
- [x] FINDING-0021 解决情况补现在时
- [x] PLAN-0037 冻结条注明 Gate 3 已满足（随后人类解冻）

### P1 — 计划归档

- [x] PLAN-0035 / 0036 / 0038–0044 → `docs/plans/archive/`，`status: Archived`
- [x] 引用改到 archive 路径
- [x] `mode-exit-proposal.md` → `docs/plans/archive/`（非 PLAN）
- [x] 人类解冻 PLAN-0037 → Active（本 H0 闭包的 successor 交接）

## Discovery Ledger

| ID | 状态 | 处置 |
| --- | --- | --- |
| H0a–H0e | closed | resolved |
| H0c | closed | resolved（P1 归档） |

```text
Total known:  5
Resolved:     5
Open:         0
Unaccounted:  0
```

## Successor

- [PLAN-0037](../PLAN-0037-governance-skill-extraction.md) Active（ADR-0025 H1）
- H2 另开 Plan
