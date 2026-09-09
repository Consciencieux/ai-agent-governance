---
id: PLAN-0036
status: Active
generation: gen2
target: payload
---

# PLAN-0036：Payload TASK Discovery Ledger 集成

> （进行中。2026-09-10：PLAN-0032 R24 于 Phase 4 入口取回；本计划为 PLAN-0035 的 subordinate。Architecture checkpoint ≠ Release。）

将 ADR-0021 Known-Issue Closure 的 Discovery Ledger 从 **repo prototype**（PLAN-0033）推进到 **INSTALLED skill TASK lifecycle**（`references/policies/lifecycle.policy.md` TASK 格式）。属 Phase 4，但与 checker/primitive 分解职责正交，故独立成 Plan（ADR-0018：checkpoint + subordinate）。

## 背景

- ADR-0021：第一代载体 = TASK Plan 内 append-only `## Discovery Ledger`；payload 集成当时未授权一次性铺开。
- PLAN-0033：repo-infra 演示；payload 内嵌留后继。
- PLAN-0032 R24：`promoted-to-next-plan`，revisit = Phase 4 planning checkpoint，要求建立 successor Plan ID。
- PLAN-0035：Phase 4 checkpoint；本文件即该 successor。

## 目标

```text
governed-project TASK 计划
→ 可按 lifecycle.policy 携带 Discovery Ledger
→ Unaccounted = 0 成为可执行完成条件
→ 生成/模板路径（若有）与测试覆盖约定行为
```

不在此计划内：重构 `check-doc-consistency.js`、建 Dispatcher、改 Control Model。

## 明确不在范围

```text
Checker / primitive 拆分          → PLAN-0035
Dispatcher                        → Phase 5
Invariant testing 全体系          → Phase 6
Release / tag                     → 禁止（ADR-0014）
```

## 提议交付物

1. `references/policies/lifecycle.policy.md`（及必要的模板同步点）纳入 Discovery Ledger 格式与闭包规则（指针 ADR-0021，不复述全文）。
2. 被治理项目侧可验证的最小路径（INIT 生成或文档约定 + 测试）。
3. characterization：不破坏现有 lifecycle / plan-status 相关行为；Migration Mode 下 Gen1 红可为 observational。

## 完成条件

- R24 取回记录完整（本计划 + PLAN-0035 P0）。
- lifecycle.policy（或 ADR 授权的等价 INSTALLED 载体）含 TASK Discovery Ledger 约定。
- 有机械或测试证据证明约定可达被治理项目（reference-closure）。
- Ledger：Open=0；Unaccounted=0；未做的项须 Deferred+revisit。
- 未越权改 checker monolith / Dispatcher。

## 受影响文件

- `docs/plans/PLAN-0036-payload-discovery-ledger.md` —— 本计划
- `docs/plans/PLAN-0035-checker-primitive-restructuring.md` —— checkpoint 跟踪
- `docs/plans/archive/PLAN-0032-…` · `PLAN-0033-…` —— R24 / 演示 provenance
- `references/policies/lifecycle.policy.md`（及模板/测试，执行时枚举）
- `CHANGELOG.md`（若行为变更）

## 验证方法

1. Impact-face：改 lifecycle.policy 前 `rg` 同步点。
2. Clean-target / reference-closure：INSTALLED 路径在无本仓库 `docs/` 的环境中仍成立。
3. Safety Kernel 不退化。

## 发现台账（Discovery Ledger）

| 标识（ID） | 来源 | 问题 | 范围 | 状态 | 处置 | 证据 |
| --- | --- | --- | --- | --- | --- | --- |
| L0 | PLAN-0032 R24 | 须建立 payload successor Plan | skill | closed | resolved | 本计划 Active |
| L1 | ADR-0021 | lifecycle.policy TASK 格式尚未内嵌 Ledger | skill | open | in-progress | 本计划目标 |

## 闭包对账（进行中）

```text
Total known:  2
Resolved:     1  (L0)
Open:         1  (L1)
Unaccounted:  0
```

## 参考

- ADR-0021 · RESEARCH-0008 · FINDING-0022
- PLAN-0033（repo 演示）· PLAN-0032 R24 · PLAN-0035（checkpoint）
