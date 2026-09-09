---
id: PLAN-0032
generation: gen2
---

# Documentation Knowledge Architecture Closure（TASK 计划）

> **Status: Active.**（进行中。2026-09-09：建立三层定义——RESEARCH-0007（完整知识对象模型/系统描述）、ADR-0016（规范层：路由 / must-not / 当前-历史隔离）、`docs/README.md`（日常路由索引）；完成标准为定性判定，见「完成条件」。）

**Target: repo-infra** —— 只修改 `docs/` 知识体系与相关 ADR/Research；不涉及 payload 行为。

## 背景

Phase 2（Research / Findings / Traceability）的第一项工作。`docs/` 已按用途优先分层（ADR-0016），`docs/README.md` 声明自己是知识体系 canonical index，但各类型边界目前主要仍是「描述性」的，缺少足够强的**放置判定规则**，作用偏移长期几乎必然发生。实际证据已有两例：

- ADR-0016 最初把 Finding / Research / ADR 也设计成可物理 archive，后追加修正只允许 Plan 归档（生命周期语义冲突，ADDR-0016 § 后续修正）。
- Roadmap 与 ADR-0018 的 phase 顺序漂移（FINDING-0020），且 `check-roadmap-sync.js` 对新目录/结构基本 vacuous（FINDING-0021）。

结论：问题已经不是理论风险。现在最要紧的不是新增知识类型，而是把已有知识类型的**边界、关系、生命周期**收口。

## 目标

任何新知识进入仓库前，人和 Agent 都能稳定判断：

```text
它是什么知识对象？
放哪里？
谁是事实源？
生命周期是什么？
能引用谁？
不能承担什么职责？
```

## 三层定义（本次交付）

```text
RESEARCH
→ 描述整个 Documentation Knowledge Architecture
→ 每类对象（八类）、四字段（Primary question / Authoritative for / Allowed / Forbidden）、
  数据流、生命周期、关系、当前/历史隔离
→ 落点：docs/research/RESEARCH-0007-documentation-knowledge-architecture.md


ADR
→ 固化关键规范决策
→ purpose-first taxonomy、archive-only-for-Plans、Roadmap is projection not fact source、
  内容路由测试、must-not 权威、当前/历史隔离
→ 落点：ADR-0016 § 后续补充、ADR-0015 § 决策 6、ADR-0018 § 决策 6


docs/README.md
→ 作为日常 routing index
→ 给人和 Agent 一个短而明确的「东西放哪里」判定表（路由测试 + 八类主问题/禁止项 + 当前/历史）
```

## 四条规则

1. **R1 内容路由**：六问路由测试；两问同答必须拆开互引。
2. **R2 目录决定知识类型，不决定重要程度；状态决定生命周期；引用决定关系**（关系靠链接不靠复制）。
3. **R3 "must not" 比 "is" 更重要**：每种类型有 Forbidden 列，边界靠禁止项锚定。
4. **R4 当前知识与历史知识隔离**：历史可读作 provenance，不作当前执行指令。

## 完成条件

- **路由确定性**：同一段内容交给两个不同 Agent 分类 → 应大概率得到同一个知识类型。
- **历史隔离**：一个 Agent 读到历史对象（Superseded Research / Resolved·Invalidated Findings / Superseded ADR / Archived Plans）→ 不会把它当当前执行规则。
- **单一归属**：一个新问题出现 → 不会同时被复制进 Research / Finding / ADR / Plan 四份。
- **演进纪律**：一个架构决定变化 → 知道应该 supersede ADR，而不是偷偷修改 Roadmap 或 Plan。

## 受影响文件

- `docs/research/RESEARCH-0007-documentation-knowledge-architecture.md` —— 完整知识对象模型（八类、四字段、路由、当前/历史）
- `docs/research/README.md` —— RESEARCH-0007 登记
- `docs/design-decisions/ADR-0016-doc-structure-purpose-first.md` —— § 后续补充：知识对象模型规范
- `docs/README.md` —— 日常路由索引（路由测试 + 八类判定表 + 当前/历史）
- `docs/findings/FINDING-0020-roadmap-projection-drift.md`、`FINDING-0021-roadmap-checker-vacuous.md` —— 边界失效证据
- `docs/plans/roadmap/{en,zh-CN,zh-TW}.md` —— 阶段清单对齐 ADR-0018（FINDING-0020 解决）

## 验证方法

1. `npm test` 全绿（335/335）。
2. 路由表、ADR、Research 三者互相可解析（link check）。
3. `docs/README.md` 路由判定表可作为单一判定入口（人 + Agent 均可据此路由）。
4. 完成条件的四条为定性判定，由 review checkpoint 确认，不强行机械门禁化（与 Phase 1 分类人工判断同一性质）。

## 未决风险

- 路由判定本质是分类问题，无法完全机械化；用「主问题唯一」+「Forbidden 锚定」降低歧义，但最终仍有人工/Agent 判断成分。
- 机械 carrier 的修复（如 check-roadmap-sync 对新结构适配）留后续执行层迁移，不在本计划完成范围内。

## 参考

- 知识对象五分类：ADR-0013；用途优先：ADR-0016；Roadmap 定位：ADR-0015；阶段执行：ADR-0018
- 治理模型（ADR/Roadmap/Plan 权威）：ADR-0015 § 决策 6、ADR-0018 § 决策 6、`docs/README.md` § 治理模型
- 边界失效证据：FINDING-0020、FINDING-0021
- 完整系统模型：`docs/research/RESEARCH-0007-documentation-knowledge-architecture.md`
