# 工程克制（机制测试）

## Trigger

新增机制、门禁、脚本、状态、流程之前；权威/脚本文件持续变长时。

## Authority

`docs/rules/coding.md` § 工程克制与机制测试；文件行数预算见同节（`node scripts/check-file-size-budget.js` 为机械报告载体）。

## Invoke

先做机制测试：若今天不存在，当前需求是否仍独立证明必要？冲突升级而非偷删需求。不得把门禁绿读成「已通过机制测试」。

行数：跑 `node scripts/check-file-size-budget.js`；超 soft/review 必须汇报并提出拆分方案，**等人确认后再拆**；禁止为过线自动硬拆或默默继续堆。

## Verify

新增机制有需求锚点；无批准不扩机器面；报告中不得把机制测试写成 mechanical MUST。行数评估须有检查器输出摘录（或显式「无命中」），不得空口声称「已评估」。

## Non-goals

不是替代机制测试的唯一标准；不禁止已批准的必要机制；不授权 Agent 未经确认因行数删改权威正文。
