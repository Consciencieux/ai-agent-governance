# 同步组（声明 + 机械校验）

> Capability leaf (`sync-groups`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/sync-groups.md`.

## Trigger

多文件必须同步变更的治理表面；改同步组成员。

## Authority

声明：`.governance/sync-rules.json`（或 init 等价）；机械：`scripts/check-sync.js`。

## Invoke

编辑声明文件；变更后 `node scripts/check-sync.js` 对照实际改动集。

## Verify

声明集合与机械覆盖一致；缺同步成员则非 0。

## Non-goals

不负责跨仓联邦同步。
