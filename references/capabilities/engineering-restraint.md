# 工程克制（机制测试）

> Capability leaf (`engineering-restraint`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/engineering-restraint.md`.
> Classification (after INIT): `docs/rules/capability-enforcement.json` (PLAN-0057).

## Trigger

新增机制、门禁、脚本、状态、流程之前。

## Authority

`docs/rules/coding.md` § 工程克制与机制测试（**judgment**；FINDING-0003 类 ①；无机械 carrier）。

## Invoke

先做机制测试：若今天不存在，当前需求是否仍独立证明必要？冲突升级而非偷删需求。不得把门禁绿读成「已通过机制测试」。

## Verify

新增机制有需求锚点；无批准不扩机器面；报告中不得把本节写成 mechanical MUST。

## Non-goals

不是新的 CI gate；不禁止已批准的必要机制。
