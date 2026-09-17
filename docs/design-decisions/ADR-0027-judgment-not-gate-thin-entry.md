---
id: ADR-0027
status: Accepted
generation: gen2
---

# ADR-0027：判断型义务不靠门禁；入口不靠堆全文保证阅读

## 背景

本仓反复把「Agent 不听话」做成 checker（术语黑名单、consent 标记、narration 禁词、judgment 子串）。结果只看见字面痕迹，日常绿灯制造假治理（FINDING-0034 / 0035）。FINDING-0037 把操作默认写成：结构/同步可脚本；习惯/语义脚本 ≈ 0；动作分类可 deny 但不是习惯执法。

RESEARCH-0014 把该切割抽成理论：L1 结构、L2 动作分类、L3 判断/习惯；三条不可化约（代理坍缩、形式化缺口、规则 vs 标准）。业界 policy-as-code / 沙箱硬化的是 L1/L2 或召回通道，不是精神遵守。

随后出现一种看似省事的产品策略：**把所有无法脚本化的 Finding 标无解关闭，把约束写进 capabilities/policies，再全部路由进 `SKILL.md`，以求「AI 一定读到」。** 这与 ADR-0022（薄入口、按需加载）和 FINDING-0015 / 0039（存在率 ≠ 决策点召回；聊天嘱咐会被压缩）直接冲突。ADR-0022 决策 8「越重要越机械化」若不作限定，会被读成「L3 也很重要所以必须上脚本」。

需要一条**规范选择**：科研与施工停止追什么、Finding 何时能关、L3 正文放哪、入口允许多厚。

系统描述：`docs/research/RESEARCH-0014-mechanizable-vs-judgment-governance.md`。操作默认：`references/policies/coding.policy.md` § 门禁有效区。义务四类：ADR-0026。

## 决策

**1. 采用 L1 / L2 / L3 切割作为本仓与 INSTALLED 面的不变量。** 含义与 RESEARCH-0014 / coding.policy 门禁有效区一致。新增门禁或「执行度保证」叙事前必须归类；落在 L3 → 默认不加脚本，禁止把 check 绿写成 Agent 已遵守。

**2. 停止把 L3 当成可门禁科研目标。** 不再为习惯、同意语义、精神遵守、无界 sibling 枚举、原则「有没有被想起」新增 daily/must-ship checker 或关键词套件。用另一个 LLM 做「语义门禁」仍属 L3，不得标 `mechanical` / 不得叙述成 deny。允许的收缩：把无界标准**缩小论域**写成已声明合同或结构化请求上的 L2（FINDING-0003 sibling 合同切片是范例，不是「枚举已机械化」）。

**3. Finding 不得仅因「无脚本」标无解并关闭。** 「停止追脚本」≠ Resolved。关闭仍须满足该条自己的关闭条件。仍开放的 L1/L2/通道工作（trigger、负向 oracle、动作拦截、测量、决策点注入、宿主重贴诚实性）不得借本 ADR 一笔勾销。关闭叙述若涉及 L3，应写「不宣称机械保证 / 停止习惯门禁」，禁止写「无解所以结案」。

**4. L3 硬规则的家是政策，不是入口百科，也不是能力叶仓库。** INSTALLED 常驻判断义务写入既有 `references/policies/`（能并则并，禁止每条 Finding 新开叶）。本仓施工判断义务写入 `repo-workflows/`。`references/capabilities/` 只承载任务怎么做。兑现分类用 ADR-0026 的 `inherent_judgment` / `require_review` / `unmechanized`，禁止把 L3 伪装成 `mechanical`。

**5. `SKILL.md` / 本仓 `AGENTS.md` 保持薄路由；「最大限度读到」不是成功标准。** 入口只做身份、少量 always-on、主题→权威路径。禁止为「保证 AI 读到所有软约束」把 Finding 约束全文或能力叶总目录堆进 SKILL。阅读保证靠：宿主对权威文件的重贴（FINDING-0039）+ 任务触达时加载（ADR-0022 决策 4）+ L1/L2 机械闸门。静态存在率最大化已被 FINDING-0015 否证。

**6. 机械优先只适用于 L1/L2。** 规则越重要，越应问「能否变成可观察结构或动作分类」，而不是「越重要越加脚本」。本条 **narrow-amend** ADR-0022 决策 8 中未限定的「升级为机械 control」读法；0022 其余条款不变。

## 备选（否决）

| 方案 | 否决理由 |
| --- | --- |
| 凡无脚本的 Finding 一律 Invalidated/Resolved（无解） | 把仍可做的 L1/L2/通道与真正的 L3 捆死；关闭条件被绕过 |
| L3 全文进 SKILL / 能力叶，靠路由「读全」 | 厚入口；注意力稀释；与 ADR-0022 / FINDING-0015 / 0038 冲突 |
| LLM 评审脚本当作机械控制 | 类别错误（仍在 L3）；假 deny |
| 维持 ADR-0022 决策 8 无限定 | 「重要 ⇒ 脚本」会复活 0034/0035 |

## 后果

- H3（ADR-0025 / PLAN-0054）成功标准：拦截 tool/capability 或测量注入通道，不是 hooks 养成习惯。
- Zero-attention 成熟度（FINDING-0008 / RESEARCH-0003）只对 L1/L2 提问。
- 施工 Agent：修一处入口/政策时仍须判断同类表面（lifecycle § 同类实例闭包）；该义务 **inherent_judgment**，不因此授权新 checker。
- 本 ADR 不授权立刻批量改写 Finding 状态、不授权把 RESEARCH-0014 正文拷进 SKILL、不新建 `references/judgment/` 目录。

## 参考

- RESEARCH-0014 · FINDING-0037 / 0003 / 0015 / 0039 / 0034 / 0035 / 0038 / 0008 / 0007
- ADR-0022（决策 8 由本 ADR 限定）· ADR-0026 · ADR-0023 · ADR-0025
- `references/policies/coding.policy.md` § 门禁有效区 · `references/principles/enforcement-semantics.md`
