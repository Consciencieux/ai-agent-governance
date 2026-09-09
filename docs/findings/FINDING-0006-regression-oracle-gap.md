---
id: FINDING-0006
status: Confirmed
type: mechanism-gap
observed_in: gen1
---

# FINDING-0006：回归判定预言机缺口（Regression Oracle）：修复正确 ≠ 修复受保护

## 分类

- 严重度：高
- 影响范围：repo、skill
- 研究方向：E. 检查器正确性 / 回归

## 观察

修复正确不代表修复被保护。没有 negative oracle 时，把代码改回旧缺陷，所有 gate 仍可绿色。

## 证据

- **E02 stack defaults 无 negative oracle**：stack-derived command defaults（python → pytest/ruff、rust → cargo、go → go test/vet、java → mvn、docs-only → markdownlint）已正确修复并人工验证多个 stack，但无 regression test——改回 `npm test / npm run lint / npm run build` 后全部 gate 仍绿（Issue #5 Evidence 8）。
- **E01 vacuous pass**：历史多次「regex 永远匹配不到 / checker 只扫 trilingual plan tree 而 governed project 是 single-tree / 声称覆盖实际覆盖为零 / 全部绿色」（1.0.x 多起事故）。存在 checker ≠ checker 真正保护 invariant。
- **E03 测试数量误导**：`332/332` 不证明 `Rule → mechanism → trigger → gate → block` 链完整。

## 根因

- 测试组织是 suite-centric，不是 rule/invariant-centric。
- 机械规则没有强制要求「负向 fixture：破坏 invariant → checker 必须变红」。

## 影响

- 修复可能正确但未被保护，下次重构/回退时无声复发。
- 测试数量指标制造「成熟错觉」。

## 关闭条件

1. 重要 mechanical invariant 必须有 negative regression oracle（破坏 → 变红）。
2. 测试按 rule/invariant 组织，突出 positive + negative fixture。
3. 指标从「测试数量」转向「Rule protection coverage / Negative oracle coverage」。

## 解决情况

（待填。）

## 关联

- GitHub Issue #7

## 回归保护

对每条机械规则的负向 fixture：注入违反 → 断言对应 checker 退出非零。这是「机械规则必须有负向 oracle」原则本身的落地。
