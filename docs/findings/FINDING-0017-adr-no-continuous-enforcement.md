---
id: FINDING-0017
status: Confirmed
type: architecture-gap
severity: High
affected: [repo, skill]
observed_in: gen1
direction: E
root_cause: R1
github_issue: 7
related:
  adrs: [ADR-0010]
---

# FINDING-0017：FINDING-0017：ADR 无持续 enforcement：ADR Accepted ≠ future changes constrained

## 观察 Observation

ADR 记录架构决策，但没有机制保证后续变更被 ADR 约束。ADR Accepted 之后，违反 ADR 的变更可以继续发生而不触发任何信号。

## 证据 Evidence

- Issue #7 §17（Evidence 7）：ADR 已决定「entry-layer docs 应描述稳定语义，而非高频变化的实现事实」，但之后 README 又重新出现 INIT inputs 数量、generated artifacts 数量、scripts 数量、policies 数量、sub-skills 数量、hardcoded version——随后版本漂移。
- 即 `ADR Accepted ≠ future changes constrained`；ADR 当前更多是 human/agent architectural memory，不是 executable architecture constraint。

## 根因 Root cause

ADR 是冻结的决策记录，但没有与之绑定的机械检查（谁负责验证「后续变更未违反 ADR」未定义）。ADR-0010 定义了 entry-layer 边界，但没有 gate 持续验证边界不被侵蚀。

## 影响 Impact

- 架构决策会「静默过期」：ADR 状态 Accepted，实际约束力趋近于零。
- 违反 ADR 的变更进入发布，直到下一次 review 才被发现。

## 关闭条件 Resolution criteria

1. 对可判定的 ADR 决策（如「entry-layer 不写实现事实数量」），绑定一个 mechanical check 或一致性 cluster 持续验证。
2. 对纯判断型 ADR 决策，至少在 review 流程中作为必查项（与 FINDING-0014 的 review taxonomy 衔接）。

## 解决 Resolution

（待填。）

## 回归保护 Regression protection

对每个可判定的 ADR 决策：一个负向测试证明「违反该 ADR 的变更」会被检查拦截。ADR 状态字段可考虑与 adr_statuses cluster 关联。
