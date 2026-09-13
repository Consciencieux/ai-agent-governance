# Git 工作流安全

> Capability leaf (`git-workflow-safety`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/git-workflow-safety.md`.

## Trigger

分支保护、直推/force 到受保护分支、CI 分支策略校验。

## Authority

被治理项目：`.governance/git-policy.json` + `scripts/check-git-policy.js`。

## Invoke

`node scripts/check-git-policy.js`；INIT 后策略文件必须存在于声明路径。

## Verify

受保护分支上的未授权 force/直推被拒绝（exit ≠ 0）；策略 JSON 可解析。

## Non-goals

不负责 consent/HITL 语义（见 git-write-consent）；不替代远程托管平台的 branch rules。
