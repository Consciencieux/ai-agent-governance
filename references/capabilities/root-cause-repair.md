# 根因修复 / 失败预算 / 同类闭包

> Capability leaf (`root-cause-repair`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/root-cause-repair.md`.

## Trigger

中大型缺陷修复、门禁误修、治理缺陷复发。

## Authority

`docs/rules/lifecycle.md` § 根因修复协议与失败预算（含同类闭包 / 双域对称）。细则以该政策为准；本叶只给可调用契约。

## Invoke

建立 repairSession；复现优先；失败预算内升级；执行**同类实例闭包**与**控制面追查**（作者面 + 执行面）。

## Verify

- 回归在修复前失败、修复后通过
- 同类实例闭包：相关表面均有证据结果（已修 / 已证正确 / 不适用并说明 / 阻塞）
- 控制面追查：规则 → 模板/生成器 → 输出 → 门禁 → 测试 → 消费者（按相关性裁剪）
- 口头宣称或「最后一次命令变绿」**不算证据**
- 只改生成物、不改源头 → **下次生成会覆盖**，不得宣称完成

## Non-goals

不借机扩未批准机制；不把本叶写成第二份 lifecycle 全文。
