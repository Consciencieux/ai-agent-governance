---
id: RESEARCH-0013
status: Active
version: 1
subject_generation: gen2
---

# RESEARCH-0013：科研回溯与上下文经济（执行合同 vs 知识沉淀）

本 RESEARCH 是 **System Model**：在已有知识对象（RESEARCH-0007）与 Context Economy（ADR-0022）之上，描述本仓库如何同时满足两项目标，以及一般被治理项目需要什么。它**不**宣布 MUST（规范后果见 ADR-0022 2026-09-11 修正）；**不**新建知识类型或 token 门禁。

## 双目标（本仓库）

```text
1. 科研导向：项目做好后能回溯较完整的开发经历（Why / 放弃方案 / 约束 / 意外）
2. Token 经济：不把「可回溯」做成每次任务重载全部历史与规则
```

二者冲突点只有一个：把 provenance **写全** 却在每次执行 **读全**。已有隔离已经指向解法——写进类型化对象，执行默认不加载历史（ADR-0022 决策 5–6）。本文件补的是：**事前写什么、事后写什么、一般项目少写什么**。

## 两份讨论里：已有 vs 缺口

### 已体现（不重复立法）

| 主张 | 权威 |
| --- | --- |
| 少通读、少重复推理、同上下文可连续 implement→closure→review | ADR-0022 Context Economy |
| 知识 ≠ always-on；历史后置 | ADR-0022 决策 5–6 |
| 压缩层代替重读归档 Plan | RESEARCH-0006 |
| 对象按职责分离（Research / Finding / ADR / Plan） | RESEARCH-0007 · `docs/README.md` |
| Git / CHANGELOG 记 What，不记根因与方案比较 | lifecycle CHANGELOG 内容边界 · changelog-policy · ADR-0012 |
| 实验记录有独立槽位 | `docs/research/experiments/` |
| 执行中发现可追踪 | Discovery Ledger（lifecycle · ADR-0021） |
| 中大型才写 TASK；规模分级只决定要不要写计划 | lifecycle § 规模分级 |

### 缺口核验（修正后才记录）

| 缺口 | 是否合理 | 本文件处置 |
| --- | --- | --- |
| 文档驱动流水线对 Agent 会重复支付「理解代码/规则」成本 | 合理（说明性）；数字例子不入库 | 原则已在 CE；此处只钉「Artifact = 执行后压缩，不是执行前百科」 |
| 一次理解后的压缩状态类似编译器 IR | **角色合理，新类型不合理** | 由压缩层 / Active Plan / 将来 RoutingResult 承担；**不**新建 Context Snapshot 文件类型 |
| 详细事前操作手册作为科研资产通常差 | 合理 | 采纳 |
| 「详细事前 Plan **系统性劣于**事后 Research Log」 | **过强，拒绝** | 事前短合同（假设+约束+验收）与事后记录互补；无预注册会 HARKing |
| 高智商模型一次做完再自动生成全套 Log | 过早机制 | 不建生成器；人/Agent 按类型写入既有对象 |
| 50 页执行 Plan vs 1–3 页 Brief + 长实验记录 | 对本仓科研目标合理 | 映射到现有类型（下节），不新增「Research Log」类型 |
| 一般工程项目的文档需求 ≠ 本仓 | 合理且此前未写 | § 一般项目 |

## 模型：事前合同 vs 事后沉淀

```text
Research Goal / 任务意图
        ↓
Short Design Brief = TASK Plan（短）
  假设 · 约束 · 非目标 · 影响面 · 验收
        ↓
Implementation（同会话尽量连续；Context Economy）
        ↓
During: Discovery Ledger（预期世界破裂时登记 Reality）
        ↓
After: 按职责写入
  Research / experiments  → 理解、方法、结果
  Finding                 → 已观察问题
  ADR                     → 长期选择与放弃方案
  Archived Plan           → 当时做成了什么（执行证据）
Git / CHANGELOG           → 事实与发布边界上的 What
```

**Plan 记录预期与合同；科研价值多半在 Reality。** Reality 不得只留在聊天里，也不得塞进 CHANGELOG。放弃方案、限制、为什么选这个，权威在 ADR（或 Research 描述、Finding 证据），不在 git message。

禁止：

```text
用 50 页逐步操作手册冒充研究记录
用事后长文替代事前边界（非目标、Gen1 保护、不实现 Dispatcher）
为「完整经历」每次加载全部 Research / 归档 Plan
新建第八类知识对象（Research Log / Context Snapshot / Postmortem 专文件）
```

## 本仓库：回溯完整经历时读什么（on-demand）

回溯一条能力或一次迁移，按链读，不预加载：

```text
Roadmap 当前相位
  → 约束该相位的 ADR
  → 相关 Research（模型）与 Finding（缺口）
  → Archived Plan（当时合同与台账闭包）
  → Git / CHANGELOG（What）
  → experiments（若做过测量）
```

「完整」指 **类型齐全且可链接**，不是单文件小说。Archived Plan 保留预期；Ledger / Finding / ADR 修正 / Research 版本演进保留 Reality。

## 一般项目（被治理产品 / 普通工程）需要什么

本仓是 **实验场 + 参考实现 + 科研记录**。一般项目通常 **不是** 要复现整条治理研究轨迹。Skill 将来抽 portable semantics（PLAN-0037），不得把本仓科研文档树当安装物。

| 需求 | 本仓库（科研导向） | 一般项目（工程执行） |
| --- | --- | --- |
| 事前 | 短 TASK：假设、约束、非目标、验收 | 中大型：执行合同（做什么、改哪、怎么验）；小型可跳过 Plan |
| 执行中 | Ledger + Context Economy 读集 | 同样：少重读；关键保证尽量机械 |
| 事后知识 | Research / ADR / Finding / experiments 必填科研面 | 通常：**ADR 仅当长期决策**；不必 Research 树或实验目录 |
| 用户可见 | Product + CHANGELOG | **主需求**：Product 行为说明 + CHANGELOG |
| 回溯 | 要能重建 Why 与放弃方案 | 通常只需：发布说明 + 关键 ADR + git；不要求「完整研究经历」 |
| Token | 历史 on-demand；禁止入口变百科 | **同样适用**（薄入口、按需加载）——这是 portable 的 |
| 不需要 | — | 强制 experiments/；把每个功能写成 RESEARCH；三语 Roadmap（除非产品需要） |

一般项目的最小开发文档面（与规模分级一致）：

```text
Always:     Git（What）+ 必要测试/证据
Medium+:    短 Plan（合同）+ CHANGELOG（若交付用户可见变化）
When needed: ADR（长期选择）· Finding（系统性缺陷）
Optional:   Research / experiments（仅当项目自己在做可复现研究）
```

Agent 侧无论是否科研项目，都适用：薄入口、按需加载、不把完整经历灌进每次执行上下文。

## 对后续阶段的影响（描述，非施工授权）

- Phase 5 RoutingResult 的 `read_set` 应服务 **当前任务**，不是「为了科研把相关 Research 全部塞进」。
- PLAN-0037 可抽：执行合同 vs 知识沉淀分离、历史 on-demand、CHANGELOG 不承载 Why。**不**抽本仓 Research 编号与实验目录。
- 不授权自动 postmortem 系统或 session 级 IR 文件格式。

## 参考

- ADR-0022（Context Economy · 2026-09-11 修正）· ADR-0012 · ADR-0016 · ADR-0021
- RESEARCH-0006 / 0007 / 0009 / 0012
- PLAN-0037 Extraction boundary（后置）
