# 内容一致性

## Trigger

改交叉文档事实、版本示例、触发词、受保护清单等一致性簇。

## Authority

编排指针见 `docs/rules/lifecycle.md` Phase 4 报告层。**机械载体（RUN，勿当阅读权威）：** `scripts/check-doc-consistency.js`。

## Invoke

`node scripts/check-doc-consistency.js --gate`（或项目等价）；本仓观测面与 must-ship 分流按 AGENTS。

## Verify

声明事实与源一致；gate 簇 fail-closed 行为符合契约。

## Non-goals

不在本叶重写各 cluster 算法；读本叶 ≠ 已加载一致性语义百科。
