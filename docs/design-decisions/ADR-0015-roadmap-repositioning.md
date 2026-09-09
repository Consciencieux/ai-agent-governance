---
id: ADR-0015
status: Accepted
generation: gen2
---

# ADR-0015：Roadmap 重新定位


## 背景

当前 `docs/{en,zh-CN,zh-TW}/roadmap.md` 承担了过多职责：它混合了「已完成特性清单（几十条）」「近期/中期/远期未来事项」「已裁定延后的发布安全事项」「维护规则」四类内容。其中已完成部分占据主体，使 roadmap 更像 `CHANGELOG + FEATURE INVENTORY + ROADMAP` 的混合文档，而不是路线图。

随着 `docs/findings/`（FINDING-0001..0019）、`docs/research/`（RESEARCH-0001..0005）、`docs/design-decisions/`（ADR-0001..0014）、`docs/archive/`（PLAN-0001..0030）的建立，知识边界已经清晰，roadmap 的混合内容有了正确的归属。当前 roadmap 的最大问题不是缺内容，而是**定位错误**：

- 它把「过去做了什么」放得太重——已完成部分应迁移到 `docs/research/`（回答「当前系统有哪些能力」）
- 它把「未来为什么改变、要改变成什么」放得太轻——缺少架构演进视角（Generation 1 → Generation 2）
- 它没有 Non-goals——无法约束「治理系统自身无限膨胀」的最大风险
- 它的维护规则（每次发布滚动重排）是为 feature roadmap 设计，不适合长期架构 roadmap

## 决策

**1. roadmap 重新定位为「未来演进路径」，只保留架构演进视角。**

新结构（保留三语）：

```text
# Roadmap

## Vision                    AI Coding Governance Framework

## Current State             Generation 1（document-centric / agent-triggered / script-based）

## Known Limitations         引用 findings（FINDING-0001 / 0002 / ...），不复述

## Target Architecture       Generation 2（Rule Registry → Context Detector → Dispatcher → Mechanism → Evidence）

## Migration Phases          Phase 1 Producer/Product Separation → Phase 2 Governance Core → Phase 3 Policy Model → Phase 4 Dispatcher → Phase 5 Runtime Adapter
                           （**Historical proposal — superseded by ADR-0018 Phase 0–8. Not an operative phase definition.**）

## Research Goals            dynamic policy injection / incremental validation / enforcement coverage

## Non-goals                 不继续新增 policy 解决所有问题；不为每个 incident 建独立 checker；不假设所有 judgment rule 可机械化；不追求所有 Agent runtime 完全一致
```

**2. 已完成能力迁移到 `docs/research/`。**

当前 roadmap 的已完成条目回答「当前系统有哪些能力」，迁移到 `docs/research/RESEARCH-0005-current-capabilities.md`（新 RESEARCH 文档）。它不回答「下一步往哪里发展」。

**3. 内容迁移映射：**

| 当前 roadmap 内容 | 去向 |
| --- | --- |
| 已完成能力列表 | `docs/research/RESEARCH-0005-current-capabilities.md` |
| checker 分类 | `docs/research/RESEARCH-0002-governance-mechanism-taxonomy.md`（已有） |
| 缺陷教训 | `docs/findings/`（已有） |
| 架构选择 | `docs/design-decisions/`（已有） |
| 未来阶段 | roadmap（重构后） |
| 具体实施 | `docs/archive/` / `plans/`（已有） |

**4. 维护规则调整：** roadmap 修订触发条件从「每次发布滚动重排」改为「架构方向变化 / 重大里程碑完成 / 世代转换」——release 是产品事件，architecture direction 是研究/设计事件，周期不同。

**5. roadmap 仍是指向 plans/findings/ADR 的索引，不是事实源**（延续 ADR-0009）。

**6. Roadmap 与 ADR / Plan 的规范权威关系。** 三者冲突时：

```text
Accepted ADR  >  Roadmap  >  Active Plan
```

- **Roadmap MUST NOT override an Accepted ADR。** Roadmap 是 projection/index，不是架构事实源；若二者冲突，修 Roadmap，不反向改 ADR。
- **改变 ADR 已决定的架构方向，必须先新增或修订 ADR，再更新 Roadmap。** Roadmap 不得偷偷改写 Accepted ADR 的既有裁决。
- **阶段顺序的权威来源是裁决它的 ADR**（当前：ADR-0018 定义 Gen2 Phase 0–8），Roadmap 的 Migration Phases 清单必须与之对齐。
- **Active Plan 不得违反其所在阶段的 Accepted ADR 约束**（Plan 是执行合同，不是决策源）。

系统的运作模型（对象组成、数据流、Agent 导航）是描述层，见 `docs/research/RESEARCH-0007-documentation-knowledge-architecture.md`；本条只规定必须遵守的权威关系。

## 后果

- 正面：roadmap 回到「路线图」职责；已完成能力有正确归宿；架构演进视角与 2.0 重构对齐；Non-goals 约束治理膨胀。
- 代价：`repo-tools/check-roadmap-sync.js` 硬编码 `docs/en/roadmap.md` 并解析 `Done / Near-term / Mid-term / Long-term` section——重构后该脚本的路径与 section 语义需要适配（Migration Mode 期间该 gate 为观测性，暂不阻断；适配作为后续实施项）。
- 遗留风险：roadmap 重构与 plan 生命周期同步（implemented → Done）的机械关系暂由脚本语义适配延迟承接。

## 参考

- Roadmap 是索引而非事实源：ADR-0009
- Generation 1 → 2 演进：`docs/research/RESEARCH-0004-architecture-evolution.md`（RESEARCH-0004）
- 知识对象五分类：ADR-0013
- Migration Mode（重构期间旧 gate 观测化）：ADR-0014
