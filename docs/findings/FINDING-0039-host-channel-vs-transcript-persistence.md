---
id: FINDING-0039
status: Confirmed
type: mechanism-gap
observed_in: gen2
---

# FINDING-0039：长期遵守靠宿主每轮重贴文件和机械闸门，聊天窗口里的嘱咐会被压缩忘掉

## 分类

- 严重度：高（把「写进 AGENTS / 跟 Agent 说一声」当成跨回合保证，会高估产品已能长期管住 Agent）
- 影响范围：INSTALLED 入口（`AGENTS.md` / 生成子技能）· 产品文档 `anti-regression.md` · INIT 产物集 · 与 Cursor / Codex / Claude Code 宿主加载通道
- 研究方向：B. 政策 / 控制平面 · C. 执行缺口 · F. 可移植性 / 运行时边界

## 观察

Cursor、Codex 一类编程宿主**不是**让模型把聊天里那几句「请遵守」记到会话结束。它们把规则放在**聊天记录外面**，每一轮模型请求由宿主从磁盘再贴进去；关键动作再加一层**不经过模型记忆**的机械闸门。

开发者在会话早期对窗口说的约束，只是 transcript 里的一条用户消息。长会话会摘要、截断、压缩；摘要优先保留「正在改什么文件」，很少完整保留早期约束。规则和当前决策点隔得越远，召回越差。这与 FINDING-0015（写进上下文 ≠ 到该决策时还会用）同轴，但 0015 说的是**静态长文稀释注意力**；本条钉的是**通道种类**：

| 通道 | 规则活在哪 | 压缩之后 |
| --- | --- | --- |
| 聊天嘱咐 | 用户消息 / 早期回合 | 常进摘要或被丢掉 |
| 宿主重贴 | 仓库或用户设置里的规则文件 | 下一轮请求仍会再附上 |
| 机械闸门 | CI / hook / 分支保护 / 沙箱 | 模型忘了也会红或被拒 |

本 skill 的 INIT 已经往被治理项目写 portable 入口（`AGENTS.md`、`docs/rules/`、生成子技能），意图是让宿主去贴、而不是让人每个窗口复述。但产品叙事把「会话开始读入口」写成防回归保证，且点名了 INIT **并不生成**的 Cursor 通道；长期遵守模型没有写成这三层，容易让人以为「有 AGENTS + 聊过了」就等于 Cursor 那种跨回合遵守。

## 证据

### A. 宿主实际怎么贴（对照面，2026-09-16）

| 载体 | 谁贴进去 | 何时出现 |
| --- | --- | --- |
| Cursor User Rules | 产品设置 | 几乎每轮 |
| `.cursor/rules/*.mdc`（`alwaysApply: true`） | Cursor | 每轮 |
| 同目录 glob 规则 | Cursor | 打开/编辑匹配文件时 |
| `AGENTS.md` / `CLAUDE.md` | Cursor、Codex、Claude Code 等 | 会话开始或按产品约定常驻 |
| Skill（`SKILL.md`） | 宿主按 description 匹配 | 任务对上才加载 |

Cursor 官方规则形态还要求短（约几十行、一事一文件），用 glob 限制范围——改 `.ts` 才加载 TS 规则。Codex 同类：薄 `AGENTS.md` + 指向细节。这与 ADR-0022（入口只留不变量和路由）同向。全量 always-on 越厚，和聊天约束一样会被注意力稀释。

### B. 机械闸门不靠记忆

真正不经过「Agent 是否想起」的：

- CI required check（没跑或红了就不能合）
- pre-commit / secret scan（提交时跑；可被 `--no-verify` 绕过，故不是授权机制）
- 分支保护 / 禁止直推
- 沙箱与写权限（网络、git 写要人点）

本 skill 已安装的 `check-secrets.js`、`verify-governance.js`、`check-git-policy.js` 属于这一层：**Agent 就算报告「过了」，CI 或 hook 仍可拦。** FINDING-0004 的缺口仍在：本地许多门禁仍要 Agent 先想起去跑；CI 才是不靠注意力的触发。

### C. 本仓声明与 INIT 产物不对齐

1. 三语 `docs/product/*/anti-regression.md` 写：`AGENTS.md` / `CLAUDE.md` / **`.cursor/rules/`** 在**会话开始**自动读取，并指向 `references/instruction/agents-md.template.md`。
2. `references/init-spec.json` 的 copy/generated 清单**没有** `.cursor/rules/` 或 `*.mdc`。生成器写的是 portable `AGENTS.md`（源：`agents-md.template.md`）；`CLAUDE.md` 是 Agent 兜底适配，不是 Cursor rules 树。
3. 该模板自身也不描述「每轮重贴 vs 聊天压缩」；`anti-regression.md` 把加载时机写成会话开始，弱于宿主「几乎每轮从磁盘再附上」的实际行为。
4. 本仓 `route-task.js` / 能力叶表是 REPO-ONLY 施工路由，**不**随 INIT 装进被治理项目，不能替代 Cursor glob / Skill 匹配。

## 根因

两层勿混：

1. **通道未建模。** 治理被写成「文件在仓库里 + Agent 会读」，没有区分 transcript 约束、宿主系统通道、机械闸门。聊天嘱咐和 `AGENTS.md` 被当成同一类「规则」。
2. **portable 入口被当成已覆盖全部宿主 adapter。** 工具中立合同只保证跨工具都能读 `AGENTS.md`；Cursor 的 glob / alwaysApply、User Rules、Skill 匹配是宿主面（与 FINDING-0007 的 adapter 分层同轴，但 0007 钉的是 before_write 硬拦，本条钉的是**每轮重注入**）。没有 adapter 时，产品页仍点名 `.cursor/rules/`，用声明补齐未交付通道。

## 影响

- 用户以为「INIT 过 + 窗口里说过」就能得到 Cursor 那种跨回合遵守；长会话后习惯/流程类规则仍会丢（FINDING-0015 / 0037）。
- 高估 `AGENTS.md` 体积：入口越厚，宿主每轮重贴的稀释越严重，和「再写长一点就不会忘」相反。
- `anti-regression.md` 对 `.cursor/rules/` 的声明是未交付投影，属于声明与机制差距（testing.policy § 声明与机制的差距）。

## 关闭条件

1. **三层模型写进产品面向说明**（overview 或 anti-regression，一处权威）：聊天嘱咐会被压掉；长期遵守 = 宿主每轮重贴仓库/设置中的规则文件；关键不变量 = CI/hook/分支保护，不交给记忆。加载时机不得写成「只在会话开始」以涵盖 Cursor 每轮重贴。
2. **停止过称：** 未由 INIT 生成的路径（今日：`.cursor/rules/`）不得出现在「自动加载入口」清单；`CLAUDE.md` 仅在确有生成/适配步骤时列出。
3. **若做 Cursor（或其它宿主）adapter：** 政策正文仍只在 INSTALLED `docs/rules/`；`.mdc` / 宿主规则文件只做短指针 + glob / alwaysApply，禁止第三份权威。进 INSTALLED 的宿主专用树须 Narrow ADR（FINDING-0007），默认 opt-in，不挡 2.x tag，不把 L3 before_write 当作本条关闭条件。
4. 本条**不**要求关闭 FINDING-0004（本地自动触发）或 FINDING-0015（静态 vs 决策点注入实验）；那两份各有关闭条件。本条只要求通道模型诚实、声明与 INIT 产物对齐。

## 解决情况

（待填。）Confirmed。不升 Plan，直至人类选定首切片（纠过称 vs 真做宿主 adapter）。

## 关联

- FINDING-0015（静态长文 / 决策点距离；本条补通道种类）
- FINDING-0004（门禁触发仍靠注意力；机械层）
- FINDING-0007（portable vs adapter；本条是重注入通道，不是 tool-call 硬拦）
- FINDING-0002（Agent 记忆当 dispatcher）
- FINDING-0037（习惯/语义脚本有效区 ≈ 0）
- ADR-0022（薄入口 + 按需加载）
- ADR-0024 / ADR-0025（host adapter / L3 = later / H3，不挡必装）

## 回归保护

类型是 `mechanism-gap`：关闭时须能指出产品文档中的三层模型，且 `anti-regression`（或其后继权威页）列出的自动加载路径 ⊆ INIT 实际生成/文档化的适配步骤。不要求为「Agent 是否遵守聊天嘱咐」写机械 deny。宿主 adapter 若落地，须有「`.mdc` 无第二份政策正文」的检查或评审清单，避免与 `docs/rules/` 双写。
