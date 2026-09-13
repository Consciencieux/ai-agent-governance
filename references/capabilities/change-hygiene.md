# 变更归位与残留清理

> Capability leaf (`change-hygiene`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/change-hygiene.md`.

## Trigger

删除/重命名/迁移/弃用 API 或治理表面；宣称清理完成前。

## Authority

`docs/rules/lifecycle.md` § 变更归位与残留清理 + 本叶操作清单历史投影（执行时以 lifecycle 权威为准）。

## Invoke

维护 Change Hygiene Ledger；搜索顺序：权威 → 引用 → 投影；分层处理当前/兼容/历史。

## Verify

当前层无未解释旧事实；兼容层每条有退出条件；无断链双权威。

## Non-goals

不得以清理为名静默破坏公共 API/安全门槛。

## Notes

旧版散文步骤已收敛为叶卡；执行细节以 Authority 指向的政策为准，勿在入口复制。
