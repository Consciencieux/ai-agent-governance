# Implementation Review 机制

## Trigger

发布/高风险变更需要 Implementation Review；用户触发 review-manager。

## Authority

生成子技能 `review-manager`（generated sub-skills under `.governance/generated/skills/`）；Implementation Review = must-ship。

## Invoke

加载 review-manager 子技能；按固定领域产出严重度排序报告 + 修复验证。

## Verify

报告落地；须修项进入可追踪闭环。

## Non-goals

System/Research review 不在本叶（repo-keep）。
