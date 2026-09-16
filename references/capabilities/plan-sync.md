# Plan / milestone 同步

## Trigger

仍使用 DEVELOPMENT_PLAN↔TASK 模型的被治理项目；发布前计划同步。

## Authority

计划交付编排见 lifecycle / 发布流程。**机械载体（RUN，勿当阅读权威）：** `scripts/check-plan-sync.js`。

## Invoke

`node scripts/check-plan-sync.js`（含 `--release-gate` 若适用）。

## Verify

声明的计划/里程碑关系机械可核对。

## Non-goals

读本叶 ≠ 已加载同步算法；不把生产者仓专用门禁写进被治理项目权威。
