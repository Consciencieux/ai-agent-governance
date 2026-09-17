---
id: FINDING-0037
status: Resolved
type: research-observation
observed_in: gen2
resolved_in: gen2
---

# FINDING-0037：Agent 习惯与语义靠脚本约束约等于 0；结构与同步才是脚本的有效区

## 分类

- 严重度：高（决定「该不该加门禁」的默认答案；判错会制造假治理或漏掉真可机械面）
- 影响范围：本仓建设与 INSTALLED 门禁设计；与工程克制 / 机制测试同轴
- 研究方向：C. 执行缺口 · E. 检查器正确性 · G05 治理自身膨胀 · G03 zero-attention
- 同族：FINDING-0003、FINDING-0005、FINDING-0015、FINDING-0032、FINDING-0033、FINDING-0034、FINDING-0035

## 观察

本仓反复用脚本去「保证 agent 听话」：同意语义、judgment、术语对齐、CHANGELOG 该不该写、原则有没有遵守。结果几乎总是：脚本只能看到**字面痕迹**（关键词、标记、子串、文件存在），看不到**执行与理解**；日常绿灯还制造「已经管住了」的错觉。

对照之后，有效面几乎只剩一类：

1. **结构 / 同步（脚本有效）** — 文件在不在、链接断不断、树齐不齐、清单/角色/触发器/版本同步点是否对齐。不依赖 agent「想对」。
2. **习惯 / 语义 / 判断（脚本约等于 0）** — 同意是否成立、judgment 是否做完、该不该写、有没有按流程做。文档 + 审查；接受无法机械保证。
3. **动作分类（中间层，勿与 2 混淆）** — 密钥进暂存、git argv 分类、锁、sibling 缺文件：可 deny，但管的是「这类操作能不能过」，且要有人/CI 真跑；**不是**习惯执法。

## 证据

1. FINDING-0034 / 0035：Forbidden、numeric_claims、consent marker、narration 禁词、judgment 子串套件——难语义贴薄检查，退役后日常失败面几乎不损真约束。
2. 清仓后剩余 daily 门禁（broken-links、layout、parity、role、protected-files 枚举对齐、version 同步点等）证明的都是**产物形状**，不是 agent 执行度。（`prompt-sync` / `daily-check-surface` 于 2026-09-18 再退役，不改变本条结论。）
3. CTRL-0002 `check-git-consent` 只分类 argv，不证明「人已经同意」；不跑则效力为 0（与 FINDING-0015 注意力/触发同族）。
4. coding.policy 机制测试早已要求「非平凡机制须自证必要」；本条是把它落到**门禁有效区**的显式切割。

## 根因

把「希望 agent 养成的习惯」误当成「可用 exit code 证明的不变量」。习惯在模型注意力与对话里，不在仓库树里。

## 影响

- 再为习惯/语义加门禁 → 预算浪费 + 假安全感（0034/0035 模式）。
- 叙述「check 绿 = agent 执行度有保障」→ 系统性撒谎。
- 正确默认：习惯靠权威正文与审查；结构靠脚本；动作分类可脚本但声明边界。

## 是否「迄今最重要」

在**「脚本/门禁该不该加、能证明什么」**这条决策轴上：是——截至目前最重要的操作准则；0034/0035 是病例，本条是通则。

与并列的顶层发现分工不同，勿互相取代：

| 发现 | 回答的问题 |
| --- | --- |
| ADR-0020 / 生产者≠产品 | 谁的治理、什么可以进载荷 |
| ADR-0023 / 控制模型 | Rule→Trigger→Evidence→Block 如何命名 |
| **本条** | **什么值得机械化、什么几乎机械化不了** |

## 关闭条件

1. 本准则写入 `references/policies/coding.policy.md` § 工程克制与机制测试（人话、可执行的默认）。
2. 后续不得把「agent 习惯/语义已有脚本保障」写进 CHANGELOG、README 或 Finding 关闭声明。
3. 新增门禁前用本条三层分类自检；落在第 2 层 → 默认不加脚本。

## 解决情况

2026-09-16：准则写入 coding.policy；本 Finding Resolved。病例清仓见 FINDING-0035。

## 关联

- FINDING-0034、FINDING-0035、FINDING-0003、FINDING-0015、FINDING-0033
- `references/policies/coding.policy.md` § 工程克制与机制测试
- `docs/research/RESEARCH-0014-mechanizable-vs-judgment-governance.md`（理论 / 科研议程；本条是操作通则）
- ADR-0027（规范选择）· ADR-0020、ADR-0023

## 回归保护

无「禁习惯门禁」机械 carrier（刻意，避免 0034 重演）。回归靠：再提同类脚本时指向本 Finding；机制测试提问含本条三层。
