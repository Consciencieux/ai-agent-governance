# Git 工作流安全

## Trigger

分支保护、直推/force 到受保护分支、CI 分支策略校验。

## Authority

人授语义权威：`docs/rules/git-policy.md`。分支策略声明：`.governance/git-policy.json`。**机械载体（RUN，勿当阅读权威）：** `scripts/check-git-policy.js`。

## Invoke

`node scripts/check-git-policy.js`；INIT 后策略文件必须存在于声明路径。

## Verify

受保护分支上的未授权 force/直推被拒绝（exit ≠ 0）；策略 JSON 可解析。

## Non-goals

不负责 consent/HITL 语义（见 git-write-consent / git.policy）；不替代远程托管平台 branch rules。
