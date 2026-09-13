# 内容一致性

> Capability leaf (`content-consistency`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/content-consistency.md`.

## Trigger

改交叉文档事实、版本示例、触发词、受保护清单等一致性簇。

## Authority

`scripts/check-doc-consistency.js`（能力 must-ship；单体拆分 later）。

## Invoke

`node scripts/check-doc-consistency.js --gate`（或项目等价）；本仓观测面与 must-ship 分流按 AGENTS。

## Verify

声明事实与源一致；gate 簇 fail-closed 行为符合契约。

## Non-goals

不在本叶重写各 cluster 算法；parser 迁移属 H2b。
