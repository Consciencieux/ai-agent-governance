# 规则捕获（Rule Capture）

> Capability leaf (`rule-capture`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/rule-capture.md`.

## Trigger

任务中出现持久性行为要求候选；Phase 5a/5b/5c。

## Authority

`docs/rules/lifecycle.md` § Rule Capture（INIT → `docs/rules/lifecycle.md`）。本文件为可调用叶卡，不另立权威正文。

## Invoke

按 lifecycle 权威执行 5a 裁定 → 5b 写入 → 5c 再验证；候选可暂存 `state.json.rule_capture`。

## Verify

仅确认的持久项写入规则源；相关校验重跑通过。

## Non-goals

不收集秘密；一次性要求不入库；规则内容裁定 ≠ Git 授权。

## Notes

旧版散文步骤已收敛为叶卡；执行细节以 Authority 指向的政策为准，勿在入口复制。
