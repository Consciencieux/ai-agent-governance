---
id: FINDING-0015
status: Confirmed
type: mechanism-gap
observed_in: gen1
---

# FINDING-0015：静态长 Prompt 造成注意力负担：规则存在率 ↑，但正确决策点召回率 ↓

## 分类

- 严重度：中
- 影响范围：repo、skill
- 研究方向：B. 政策 / 控制平面

## 观察

治理文件越来越多（AGENTS.md / SKILL.md / coding.policy.md / testing.policy.md / lifecycle.policy.md / git.policy.md …），规则越积越多。但「把规则放进上下文」不等于「AI 在真正需要的时候会调用它」——存在规则存在率上升、但正确决策点召回率下降的趋势。

这不是「自然语言写得太少所以 1.0 发挥不了」。v1.0.0 的 instruction surface 已经很大；真正的问题是自然语言、触发、执行和证据没有形成控制架构，于是 Agent 记忆充当 dispatcher。继续补 Markdown 只会抬高注意力负担。

## 证据

- 长任务受 context size / instruction density / rule similarity / tool output / 多轮上下文 / summary compression / 目标冲突 / decision-point distance 影响，规则被稀释。
- 静态长 Prompt 让每条规则与它真正适用的决策点距离变远（decision-point distance）。
- Issue #7 §13 提出的缓解方向：**decision-point policy injection**——AI 要改 `CHANGELOG.md` 时才动态加载 CHANGELOG structure / content boundary / one-entry-one-change / release timing，而不是任务一开始就把几十条规则全部压进上下文。
- **文本量已经不小（v1.0.0）**：`lifecycle.policy.md` 约 23 KB、`sub-skills.md` 约 31 KB、`agents-md.template.md` 约 15 KB；六份 policy 合计已超过 40 KB。当前 HEAD 上 lifecycle 继续胀到约 30 KB。完整体积表与拓扑见 RESEARCH-0009。
- **演进是少数核心文件膨胀，不是新原则高速增长。** 截至 v1.0.0，`release.md` 26 次、`agents-md.template.md` 24 次、`lifecycle.policy.md` 19 次、`sub-skills.md` 18 次；`testing.policy.md` 仅 2 次、`security.policy.md` 仅 1 次。哪里出问题就往 lifecycle / AGENTS / sub-skill / release 里塞。
- **lifecycle 与 sub-skills 都是单体。** lifecycle 名义上是 Understand→Report，实际是面向阶段的政策仓库；`sub-skills.md` 是约 31 KB 的能力源聚合，部分 leaf（如 `drift-check`）自己又是单体。拆成许多小 Markdown、却仍要求 Agent 记得何时加载，只是把一个大 prompt 变成许多小 prompt。
- **加载链依赖 Agent 记忆：** 判断适用 → 想起该读哪份文件 → 想起该调哪个 JS → CI/release 还要把 JS 接上。任何一层漏接都可以假绿。系统证据见 RESEARCH-0009；Control identity 缺口见 FINDING-0002 / FINDING-0025。

## 根因

Prompt 是被动承载、一次性全量注入，没有按决策点按需加载的机制。规则总量与注意力稀释成正比。

更底层的机制是：Generation-1 用文档体系承担了本应由控制平面承担的路由和适用性（`Agent memory = dispatcher`）。没有树状检索、没有图状适用关系、机械控制仍依赖 Agent 记住入口，于是只能靠把规则写进更长的静态 prompt 来「提高存在率」。

## 影响

- prompt 型规则越多，单条规则的实际召回率越低。
- 这是「prompt 是 guidance 不是 control」在规模上的累积效应（延伸 FINDING-0003 C03）。
- 无路由的文件拆分不会降低负担，只会把「记规则」变成「找规则」。

## 关闭条件

1. 实验对比：静态全量 AGENTS vs decision-point injection，测量违规率差异（与 FINDING-0008 G04 衔接）。
2. 若 injection 有效，落地最小机制（按文件类型/动作动态加载相关规则片段）。
3. 入口不再承载规则正文；适用性由系统路由而非 Agent 记忆判定；关键保证在 Agent 忘记入口时仍有机械路径（与 ADR-0022 后续修正、Roadmap Phase 5 衔接）。

## 解决情况

（待填。）ADR-0022 已接受指令架构方向；RESEARCH-0009 v3 记录了 Gen1 拓扑与演进证据。机制尚未落地。

## 关联

- GitHub Issue #7
- RESEARCH-0009
- ADR-0022
- FINDING-0002
- FINDING-0025
- FINDING-0026

## 回归保护

本 Finding 的类型是 `mechanism-gap`：当前缺少按决策点加载与路由的机制，Agent 记忆充当 dispatcher。静态全量 vs 按决策点注入的对比实验是关闭条件之一，属于 supporting evidence，不把本条改写成 `research-observation`。测量框架落地后由对比实验提供数据；架构侧关闭依赖路由与机械路径，无独立 gate。
