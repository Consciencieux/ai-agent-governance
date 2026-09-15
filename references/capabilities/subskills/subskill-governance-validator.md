# 子技能：governance-validator

> Capability leaf (`subskill-governance-validator`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/subskill-governance-validator.md`.
> Classification (after INIT): `docs/rules/capability-enforcement.json` (PLAN-0057).

## Trigger

编排/调用治理校验器的 Agent 任务。

## Authority

生成物 `governance-validator` 子技能；底层仍指向治理校验脚本。

## Invoke

加载子技能并调用校验入口。

## Verify

校验结果可报告；与 scripts 校验器行为一致。


## Non-goals

不与 `governance-validator.md`（脚本能力叶）双写语义——本叶是编排入口。
