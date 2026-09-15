# 分级发布审查

> Capability leaf (`release-risk-tiering`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/release-risk-tiering.md`.
> Classification (after INIT): `docs/rules/capability-enforcement.json` (PLAN-0057).

## Trigger

RELEASE 风险分级、是否要求深度审查。

## Authority

release workflow（项目内发布流程权威） 风险分级（单一权威；ADR-0020）。

## Invoke

按发布流程读取分级；高风险走 review-manager / 人批。

## Verify

分级结果进入 Proposal；高风险缺审查证据不得继续。


## Non-goals

不把 System/Research review 塞进 skill 默认面（repo-keep）。
