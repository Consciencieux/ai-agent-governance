# Git 写授权（consent）

## Trigger

任何不可逆 Git 写（commit/push/tag/reset 等，以权威枚举为准）。

## Authority

`docs/rules/git-policy.md`（唯一语义权威；INIT → `docs/rules/git-policy.md`）。入口只保留指针+always-on 摘要。

## Invoke

按权威：明确写指令或 IDE「暂存+提交+推送」确认 = 该变更集人授；回显完整命令序列作为执行记录后执行；失败即停。计划批准 ≠ Git 授权。模糊任务级表述先问。

## Verify

无对应人授不得写；中途失败/push 拒绝停止并报告；入口未另立第二份权威正文；不得在已获人授后再要求第二次确认才执行。

## Non-goals

本叶不替代人授协议正文。机械 classifier（`scripts/check-git-consent.js` / CTRL-0002 evaluator）只分类拟议 argv，**不**执行 git、**不**冒充已获人授。
