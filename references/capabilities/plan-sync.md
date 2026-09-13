# Plan / milestone 同步

> Capability leaf (`plan-sync`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/plan-sync.md`.

## Trigger

仍使用 DEVELOPMENT_PLAN↔TASK 模型的被治理项目；发布前计划同步。

## Authority

`scripts/check-plan-sync.js`。

## Invoke

`node scripts/check-plan-sync.js`（含 `--release-gate` 若适用）。

## Verify

声明的计划/里程碑关系机械可核对。

## Non-goals

不替代本仓 `check-plan-delivery`（repo-keep）。
