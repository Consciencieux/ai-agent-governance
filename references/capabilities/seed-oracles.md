# 种子负向 oracle 与路由完整性

> Capability leaf (`seed-oracles`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/seed-oracles.md`.

## Trigger

改门禁/路由/安全内核；发布 must-ship；PLAN-0042 相关回归。

## Authority

种子负向 oracle 与路由完整性由项目 must-ship 表征门禁记账；CTRL-0001–0006 以当前库存为准。

## Invoke

跑 must-ship / oracle-inventory / routing 表征；`important_gap = 0`。

## Verify

库存声明与实现一致；种子负向仍红/绿符合预期。

## Non-goals

不承诺 FINDING-0006 全量 oracle（later）。
