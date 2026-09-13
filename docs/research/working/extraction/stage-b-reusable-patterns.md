---
id: extraction-stage-b
status: Draft
plan: PLAN-0037
stage: B
generation: gen2
authority: construction
date: 2026-09-13
depends_on: extraction-stage-a
---

# Stage B：Reusable Patterns（L2）稳定稿

> **施工权威（repo-only）。** [PLAN-0037](../../../plans/PLAN-0037-governance-skill-extraction.md) Stage B：在 Stage A 候选上**稳定 L2 叙述**、删并重复、裁定开放项、标出仍需证据/延后的项。  
> **不是** Plan、不是 INSTALLED skill、不是 Control Registry。  
> 输入：[`stage-a-portable-patterns.md`](stage-a-portable-patterns.md)。L1 集合按人类「执行任务」推进为 **provisional freeze**（可在 Stage D 回退，不在本 Stage 改写入口/脚本）。

## 1. 相对 Stage A 的变更摘要

| 项 | 处置 |
| --- | --- |
| L1-01…12 | **provisional freeze** — 不增不删；Stage D 验证可回退 |
| O1 must-ship 行项目 | **不升 L1**；具体清单 = L3；「可安装面须可执行」原则已由 L1-11 覆盖 |
| O2 Git consent | **协议义务**可进产品剖面（L2-07 / L3-08）；**机械 evaluator** = later（非 L1、非本 Stage 实现） |
| O3 语言 ownership | **新增 L2-11**（推荐模式）；不升 L1（缺跨项目失败证据强度，留 Stage D 观察） |
| L2-01…10 | 合并叙述重复；每条补「何时用 / 何时不用 / 反模式」 |
| L2-06 vs L2-07 | 保留正交：载体演进（checker disposition）≠ 产品处置（must-ship/…） |

## 2. L1 Provisional Freeze（只读回指）

权威陈述仍在 Stage A §4.1。本 Stage **不修改** L1 条文。调用方应视其为：

```text
L1-01 单一权威
L1-02 入口不承载知识库
L1-03 关键保证不依赖记忆
L1-04 发现不可无 disposition 消失
L1-05 机械控制须有证据形状
L1-06 能力须显式路由
L1-07 文档类型单一职责
L1-08 历史非默认执行上下文
L1-09 元数据封闭
L1-10 验证分层（表征 ≠ 保护）
L1-11 产品边界（实验场 ≠ 默认安装面）
L1-12 未匹配失败可见
```

## 3. L2 Patterns（稳定叙述）

每条格式：**意图 · 做法 · 何时不用 · 反模式 · 溯源 · 支撑的 L1**。

### L2-01 知识对象分型（Research / Finding / ADR / Plan）

| | |
| --- | --- |
| **意图** | 用对象用途隔离「证据 / 问题 / 决策 / 施工」，避免单文件身兼数职 |
| **做法** | 四类（或等价分型）各有单一职责；执行只信 canonical 决策与 Active 计划；索引文档（roadmap）不裁决状态 |
| **何时不用** | 极小个人仓可合并存储，但仍须能回答「这句话是事实、问题、决策还是待办」 |
| **反模式** | ADR 里写未验证长研究；Plan 里改写已 Accepted 决策正文；Finding 当 bug tracker 无限开票 |
| **溯源** | F01 F15 · ADR-0016 |
| **支撑** | L1-01 L1-07 L1-08 |

### L2-02 Task → Capability → Authority → Execution → Verification

| | |
| --- | --- |
| **意图** | 任务先映射可加载关注面，再读权威、再执行、再验证 |
| **做法** | 显式 applicability；输出 read_set / run_set / defer_set / unmatched；Capability 可 bind 0..n Control |
| **何时不用** | 单文件玩具项目可手工列「本次只读这三页」——仍须显式，禁止默契全库 |
| **反模式** | 无路由拆文件；Capability 1:1 改名为 Control；未匹配时静默加载全树 |
| **溯源** | F03 F14 · RESEARCH-0012 |
| **支撑** | L1-06 L1-12 |

### L2-03 Progressive disclosure / Context Economy

| | |
| --- | --- |
| **意图** | 最小化完成授权目标所需的预期上下文，同时保留正确性与证据 |
| **做法** | always-on 薄入口 → 按任务加载执行面 → 参考/历史按需；读集有预算，溢出进 defer |
| **何时不用** | Safety-critical 二次意见或上下文已污染时，允许扩大读取（仍记录原因） |
| **反模式** | 入口变百科；每次任务重读全部 ADR；为省 token 跳过必要权威 |
| **溯源** | F02 F13 · ADR-0022 |
| **支撑** | L1-02 L1-08 L1-12 |

### L2-04 Capability-based organization

| | |
| --- | --- |
| **意图** | 按「执行关注面」挂权威，而不是按历史目录骨架生长政策 |
| **做法** | 每个 Capability 有明确 Authority leaf；横切能力用 applicability 挂多节点，不塞进单一 lifecycle 章节 |
| **何时不用** | 引导型文档树仍可存在，但不得充当唯一 dispatcher |
| **反模式** | 按 Gen1 文件夹「细切」冒充能力模型；lifecycle 文件当政策仓库无限追加 |
| **溯源** | F03 F14 · ADR-0022 / RESEARCH-0012 |
| **支撑** | L1-06 |

### L2-05 Discovery Ledger

| | |
| --- | --- |
| **意图** | 修复/施工中的发现不因注意力转移而消失 |
| **做法** | 持久 workset；Status × Disposition 两轴；完成 ⇒ Unaccounted=0；非 resolved 须后继或 revisit |
| **何时不用** | 一次性问答无 in-scope 发现可省略；一旦登记则不得静默删除 |
| **反模式** | 只靠对话记忆；deferred 无后继；每个小发现都新建 Plan/Finding |
| **溯源** | F05 · ADR-0021 |
| **支撑** | L1-04 |

### L2-06 Strangler：载体 WRAP + 语义 EXTRACT

| | |
| --- | --- |
| **意图** | 演进实现时不破坏已安装入口；语义迁入 evaluator 后再薄化 CLI |
| **做法** | 旧路径保留为 WRAP；新语义进独立评价机制；删除仅在替代→验证→观察之后 |
| **何时不用** | 绿场项目可直接新形状，仍须 L1-05 证据形状 |
| **反模式** | H1 清脚本；整夹隔离仍进包；无台账的「先删后补」 |
| **溯源** | F09 · PLAN-0035/0041 · ADR-0025 |
| **支撑** | L1-05 L1-11 |

### L2-07 产品处置词汇（must-ship / repo-keep / later / retire / out）

| | |
| --- | --- |
| **意图** | 回答「发什么产品」与「本仓还留什么」，避免把文件存在当成可发布 |
| **做法** | 能力恰好一档；must-ship 须在干净目标可执行；retire/out 不得回潮 |
| **何时不用** | 不治理「发布切片」的内部工具仓可只用 repo-keep/later |
| **反模式** | 指出 WRAP 文件 = 已发布；later 清单当施工顺序；与 L2-06 的 KEEP/WRAP/EXTRACT 混用同一词 |
| **溯源** | F08 F10 · ADR-0024 |
| **支撑** | L1-11 |

### L2-08 产品演进路径 ≠ 一次性迁移剧本

| | |
| --- | --- |
| **意图** | 迁移 Phase 关闭后，用产品 Horizon/SemVer 演进，不重开 Phase N |
| **做法** | 顺序权威单一（本仓 = ADR-0025 Horizon）；Roadmap 只索引；提炼阶段不迁载体 |
| **何时不用** | 绿场无迁移历史则可直接 SemVer；仍禁止用版本号冒充未写明的阶段表 |
| **反模式** | Phase 9；把 H1/H2/H3 写成 v2.1/v2.2/v2.3 门禁；路线图裁决顺序 |
| **溯源** | F10 F15 · ADR-0025 · ADR-0015 |
| **支撑** | L1-01 |

### L2-09 Control 分层：semantics ≠ evaluator ≠ gate ≠ test

| | |
| --- | --- |
| **意图** | 义务、检查机制、门禁编排、测试各一层，避免正则/脚本成第二语义家 |
| **做法** | Control 有稳定 identity + semantics_ref + evaluation_binding；guarantee 由 profile×boundary **派生** |
| **何时不用** | 纯 guidance 可 `evaluator: none`，但不得标 critical（见 L1-03） |
| **反模式** | 测试复制义务原文；gate 字段写进 Control 单值 decision；无 binding 的 CTRL 编号狂欢 |
| **溯源** | F04 F12 · ADR-0023 |
| **支撑** | L1-03 L1-05 |

### L2-10 种子 oracle + 路由完整性表征

| | |
| --- | --- |
| **意图** | 对 important 义务维持可独立翻红的正/负判定；路由图防静默全表 |
| **做法** | important → oracle_pair 或显式 gap/deferred；路由表征覆盖命中/未命中/orphan |
| **何时不用** | 全量矩阵可 later；种子集不可空口「以后再补」却勾完成 |
| **反模式** | N/N passed = 受保护；负向夹具抄 checker 正则 |
| **溯源** | F06 · PLAN-0042 · oracle-inventory |
| **支撑** | L1-10 L1-12 |

### L2-11 语言 ownership（canonical vs projection）— *本 Stage 新增*

| | |
| --- | --- |
| **意图** | 执行对象单一 canonical 语言；面向人的边界对象可多语投影且 projection ≠ authority |
| **做法** | 先定哪类对象是 canonical；译文滞后不得改写源语义；门禁可分「源新鲜」与「译文新鲜」 |
| **何时不用** | 单语项目可省略投影层，仍须有 canonical |
| **反模式** | 三语正文三份权威；靠入口堆叠双语全文当 SSOT |
| **溯源** | ADR-0020 语言边界示例 · 本仓产品三语/知识单语实践 |
| **支撑** | L1-01（弱）；**不升 L1** 直至 Stage D 有跨项目失败证据 |
| **证据状态** | `needs-broader-evidence` |

## 4. L2 ↔ L1 覆盖矩阵

| L1 | 主要 L2 |
| --- | --- |
| L1-01 | L2-01 L2-08 L2-11 |
| L1-02 | L2-03 |
| L1-03 | L2-09 |
| L1-04 | L2-05 |
| L1-05 | L2-06 L2-09 |
| L1-06 | L2-02 L2-04 |
| L1-07 | L2-01 |
| L1-08 | L2-01 L2-03 |
| L1-09 | （原则面；落地形状 → Stage C metadata-policy） |
| L1-10 | L2-10 |
| L1-11 | L2-06 L2-07 |
| L1-12 | L2-02 L2-03 L2-10 |

无 L2 支撑的 L1：**无**（L1-09 的「模式」是封闭 schema 本身，Stage C 落文件）。

## 5. 明确延后 / 非本 Stage

| 项 | 归属 |
| --- | --- |
| 本仓 `SKILL.md` / `AGENTS.md` 瘦身 | 非 PLAN-0037 完成条件；Stage C 只定义**产物**薄入口 |
| 脚本 retire / 整夹清理 | ADR-0025 H2；今日 retire=∅ |
| 完整 Control Registry / CTRL 编号 portable 化 | H2c；L3-03 |
| 安装面 Task router | H2d；须 Stage C–D 后 |
| 全量 oracle 矩阵 | later；L2-10 种子即可 |
| Git consent 机械 evaluator | later / H2d |

## 6. Stage C 输入合同（预告，不在本文件展开目录）

Stage C 写 skill **形状**时，每个 references 文件内部三节对齐：

| 节 | 取自 |
| --- | --- |
| Hard Rules | L1-01…12（provisional） |
| Recommended Patterns | L2-01…11 |
| Project Customization | Stage A §4.3 L3-01…10 |

建议文件映射（可在 Stage C 改名，不得变成复制本仓 `docs/`）：

```text
instruction-architecture.md  ← L1-02,03,12 + L2-02,03,04
document-model.md            ← L1-07,08 + L2-01,11
metadata-policy.md           ← L1-09
capability-model.md          ← L1-06,14 + L2-02,04,09
decision-records.md          ← L1-01 + L2-01
discovery-and-verification.md← L1-04,10 + L2-05,10
migration-method.md          ← L1-11 + L2-06,07,08
```

## 7. 审查清单

- [x] L2 均有意图/做法/反模式，非口号
- [x] L2 不把本仓路径/CTRL/Phase 写成强制
- [x] O1/O2/O3 有书面裁定
- [x] L1↔L2 覆盖无空洞
- [x] 未改 INSTALLED 入口、未迁脚本、未建 Control Registry
- [ ] **人类确认：** provisional L1 freeze + L2-01…11 可进 Stage C

## 参考

- [`stage-a-portable-patterns.md`](stage-a-portable-patterns.md)
- PLAN-0037 · ADR-0020…0025 · RESEARCH-0012
