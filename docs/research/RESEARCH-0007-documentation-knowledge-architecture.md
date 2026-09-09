---
id: RESEARCH-0007
title: 文档知识架构 / 知识对象模型（Documentation Knowledge Architecture / Knowledge Object Model）
status: Active
version: 2
created: 2026-09-09
updated: 2026-09-09
supersedes: []
superseded_by: []
subject_generation: gen1
---

# 文档知识架构 / 知识对象模型（Documentation Knowledge Architecture / Knowledge Object Model）

本 RESEARCH 是 **System Model**：完整描述 `docs/` 作为一套**知识对象模型**如何运作——八类知识对象各是什么、每个对象的唯一主问题与「必须承担 / 禁止承担」、内容如何路由、当前知识与历史知识如何隔离、对象之间如何通过链接关联。它回答「这个知识系统现在是怎么工作的」。

它是**描述层**；「必须遵守的规范决策」是**规范层**，归各域 ADR（ADR-0016 目的优先分类、ADR-0015 Roadmap 权威、ADR-0018 阶段执行、ADR-0019 归档/代际）。它也是**中立系统描述**；已观察到的失效由 `docs/findings/` 记录（FINDING-0020 / 0021）。

## 八类知识对象

| 类型 | 位置 | 唯一主问题 | Authoritative for | 可以包含 | 不应该承担 |
| --- | --- | --- | --- | --- | --- |
| **Product** | `docs/product/{en,zh-CN,zh-TW}/` | 用户现在应该知道什么？ | 当前产品行为与使用方法 | 当前产品行为、使用方法、用户可见事实 | 内部研究、计划、历史决策 |
| **Research** | `docs/research/` | 这个系统现在是什么、怎么工作、如何理解？ | 系统模型、机制分类、评价框架 | 模型、机制、分类、测量、实验 | 宣布必须采用某方案（那是 ADR 的职责） |
| **Finding** | `docs/findings/` | 实际发现了什么问题？ | 观察到的缺陷、失败模式、治理缺口 | 观察、证据、根因、影响、关闭条件 | 详细施工方案（那是 Plan 的职责） |
| **ADR** | `docs/design-decisions/` | 我们接受了什么长期决策，为什么？ | 已接受的架构约束 | decision、rationale、alternatives、consequences | 任务状态、implementation checklist、bug inventory、roadmap scheduling |
| **Roadmap** | `docs/plans/roadmap/` | 项目未来往哪里走、当前在哪个阶段？ | 长期方向与阶段顺序（索引） | milestones、phases、outcomes、当前阶段 | 详细设计、完整历史、事实复制 |
| **Plan** | `docs/plans/` | 当前这项工作怎么做、怎么验收？ | 当前任务的执行合同 | scope、steps、risks、validation、completion criteria | 重新定义长期架构（那是 ADR 的职责） |
| **Archive Plan** | `docs/plans/archive/` | 这项工作当时最终做成了什么？ | 历史执行证据 | 最终执行证据、历史 | 当前执行规则 |
| **Glossary** | `docs/glossary.md` | 术语到底叫什么？ | canonical terminology | 术语定义（三语对照） | 业务规则和架构决策 |

**每个对象的主问题是唯一分类维度**：一个内容如果同时回答两个问题，就**拆开并互相引用**，而不是选一个目录硬塞进去。

## 内容路由测试（routing test）

```text
这是在描述系统？            → Research
这是在记录已经观察到的问题？  → Finding
这是在做长期选择？          → ADR
这是在安排长期未来？        → Roadmap
这是在安排当前施工？        → Plan
这是给产品用户看的当前事实？ → Product
```

一个内容同时回答两个问题 → 拆开成多个知识对象，互相引用。

示例（"修 bug 时问题会被忘掉"）：

```text
Research → 描述当前 repair workflow / issue-set expansion 模型
Finding  → 「已发现问题没有 persistent closure mechanism」
ADR      → 若决定采用 Known-Issue Closure，记录该决定
Plan     → 实际实现 ledger / workset
Product  → 若成为分发 Skill 的用户可见能力，再写使用说明
```

## 四条规则

**R1 · 内容路由。** 用上面的 routing test 判定归属；两问同答必须拆开互引。

**R2 · 目录决定知识类型，不决定重要程度；状态决定生命周期，引用决定关系。**

- 不要因为一个 Finding 很重要就写进 ADR；不要因为 Research 影响未来就写进 Roadmap；不要因为 Plan 已完成就把内容复制进 Research。
- 关系靠**链接**，不靠复制：

```text
Research → informs → Finding → motivates → ADR → constrains → Roadmap → sequences → Plan → implements → Code / Tests
```

**R3 · "must not" 比 "is" 更重要。** 每种类型都有 `不应该承担` 列；边界靠禁止项锚定，不靠描述。长期最容易漂移的五个位置：Research 写 recommendation、Finding 写 solution、ADR 带 implementation checklist、Roadmap 保存 completed feature inventory、Plan 顺便改 architecture decision——全部禁止。

**R4 · 当前知识与历史知识隔离。**

```text
Current truth:
  Product / Active Research / Active Findings / Accepted ADR / Current Roadmap / Active Plan

Historical evidence:
  Superseded Research / Resolved / Invalidated Findings / Superseded ADR / Archived Plans / Git / CHANGELOG
```

历史记录可被读来理解 provenance，**不能直接成为当前执行指令**（与 Archived Plan 政策一致：Archive ≠ 当前能力 ≠ 当前规则）。

## 数据流与生命周期

```text
Research / Finding
        ↓
      ADR          → 决定约束
        ↓
    Roadmap        → 排阶段顺序
        ↓
      Plan         → 当前执行任务
        ↓
 Implementation → Verification → Plan Completed → Plan Archive（历史）
        ↓
 Roadmap 更新里程碑状态
```

生命周期：Plan `Active → Completed → Archive`；Finding / Research / ADR `状态就地变化，不移动`；Roadmap `持续修订，不归档`；Product `随产品演进`；Glossary `持续维护`。代际用元数据（ADR-0019），不建目录层级。

## Agent 如何导航

```text
1. 读取 Roadmap            → 确认 current phase
2. 读取约束该 phase 的 Accepted ADR → 确认不能违反的边界
3. 找到当前唯一 Active Plan → 确认当前具体执行范围
4. 执行 Plan               → 修改真实仓库 + 验证
5. 达到 completion criteria → Completed / archive
6. 再进入下一 phase
```

## 机械 carrier

| 关系 | 机械 carrier | 状态 |
| --- | --- | --- |
| Roadmap 索引 ↔ Plan 生命周期 | `repo-tools/check-roadmap-sync.js` | 失效中（旧路径/旧 section）→ FINDING-0021 |
| Plan status 规范 | `scripts/check-doc-consistency.js` plan-status 集群 | Gen1 divergence（观测项） |
| Plan 交付声明 | `repo-tools/check-plan-delivery.js` | 有效 |
| ADR 状态 | `scripts/check-doc-consistency.js` ADR-status 集群 | 有效 |
| 术语权威（glossary） | `repo-tools/check-terminology.js`（repo-owned） | 有效（ADR-0020 首次执行分离） |

## 维护规则

- 本模型是活文档：随知识体系演化更新对象、字段与机械 carrier。
- 只描述系统（新增规范进 ADR，新增失效进 Finding）。
- 完成标准（Phase 2 · Documentation Knowledge Architecture Closure，PLAN-0032）：
  - 同一段内容交给两个不同 Agent 分类 → 大概率得到同一知识类型；
  - 读到历史对象 → 不会当当前执行规则；
  - 新问题 → 不会同时复制进 Research / Finding / ADR / Plan 四份；
  - 架构决定变化 → 知道 supersede ADR，而不是偷偷改 Roadmap / Plan。
