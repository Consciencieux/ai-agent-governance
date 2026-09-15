# 生成子技能机制

> Capability leaf (`generated-subskill-lifecycle`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/generated-subskill-lifecycle.md`.
> Classification (after INIT): `docs/rules/capability-enforcement.json` (PLAN-0057).

## Trigger

INIT 生成/刷新 `.governance/generated/skills/`；改 sub-skills 模板。

## Authority

generated sub-skills under `.governance/generated/skills/` + 生成器路径。

## Invoke

INIT/生成器物化 8 个产品叶；禁止只声称「有生成机制」而不生子技能。

## Verify

8 叶文件存在且可加载；模板与生成物触发词可对账。


## Non-goals

8 个产品能力各自另有叶卡；本叶只覆盖机制。
