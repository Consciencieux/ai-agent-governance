# AUDIT / drift 巡检

> Capability leaf (`audit-drift`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/audit-drift.md`.
> Classification (after INIT): `docs/rules/capability-enforcement.json` (PLAN-0057).

## Trigger

已有 manifest；用户说 audit / 健康检查 / drift。

## Authority

skill entry AUDIT 模式 + 生成子技能 `drift-check`（见 generated sub-skills under `.governance/generated/skills/`）。

## Invoke

跑 AUDIT 流程：manifest 对账 → 引用闭包 → 最小补丁（需确认时走治理文件保护）。

## Verify

产出偏差报告；不擅自全量重建；修复走确认边界。


## Non-goals

不等于 RELEASE；不替代日常 generated drift-check 的轻量巡检定位。
