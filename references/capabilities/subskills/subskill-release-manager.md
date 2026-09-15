# 子技能：release-manager

> Capability leaf (`subskill-release-manager`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/subskill-release-manager.md`.

## Trigger

被治理项目发布编排（HITL）。

## Authority

生成物 `release-manager` 子技能 + release workflow（项目内发布流程权威）。

## Invoke

加载子技能；tag 脚本只作 executor。

## Verify

人批后方可写 tag；provenance 规则不被手改。

## Non-goals

不负责 skill 仓自身 release。
