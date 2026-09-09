---
id: FINDING-0003
status: Confirmed
type: control-gap
severity: Critical
affected: [repo, skill]
observed_in: gen1
direction: C
root_cause: R4
github_issue: 5
---

# FINDING-0003：Declaration 与 Enforcement 强度脱节：文档 MUST ≠ mechanical deny

## 观察

可判定规则（文件存在、路径、marker、regex、版本一致性、heading 结构）可以机械 fail-closed；判断型规则（sibling closure、control-plane tracing、root cause、engineering restraint、impact search）主要靠 AI 自律或人工 review。但两类规则在文档里使用完全相同的 `MUST` / `MUST NOT` / `必须` / `不得`，形成「规范语言强度 ≠ 实际 enforcement 强度」的危险错觉。

## 证据

- **C02 无 carrier**：sibling-instance omission 实验——16 个同类调用点只留下最后 1 个错误，跑 8 个 gate，0/8 捕获，全部绿色（Issue #5）。
- **C01 强度脱节**：规范语言强度与实际 enforcement 强度成 100% vs 0% 的 gap。
- **C03 prompt 是 guidance**：AI 阅读并引用规则后仍可能违反（engineering-restraint 实例）——自然语言规则即使进入上下文，也不能提供程序级执行保证。Issue #5 Evidence 2：agent 在同一 session 里先引用 machinery test 拒绝了两个方案，随后立即写了两个违反该规则的 throwaway 脚本（read → cited → violated）。
- **judgment surface 规模**（Issue #5 Evidence 3）：跨 9 个文件（6 payload policies + SKILL.md + 生成 AGENTS 模板 + AGENTS.md）枚举出 8 类 judgment 子句（machinery test / human-attested evidence / control-plane tracing / sibling-instance enumeration / must state a reason / never assume correctness / negative-evidence requirement / escalate the decision），全部无机械 carrier。
- **C04 enforcement semantics 未统一**：当前语义分散在各脚本和文档——`advisory` / `--gate` / `--release-gate` / `human-attested` / `unverified` / `exit 0` / `exit 1`，没有统一的 allow / deny / warn / require-review 四值语义，导致「这个检查到底意味着什么」不清晰（Issue #7 §24）。
- **无 carrier 的判断型子句清单**（Issue #5 Affected clauses）：① 工程克制/machinery test（coding.policy.md，Evidence 2 命中）② 双域对称（lifecycle.policy.md）③ sibling-instance closure（lifecycle.policy.md，Evidence 1 命中）④ control-plane tracing（lifecycle.policy.md）⑤ evidence tiers（lifecycle.policy.md + testing.policy.md，无 gate 查 tier 是否真实存在）⑥ failure budget / escalation（lifecycle.policy.md，`repairSessionId` 无机械 carrier）⑦ Rule Capture（lifecycle.policy.md Phase 5）⑧ impact-face search（Phase 3，gate 只查声明文件已交付，不查搜索是否真的发生）。共 8 条，全部 judgment-based，enforcement 实测或推定为零。

## 根因

- 判断型规则没有被结构化成可观测事实：没有可判定的数据模型（contract + instance 清单）。
- 所有规则统一写 `MUST`，没有正式区分 mechanical / heuristic / review / guidance。
- enforcement 语义用「模式开关 + 退出码」表达，而不是用统一的值语义表达——advisory 与 blocking 的真实强度只能从实现推断。

## 影响

- 大量「治理规则」实际只是 statement of intent，不是 control。
- 规则可能存在却不 enforce；规范语言让读者误以为有保护。

## 关闭条件

1. 至少一条判断型规则（如 sibling closure）拥有可判定数据模型（contract + instance 枚举），机械 checker 输出确定结果。
2. 正式区分 enforcement 语义（allow / deny / warn / require-review）。
3. 规范语言不再对判断型规则使用与可判定规则相同的 MUST。

## 解决情况

（待填。）

## 回归保护

一个负向 fixture：删除一个 sibling 实例 → checker 必须变红。机械规则必须有负向 oracle。
