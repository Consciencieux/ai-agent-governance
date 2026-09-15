# 文档新鲜度（被治理项目面）

> Capability leaf (`doc-freshness`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/doc-freshness.md`.
> Classification (after INIT): `docs/rules/capability-enforcement.json` (PLAN-0057).

## Trigger

治理文档过期、译文滞后、发布新鲜度门禁。

## Authority

`scripts/check-doc-freshness.js`（被治理项目 must-ship；本仓翻译新鲜度 repo-keep）。

## Invoke

`node scripts/check-doc-freshness.js`；`--release-gate` 语义以脚本/发布流程为准。

## Verify

过期/draft 译文在发布门禁下被阻断（若启用 release-gate）。

## Non-goals

不负责本仓术语表执法（repo-tools）。
