---
id: FINDING-0008
status: Confirmed
type: research-observation
severity: Medium
affected: [repo, skill]
observed_in: gen1
direction: G
root_cause: R1
github_issue: 7
---

# FINDING-0008：治理测量缺口：缺少证据模型、traceability 与 Zero-Attention 成熟度标准

## 观察

当前 evidence model 过度依赖 Agent 自述（「我已经搜索过」「我已经验证过」），缺少 `Rule → Gate → Negative Test → Boundary` 的 traceability，也缺少 Zero-Attention 成熟度标准与科研测量框架。

## 证据

- **G01 证据自述**：evidence 是 AI 声称而非执行结果；理想是结构化 evidence receipt（rule / tool / query / exitCode / timestamp / resultHash）。
- **G02 缺 traceability**：一条规则可能存在于 SKILL.md / AGENTS.md / lifecycle.policy.md / testing.policy.md，对应机制在 check-X.js / tests/suites/Z.test.js / package.json / ci.yml——系统无法回答「GOV-017 由谁 enforce、在哪触发、哪个 test 证明它会 fail、哪个 CI job 真正阻止 release」。
- **G04 缺测量框架**：没有持续测量 enforcement coverage / trigger coverage / FP / FN / runtime / token burden / human review cost / attention failure rate。
- **G05 治理膨胀**：每个事故 → 新增 policy/checker/test/docs/CI，产生 governance recursion 风险。

## 根因

- evidence 被当作 AI 声明而非机械执行产物。
- rule 缺少唯一 id 与 traceability 登记。
- 治理系统自身没有测量与回归基线（Zero-Attention 假设）。

## 影响

- 「成熟度」被功能完整度（文件多、规则多、测试多、checker 多）误判，而不是零注意力下还能保证什么。
- 无法做可重复实验的科研。

## 关闭条件

1. Evidence 成为执行结果（结构化 receipt），而非 AI 自述。
2. 建立 Rule → Gate → Negative Test → Boundary traceability。
3. 引入 Zero-Attention 成熟度模型：假设 Agent 完全不记得任何规则，问「secret 还能不能进 commit / wrong stack 能不能生成 / release metadata 能不能漂移 / CI 是否还能保证运行」。
4. 测量框架落地（trigger coverage、FN/FP、runtime、token、human cost）。

## 解决情况

（待填。）

## 回归保护

对每条已注册 rule，traceability 测试断言：rule id 存在 → 有机制 → 有负向测试 → 有边界声明。四环缺一即红。
