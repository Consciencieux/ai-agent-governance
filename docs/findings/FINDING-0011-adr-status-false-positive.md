---
id: FINDING-0011
status: Confirmed
type: defect
observed_in: gen1
---

# FINDING-0011：check-doc-consistency 的 adr_statuses 启发式把正文里的 [Unreleased] 节名误报为「ADR 状态异常」

## 分类

- 严重度：低
- 影响范围：repo
- 研究方向：E. 检查器正确性 / 回归

## 观察

`node scripts/check-doc-consistency.js --release-gate` 持续报告：

```text
adr_statuses:
  - adr-0012-record-responsibility-boundary.md: marked Unreleased but releases exist
```

但 ADR-0012 的 `- 状态：Accepted`，根本不是 Unreleased。误报源是 ADR 正文第 39 行引用了 CHANGELOG 的 `[Unreleased]` 节名作为行文内容。

## 证据

```text
Select-String -Path docs\design-decisions\adr-0012-*.md -Pattern 'Unreleased'
# → line 39: 讨论 CHANGELOG [Unreleased] 节边界时的正文引用
```

ADR 状态字段为 `状态：Accepted`，无异常。误报来自正文中的字符串匹配，不是状态解析。

## 根因

`adr_statuses` cluster 对「marked Unreleased」的判定没有限定在 Status 字段区域，而是全文扫描；正文里合法出现的 `[Unreleased]`（CHANGELOG 节名）被当作状态声明。

## 影响

- 每次 release-gate 都输出这条告警（当前 advisory、不阻断）。
- 掩盖真实 adr_statuses 信号：若未来真有 ADR 状态漂移，会被这条持续误报淹没。

## 关闭条件

1. 定位 adr_statuses 对「Unreleased」的判定逻辑。
2. 将判定限定在 Status 字段（`- 状态：`）内，或对正文引用显式豁免。

## 解决情况

（待填。）

## 关联

- ADR-0012
- GitHub Issue #6

## 回归保护

一个负向 fixture：ADR 正文包含 `[Unreleased]` 字面引用但状态为 Accepted 时，adr_statuses 不得报 Unreleased。修复后由 `consistency.test.js` 覆盖。
