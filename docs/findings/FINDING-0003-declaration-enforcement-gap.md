---
id: FINDING-0003
status: Resolved
type: control-gap
observed_in: gen1
---

# FINDING-0003：声明与执行强度脱节：文档 MUST ≠ 机械拒绝

## 分类

- 严重度：严重
- 影响范围：repo、skill
- 研究方向：C. 执行强度缺口

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

**进展（2026-09-13 · PLAN-0053 候选 A）：**
- **关闭条件 3（余量收口）：** 其余 judgment 类在权威正文显式标 `judgment`，并与已有 `mechanical` 边界区分——① 机制测试（`coding.policy`）② 双域对称 ④ 控制面追查 ⑤ 证据档 ⑥ 失败预算 ⑦ Rule Capture ⑧ 影响面/引用搜索；③ sibling 维持 judgment + declared-contract mechanical。表征：`tests/suites/judgment-language.test.js`（产品语言断言；不得要求载荷嵌入 FINDING ID）。
- **关闭条件 1–2：** 仍以 PLAN-0050 切片为准（sibling 合同 + `enforcement-semantics` 四值）。

**状态：Resolved（2026-09-13）** — 三条关闭条件均已满足。Resolved ≠ 为其余 7 类补齐机械 carrier；无 carrier 的义务继续以 **judgment** 执行，禁止把门禁绿误读成判断已完成。

**历史（2026-09-13 · PLAN-0050 第二刀）：**
- **关闭条件 1（切片）：** `scripts/check-sibling-closure.js` + 合同模型（`instances[].path`）+ 本仓 dogfood；负向：缺 sibling → deny。
- **关闭条件 2：** portable `references/principles/enforcement-semantics.md` 四值语义 + judgment/mechanical 分层。
- **关闭条件 3（当时部分）：** sibling 闭包已标 judgment；仅对已声明合同使用 mechanical deny。

**必装阻断面（2026-09-12 · PLAN-0044 / ADR-0024）：** `npm run check:must-ship` 等 fail-closed 集合对 2.0 blocker 切片仍有效；与本条 Resolved 独立。

## 关联

- GitHub Issue #5 · PLAN-0050 · PLAN-0053

## 回归保护

- 负向 fixture：删除一个 sibling 实例 → checker 必须变红。
- 语言分层表征：八类 judgment 标记不得从权威正文回退（`judgment-language` suite）。
