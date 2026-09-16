# 文档新鲜度（被治理项目面）

## Trigger

治理文档过期、译文滞后、发布新鲜度门禁。

## Authority

义务边界见 CTRL-0003/0004 / 发布流程。**机械载体（RUN，勿当阅读权威）：** `scripts/check-doc-freshness.js`。

## Invoke

`node scripts/check-doc-freshness.js`；`--release-gate` 语义以脚本/发布流程为准。

## Verify

过期/draft 译文在发布门禁下被阻断（若启用 release-gate）。

## Non-goals

不负责本仓术语表执法（已无 Forbidden 机械门禁）；读本叶 ≠ 已加载新鲜度算法。
