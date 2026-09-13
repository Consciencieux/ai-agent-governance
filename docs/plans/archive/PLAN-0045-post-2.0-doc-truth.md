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
- [x] `mode-exit-proposal.md` / `skill-release-2.0-checklist.md`：无编号文件，不是 Plan。HITL 记录并入 [ADR-0014](../../design-decisions/ADR-0014-architecture-migration-mode.md) § Mode 退出处置；发布清单并入本文件下方。不进入 `archive/` 根目录，也不建 Plan 文件夹。
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

## 并入：2.0 skill-release 清单（原独立文件，不是 Plan）

历史勾选记录。流程权威：`repo-workflows/skill-release.md`。产品定义：ADR-0024。

**已满足（2026-09-12）：** must-ship fail-closed；Mode 退出 + 合入 `main`（PR #8）；干净目标 INIT Phase C + verify 62/62；FINDING-0003 必装阻断面（残留判断型 MUST = later）；FINDING-0007 2.0 切片预检（完整 adapter 矩阵 = later）；FINDING-0018 冻结面随门槛关闭；五同步点 `2.0.0`；annotated tag + GitHub Release + tarball；删除迁移分支。

**明确不做（仍成立）：** Gen1 `npm run check` 全绿作为发布前提；解冻 PLAN-0037（另一次人类 Active）；CONTROL-X / L3 / FINDING-0006 全量 oracle。
