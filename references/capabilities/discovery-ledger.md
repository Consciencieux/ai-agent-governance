# 发现台账（Discovery Ledger）

> Capability leaf (`discovery-ledger`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/discovery-ledger.md`.
> Disposition: ADR-0024 `later` for L2 mechanization; L1 INSTALLED contract remains.

## Trigger

TASK 中发现已知问题需闭环时（ADR-0021）。

## Authority

ADR-0021 + `docs/rules/lifecycle.md` 中发现台账条款。

## Invoke

在 Active TASK 计划内维护台账表；**append-only** membership；terminal disposition 必填（含 `promoted-to-next-plan` 等权威枚举）。

## Verify

报告须给出台账对账：Total known / Resolved / Open / **Unaccounted = 0** 方可宣称完成。禁止删行装关闭。

## Non-goals

不承诺 later 的 L2 机械化；不另建平行 issue tracker。
