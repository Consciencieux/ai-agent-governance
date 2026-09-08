---
id: FINDING-0013
status: Confirmed
type: defect
direction: G
root_cause: R1
severity: Low
affected:
  - repo
github_issue: 6
opened: 2026-09-08
resolved:
related:
  plans: []
  adrs: []
---

# 审计方法缺陷：未加 --diff-filter=A 导致把「修改」误判为「新增」，制造假性数量冲突

## 观察 Observation

对 v0.5.1 CHANGELOG「Added 6 feature plan docs」进行核验时，第一轮用 `git diff --name-only 5273488..e9a1984` 得到 7 个 plan 文件，声称「实际新增 7 个，CHANGELOG 漏列 skill-lifecycle-management.md」。第二轮用 `--diff-filter=A` 重查，实际只新增 6 个——`skill-lifecycle-management.md` 是 v0.4.0 就创建的，v0.5.1 窗口内只是被修改。

## 证据 Evidence

```text
# 第一轮（错）：
git diff --name-only 5273488..e9a1984 | Select-String 'plans/'
# → 7 个文件（含 M 状态的 skill-lifecycle-management.md）

# 第二轮（对）：
git diff --name-only --diff-filter=A 5273488..e9a1984 | Select-String 'plans/'
# → 6 个文件（仅 A 状态）
```

`git diff --name-only` 默认同时报告 added/modified/deleted，不区分状态；把 modified 混入 added 集合即产生虚假冲突。

## 根因 Root cause

审计者未区分 git diff 文件状态（A/M/D/R），把 `--name-only` 输出当作「新增集合」使用。工具输出与审计意图不匹配，且未加过滤器。

## 影响 Impact

- 产生对 CHANGELOG 的错误指控（声称 v0.5.1 漏列一个 plan），幸而在修复前复核纠正。
- 对「数量/归属」类审计结论，方法错误会制造假阳性。

## 关闭条件 Resolution criteria

1. 确认 CHANGELOG v0.5.1 的「6 feature plan docs」计数准确（已确认）。
2. 记录本方法论教训，避免同类审计错误。

## 解决 Resolution

（待填：确认不再复现即可标记 Resolved。）

## 回归保护 Regression protection

审计方法层面：新增/归属类核验必须显式使用 `--diff-filter=A`（或显式说明包含 M/R）。这是方法论纪律，非机械 gate 可覆盖。
