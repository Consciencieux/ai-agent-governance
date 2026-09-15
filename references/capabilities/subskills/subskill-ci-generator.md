# 子技能：ci-generator

> Capability leaf (`subskill-ci-generator`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/subskill-ci-generator.md`.
> Classification (after INIT): `docs/rules/capability-enforcement.json` (PLAN-0057).

## Trigger

从 inspection 输入物化 CI。

## Authority

生成物 `ci-generator` 子技能（模板 § ci-generator）。

## Invoke

加载子技能；消费 repository-inspection 输入。

## Verify

CI 配置按契约生成或给出 Blocked 原因。


## Non-goals

不手写第二套 CI 政策权威。
