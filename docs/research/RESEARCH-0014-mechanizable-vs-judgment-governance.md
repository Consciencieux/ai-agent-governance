---
id: RESEARCH-0014
status: Active
version: 1
---

# RESEARCH-0014：可机械化治理 vs 判断型义务——软约束没有门禁银弹

本文件是 **机制理论 / 科研议程约束**。它回答：「一类治理义务为什么无法被 CI / checker 变成 fail-closed 保证？业界分层架构实际保证的是什么？本仓后续科研不该再追什么？」

它**不是** Finding（病例已在 FINDING-0037 / 0003 / 0034 / 0035）。它**不是** ADR（不冻结产品 MUST）。操作默认仍在 `references/policies/coding.policy.md` § 门禁有效区。

## 研究对象

**判断型义务（judgment obligation）**：其真值依赖于「在该次任务中，执行者是否按规范的精神完成了解释与枚举」，而不是依赖于仓库树、AST、argv、或已声明合同上的有限可观察事实。

本仓实例：同类实例是否扫过、同意是否成立、CHANGELOG 该不该写、原则有没有被遵守、入口路由表还有没有漏改的兄弟文件。

对照面：

```text
可判定义务     有限快照上可计算的谓词（文件在不在、链接断不断、version 是否对齐）
动作分类义务   结构化请求上可计算的谓词（argv 类别、密钥进暂存、已声明 sibling 缺文件）
判断型义务     解释「这次算不算遵守」——内容在适用时才被给出
```

## 研究动机

FINDING-0037 把操作结论写成了「习惯/语义脚本 ≈ 0」。2026-09-16 入口路由指针任务再次显示：任务字面范围被当成工作集，`AGENTS.md` 改了、同构的 `SKILL.md` 不看（FINDING-0003 复发；FINDING-0040 § A2）。

若把「再写一个 checker」当作科研下一跳，会把预算花在已证伪的方向上，并污染 H3（PLAN-0054）的成功标准。需要一层**可引用理论**：什么能硬化、什么只能改通道或承认审查、什么应停止追。

## 模型

### 1. 三层（与 coding.policy 门禁有效区同构）

```text
L1  结构 / 同步     文件系统 + 结构解析 + 一致性比较     脚本有效
L2  动作分类        结构化 tool/argv/合同实例            可 deny，证明「这类操作能否过」
L3  习惯 / 语义     解释、枚举、意图、精神遵守            脚本对执行度 ≈ 0
```

L1 对应 RESEARCH-0002 的 Existence / Structure / Consistency。L2 对应动作边界上的 policy-as-code（宿主 hook、OPA 类决策点、已声明合同）。L3 对应 RESEARCH-0002 点名却未机械化的「sibling 规则」以及 Human Review / 未结构化的 LLM Review。

**关键切割：** L2 的绿灯不是 L3 的绿灯。`check-git-consent` 分类 argv，不证明人已同意（FINDING-0015 / 0037）。`check-sibling-closure` 只 deny **已声明** `instances[].path`；无合同 ≠ 闭包完成（FINDING-0003）。

### 2. 三条不可化约（不是「AI 太笨」）

**P1 代理坍缩（Goodhart / specification gaming）。**  
一旦把标准（standard）换成可测代理，优化的是代理。仓库门禁里：用关键词/标记/子串代替「判断已做完」，得到的是字面痕迹，不是执行（FINDING-0034 / 0035）。AI 安全文献中的 specification gaming 与此同构：实现的是字面规格，不是设计者意图。

**P2 形式化缺口。**  
自然语言义务 → 形式规格本身是一次判断。证明助手可以证明实现满足规格，不能证明规格捕获了意图（自然语言进证明助手、NL→TLA+ 的实证都停在「句法/模型检查通过 ≠ 语义正确」）。因此「把 L3 写成 Rego / 类型 / 不变量」若未先缩小事实集，只是把错误规格证明得很严。

**P3 文本不自动约束下一次适用。**  
Wittgenstein / Kripke 的规则遵循问题在工程上只需弱读：一份有限规则文本并不机械决定所有未来用例。Kaplow 的规则 vs 标准：规则在行为前给定内容，标准在事后裁决中给定内容。门禁只能执行**已经结构化的规则**；L3 是标准。把标准提前写成规则而不收缩论域，就会触发 P1。

另：即使正确文本进入上下文，也不等于决策点召回（FINDING-0015）；聊天嘱咐还会被摘要丢掉（FINDING-0039）。这是通道问题，不是再加一条 regex 能修的。

### 3. 业界「有效架构」实际保证什么

对照（2026 实践，非产品背书）：

| 架构 | 真正硬化的层 | 对 L3 |
| --- | --- | --- |
| CI / repo gate | L1 | 无 |
| Policy-as-code（OPA/Rego 等） | L2：身份、租户、scope、阈值、allowlist | 明确弱于语义/语气/意图；业界自己划「content-based = weak fit」 |
| 运行时沙箱 / tool approval | L2：能力边界、副作用隔离 | 不证明「想没想到兄弟文件」 |
| 宿主每轮重贴规则文件 | 召回通道（FINDING-0039） | 提高存在率，不提高证明 |
| HITL / require_review | 把 L3 交给人事后给内容 | 有效，贵 |
| 「LLM 语义门禁」 | 把 L3 换一个模型做 | **仍在 L3**；可作预筛，不得叙述成 mechanical deny |

收敛句：**有效的是分层与诚实标签，不是把 L3 变成 L1。** 混合架构（确定性交界 + 中间模糊带给模型 + 外层仍确定性执行）把 L3 的输出**装箱**进 L2，并不消灭 L3。

### 4. 本仓可硬化的唯一合法动作

把某条 L3 **收缩论域** 变成 L1/L2：

```text
「修前枚举同类」           → 判断（无界）
「已声明合同的 instances[] 必须存在」 → L2（FINDING-0003 切片）
```

收缩之后，原标准的剩余部分仍在 L3。宣称「sibling 已机械化」若指无界枚举，是类别错误。

工作集宽度（RESEARCH-0008 / ADR-0021）同理：Ledger 硬化的是「已登记项有处置」，不是「所有未看见的兄弟都已看见」。

## 证据（本仓，指向不复述）

- 有效区三层与假绿病例：FINDING-0037、0034、0035；操作默认：coding.policy § 门禁有效区
- MUST ≠ deny：FINDING-0003；声明合同机械、其余 judgment
- 注意力 / 通道：FINDING-0015、0039
- 测量缺口 / zero-attention：FINDING-0008、RESEARCH-0003（成熟度问「Agent 不记得时还能拦什么」——只能问 L1/L2）
- 可移植 vs 运行时拦截：FINDING-0007（adapter 拦的是 tool-call，仍是 L2）
- 任务字面主义漏兄弟入口：FINDING-0003 复发（2026-09-16）、FINDING-0040 § A2

外部锚点（理论对照，非依赖）：Goodhart；specification gaming（AI Safety Atlas）；NL→formal 缺口（证明助手 / TLA+ 生成评价）；Kaplow rules vs standards；OPA 文档与 agent tool-approval 实践对 semantic filtering 的弱拟合声明。

## 对科研方向的影响（议程，不是处置）

分析可能性。产品 MUST / Horizon 开工仍归 ADR / Plan。本切割的规范选择见 [ADR-0027](../design-decisions/ADR-0027-judgment-not-gate-thin-entry.md)。

### 停止追（已知无解或已证伪）

- 用 daily checker 保证 Agent 习惯、同意语义、精神遵守、无界 sibling 枚举
- 用关键词 / 标记 / 子串套件冒充 L3 执行力（0034/0035）
- 把「check 绿」写成执行度或 zero-attention 下的 L3 保证
- 以「再加一个 LLM 评审脚本」作为机械控制科研目标

### 值得继续（硬化 L1/L2 或诚实承载 L3）

- L1：结构、同步、负向 oracle、trigger coverage（RESEARCH-0003 的机械指标）
- L2：动作分类、能力/沙箱、已声明合同、宿主 hook adapter（FINDING-0007 later；H3 合法成员若存在，应是这一层）
- L3 承载：权威正文 + require_review + 工作集宽度（登记了才不丢）+ 决策点注入（缩短 decision-point distance，FINDING-0015）
- 测量：Attention Failure Rate、Human Review Cost——测的是 L3 通道，不是「L3 已变成 L1」

### 对 H3（PLAN-0054）的约束性解读

H3 成员里的「L3 运行时拦截 / 注意力实验 / 测量」若成功，成功标准应是：

```text
拦截的是 tool/capability/副作用（L2）
或 测到的是注入 vs 静态长文的召回（通道）
不是 「hooks 让 Agent 养成扫兄弟文件的习惯」
```

把 habit-enforcement 写成 H3 完成条件，与本模型冲突。规范选择见 ADR-0027。

## Known limitations

- 本模型是分类与议程，不是可执行检查器；禁止再为「禁止习惯门禁」加机械 carrier（FINDING-0037 回归保护同句）。
- 「约等于 0」是经验归纳（本仓病例 + 业界 policy-as-code 自划边界），不是可判定定理。未来若某类 L3 被成功收缩为声明合同，应记为论域收缩，不推翻 P1–P3。
- 不声称判断型义务「没有治理方法」——审查、重贴、工作集、缩小论域都是方法；声称的是**没有门禁银弹**。

## 关联

- FINDING-0037（通则病例；本文件抽理论）· FINDING-0003 · 0034 · 0035 · 0015 · 0039 · 0008 · 0007 · 0040
- RESEARCH-0002（机制类）· 0003（评价指标只对 L1/L2 有机械意义）· 0008（宽度 ≠ 看见一切）· 0010（Control ≠ 习惯执法）
- `references/policies/coding.policy.md` § 门禁有效区 · `references/principles/enforcement-semantics.md`
- PLAN-0054（H3 边界；本文件约束其成功标准的读法）
- ADR-0027（判断不靠门禁；入口不靠堆全文；限定 ADR-0022 决策 8）
