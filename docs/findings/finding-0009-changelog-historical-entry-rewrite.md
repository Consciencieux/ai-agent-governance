---
id: FINDING-0009
status: Resolved
type: defect
direction: B
root_cause: R1
severity: High
affected:
  - repo
github_issue: 6
opened: 2026-09-08
resolved: 2026-09-08
related:
  plans: []
  adrs:
    - ADR-0011
    - ADR-0012
---

# 已发布的 CHANGELOG 版本条目被后续 commit 改写，并插入对当时不存在的 ADR 的引用

## 观察 Observation

审计 CHANGELOG 与 git 历史一致性时发现：`[1.0.0]` 版本条目在 v1.0.0 / v1.0.1 发布时的原始文本与当前 HEAD 不一致——原始条目详细列举了 38 个触发词、9 个脚本 CLI、init-spec 契约等具体数量；当前条目被压缩为「five categories」并带上 `(ADR-0011)` 引用。

## 证据 Evidence

```text
git show 62876cd:CHANGELOG.md   # v1.0.0 发布时：[1.0.0] 条目无 ADR-0011 引用
git show ab71b46:CHANGELOG.md   # v1.0.1 发布时：同样无 ADR-0011 引用
git log --diff-filter=A -- '**/adr-0011*'  # 创建 commit = 60185ef（v1.0.2 窗口内）
```

commit `60185ef` 把 v1.0.0 已发布条目压缩改写，同时创建 ADR-0011/0012——「改写已发布版本节」与「引用当时不存在的文档」在同一 commit 引入。

## 根因 Root cause

- 「已发布版本条目不可改写」的结构契约未对 60185ef 生效（该 commit 属 v1.0.2 窗口，却回头修改 v1.0.0 条目）。
- 60185ef 是一次「获准例外」之外的未授权历史改写（对比 v0.15.0 那次是明示获批的一次性 trim）。
- 事件链：事实漂移 → 给 meta-checker 加 cluster → 顺手压缩历史条目 → 插入指针。

## 影响 Impact

- `[1.0.0]` 条目不再忠实于发布时点，历史读者无法还原 v1.0.0 当时冻结的确切接口面。
- `(ADR-0011)` 引用让读者误以为 v1.0.0 发布时已有该 ADR，实际是 v1.0.2 才创建。

## 关闭条件 Resolution criteria

1. `[1.0.0]` 条目还原为 v1.0.0 发布时的原始文本。
2. ADR-0011/0012 创建 + CHANGELOG 条目规范强化补录进 `[1.0.2]`。
3. 顶部重建空 `[Unreleased]` 节。

## 解决 Resolution

- `[1.0.0]` 条目用 `git show 62876cd:CHANGELOG.md` 提取的原始文本还原。
- `[1.0.2]` 补录 Added（ADR-0011/0012）+ Changed（one-entry-per-change / 指针用名称 / 引用而非复述）。
- 顶部补建空 `[Unreleased]`。
- 门禁 `npm run check` 全绿（EXIT=0）。

## 回归保护 Regression protection

暂无机械 gate 能防止「改写已发布版本节」——生命周期规则 + changelogCoverage 的边界。后续可考虑 `--gate` 下对已发布版本节的 diff 检测（heuristic 层）。
