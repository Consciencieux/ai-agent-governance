---
id: RESEARCH-0003
status: Active
version: 1
subject_generation: gen1
---

# RESEARCH-0003：评价框架

> 衡量治理系统有效性的指标集。对应科研目标：从「工程经验」升级为「可重复实验的平台」（FINDING-0008 G04）。

## 核心指标

```text
Trigger Coverage        门禁该运行时有没有运行
Detection Coverage      运行以后能不能发现违规
Blocking Coverage       违规是否真正阻止 action
Negative Oracle Coverage 每条机械规则是否有负向回归保护
False Positive Rate     误报率
False Negative Rate     漏报率
Runtime Cost            验证耗时
Token Burden            上下文/注意力负担
Human Review Cost       人工 review 成本
Attention Failure Rate  Agent 忘记规则/门禁的频率
```

## 治理可靠性两维（基础）

```text
Trigger Coverage
门禁该运行时有没有运行

Detection Coverage
运行以后能不能发现违规
```

当前本地 Trigger Coverage 有缺口（FINDING-0004）；Detection Coverage 是 Issue #5 研究的主轴（FINDING-0003）。

## 更有意义的成熟度指标

不把「测试数量」（332/332）作为核心证据，而是：

```text
Mechanical rules: 42
With executable carrier: 38
With negative oracle: 34
Trigger paths tested: 8/10
Blocking paths tested: 6/8
```

测试数量很多不能证明 `Rule → mechanism → trigger → gate → block` 链完整（FINDING-0006 E03）。

## 未来实验设计

### 实验 1：静态 AGENTS vs decision-point injection

```text
静态全量 AGENTS
vs
decision-point policy injection
```

哪一个违规率更低？（FINDING-0015）

### 实验 2：full test vs incremental dispatcher

```text
每个 change 跑 broad gate
vs
architectural checkpoint + targeted safety kernel
```

哪个在相同 defect detection 下成本更低？（ADR-0014 Migration Mode 提供第一个真实数据源）

### 实验 3：Generation-1 vs Generation-2

```text
Document + scripts
vs
Rule Registry + Dispatcher
```

对比 enforcement coverage、trigger coverage、runtime、token、human cost。

## Zero-Attention 成熟度标准

假设 **Agent 完全不记得任何治理规则**，然后问：

```text
secret 还能不能进 commit？
wrong stack command 能不能生成？
release metadata 能不能漂移？
CI 是否还能保证运行？
```

真正机械的 rule 应尽量在该假设下成立；prompt rule 则明确承认 zero-attention 下不保证（FINDING-0008 G03）。这是判断「治理 control vs 只是 guidance」的标准。

## 数据源

- `docs/findings/`：governance findings 统计（mechanical gaps / trigger gaps / FP/FN / cross-profile defects / vacuous passes / attention failures / time-to-resolution / regression-protected %）
- `docs/research/experiments/`：实验记录
- ADR-0014 Migration Mode：full vs incremental validation 对比
