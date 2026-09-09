---
id: PLAN-0032
status: Active
generation: gen2
target: repo-infra
---

# PLAN-0032：文档知识架构收口

> （进行中。2026-09-09：建立三层定义——RESEARCH-0007（完整知识对象模型/系统描述）、ADR-0016（规范层：路由 / must-not / 当前-历史隔离）、`docs/README.md`（日常路由索引）；完成标准为定性判定，见「完成条件」。）

只修改 `docs/` 知识体系与相关 ADR/Research；不涉及 payload 行为。

## 背景

Phase 2（Research / Findings / Traceability）的第一项工作。`docs/` 已按用途优先分层（ADR-0016），`docs/README.md` 声明自己是知识体系 canonical index，但各类型边界目前主要仍是「描述性」的，缺少足够强的**放置判定规则**，作用偏移长期几乎必然发生。实际证据已有两例：

- ADR-0016 最初把 Finding / Research / ADR 也设计成可物理 archive，后追加修正只允许 Plan 归档（生命周期语义冲突，ADR-0016 § 后续修正）。
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
→ 每类对象（七类）、四字段（Primary question / Authoritative for / Allowed / Forbidden）、
  数据流、生命周期、关系、当前/历史隔离
→ 落点：docs/research/RESEARCH-0007-documentation-knowledge-architecture.md


ADR
→ 固化关键规范决策
→ purpose-first taxonomy、archive-only-for-Plans、Roadmap is projection not fact source、
  内容路由测试、must-not 权威、当前/历史隔离
→ 落点：ADR-0016 § 后续补充、ADR-0015 § 决策 6、ADR-0018 § 决策 6


docs/README.md
→ 作为日常 routing index
→ 给人和 Agent 一个短而明确的「东西放哪里」判定表（路由测试 + 七类主问题/禁止项 + 当前/历史）
```

## 四条规则

1. **R1 内容路由**：按对象的 primary authoritative responsibility 判定归属（六问路由测试）；对象可含 supporting context，只有形成独立长期知识时才拆出并引用（不是「两问同答就必须拆」）。
2. **R2 目录决定知识类型，不决定重要程度；状态决定生命周期；引用决定关系**（关系靠链接不靠复制）。
3. **R3 "must not" 比 "is" 更重要**：每种类型有 Forbidden 列，边界靠禁止项锚定。
4. **R4 当前知识与历史知识隔离**：历史可读作 provenance，不作当前执行指令。

## 完成条件

- **路由确定性**：同一段内容交给两个不同 Agent 分类 → 应大概率得到同一个知识类型。
- **历史隔离**：一个 Agent 读到历史对象（Superseded Research / Resolved·Invalidated Findings / Superseded ADR / Archived Plans）→ 不会把它当当前执行规则。
- **单一归属**：一个新问题出现 → 不会同时被复制进 Research / Finding / ADR / Plan 四份。
- **演进纪律**：一个架构决定变化 → 知道应该 supersede ADR，而不是偷偷修改 Roadmap 或 Plan。

## 受影响文件

- `docs/research/RESEARCH-0007-documentation-knowledge-architecture.md` —— 完整知识对象模型（七类、四字段、路由、当前/历史）
- `docs/research/README.md` —— RESEARCH-0007 登记
- `docs/design-decisions/ADR-0016-doc-structure-purpose-first.md` —— § 后续补充：知识对象模型规范
- `docs/README.md` —— 日常路由索引（路由测试 + 七类判定表 + 当前/历史）
- `docs/findings/FINDING-0020-roadmap-projection-drift.md`、`FINDING-0021-roadmap-checker-vacuous.md` —— 边界失效证据
- `docs/plans/roadmap/{en,zh-CN,zh-TW}.md` —— 阶段清单对齐 ADR-0018（FINDING-0020 解决）

## 验证方法

1. `npm test` exit 0（测试计数作为 completion evidence，不作为验收契约本身）。
2. 路由表、ADR、Research 三者互相可解析（link check）。
3. `docs/README.md` 路由判定表可作为单一判定入口（人 + Agent 均可据此路由）。
4. 完成条件的四条为定性判定，由 review checkpoint 确认，不强行机械门禁化（与 Phase 1 分类人工判断同一性质）。

## Discovery Ledger（closure review workset）

本计划 closure review 发现的 20 个语义/一致性点 + 1 个系统性根因，按 Known-Issue Closure（ADR-0021）登记并逐项结算；**全部 `closed`，Unaccounted = 0**。

| ID | Origin | Problem | Scope | Status | Disposition | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| R1 | review | 八类 vs 七类（Archive Plan 是 Plan 生命周期） | repo | closed | resolved | RESEARCH-0007/ADR-0016/docs README |
| R2 | review | 「两问同答必须拆」太绝对 | repo | closed | resolved | primary-authoritative-responsibility 模型 |
| R3 | review | RESEARCH-0008/0009 规范泄漏（写成 ADR） | repo | closed | resolved | RESEARCH-0008/0009 描述层收敛 |
| R4 | review | Roadmap authoritative for 阶段顺序 | repo | closed | resolved | RESEARCH-0007/ADR-0016/roadmap |
| R5 | review | 非「唯一 Active Plan」（0032+0033 并存） | repo | closed | resolved | phase checkpoint + subordinate 模型 |
| R6 | review | Roadmap 无 Current Phase | repo | closed | resolved | roadmap ×3 Current Phase marker |
| R7 | review | Roadmap「不复述」却复述 | repo | closed | resolved | roadmap 措辞 →「镜像/索引 projection」 |
| R8 | review | ADR-0018 8 阶段≠Phase0-8 + 重复 §6 | repo | closed | resolved | ADR-0018 Phase0-8 措辞 + §7 重排 |
| R9 | review | ADR-0020/PLAN-0031 adapter→Phase8 残留 | repo | closed | resolved | 改为 L3 Runtime Interception 非固定阶段 |
| R10 | review | ADR-0015 旧 phase 未标失效 | repo | closed | resolved | Historical proposal — superseded by ADR-0018 |
| R11 | review | ADR-0016 局部 Phase1-5 冲突 | repo | closed | resolved | 改 D1-D5（局部实施序列，非 Gen2 编号） |
| R12 | review | ADR 修订算法自相矛盾 | repo | closed | resolved | Major replacement vs Narrow amendment 分叉 |
| R13 | review | FINDING-0020 status/type 不符 | repo | closed | resolved | type→defect（systemic→FINDING-0021） |
| R14 | review | PLAN-0033 ledger Status=open 却有 terminal disposition | repo | closed | resolved | Status/Disposition 两轴 + K1-K5 closed |
| R15 | review | PLAN-0033 演示 ≠ 机制实现 | repo | closed | resolved | 措辞改 first-generation prototype |
| R16 | review | ADR-0021 cross-generation vs Migration freeze | repo | closed | resolved | generation→gen2 |
| R17 | review | [Unreleased] 含决策条目 + stale docs/archive/ | repo | closed | resolved | 重写为 2 条 delivered change |
| R18 | review | ADR-0012 新旧权威冲突 | repo | closed | resolved | Decision 3 部分 supersede 标注 |
| R19 | review | AGENTS 塞 CHANGELOG policy 违反 ADR-0022 | repo | closed | resolved | 下沉 repo-workflows/changelog-policy.md，AGENTS 放指针 |
| R20 | review | docs/README 变知识仓库 | repo | closed | resolved | ADR-0022 收窄为 execution-facing 入口 |
| R21 | systemic | 知识对象 authority/supporting-context 模型缺失 | repo | closed | promoted-to-finding | FINDING-0023 |
| R22 | review | RESEARCH-0007/0009 subject_generation 元数据 | repo | closed | resolved | 迁移型 Research 省略 |
| R23 | review | AGENTS 完整瘦身（SKILL/AGENTS 厚入口） | repo | closed | deferred（successor: 待建 AGENTS 瘦身执行任务；revisit: ADR-0022 § 后果） | ADR-0022 § 后果 |
| R24 | review | payload 内嵌 Discovery Ledger（lifecycle.policy TASK 格式） | skill | closed | promoted-to-next-plan（successor: 待建 payload 集成计划；revisit: ADR-0021 § 后果） | ADR-0021 §6 |
| R25 | subtask | 知识对象表示法归一（Representation Normalization）：统一 YAML envelope / sparse / 中文 H1 章节表头 | repo | closed | resolved | ADR-0016 § 后续补充；四类当前对象 |
| R26 | review | canonical 元数据被多份 index/projection 重复 → 持续 drift（ADR-0021 index、README schema 示例等） | repo | closed | promoted-to-finding | FINDING-0024 |

**Metadata consumer enumeration（表示法归一前必须，2026-09-09 更新）：** Plan/ADR 状态原由正文解析（plan-status / plan-delivery / roadmap-sync / ADR-status 簇），但 **Representation authority moves now（ADR-0016）**——canonical 已迁入 frontmatter，正文 Status 已删除；旧 parser 的失败属已知 compatibility divergence，parser migration 属 Phase 4。generation / Finding / Research 元数据无机械 consumer。

## Closure reconciliation（2026-09-09 二次 checkpoint：workset reopened）

```text
Total known:  25
Resolved:     22
Deferred:     1  (R23，successor/revisit 已标)
Promoted to Finding:   2  (R21 → FINDING-0023；R26 projection drift → FINDING-0024)
Promoted to next Plan: 1  (R24，successor/revisit 已标)
Reopened:     R2/R4/R14/R19/R25 —— 二次审查发现仓库存在反例，重新打开
Unaccounted:  先 reconciliation 后判定，不预先写 0
```

**状态：Active（二次 checkpoint）。** 首次 closure 声明被仓库现状反证：R2 旧规则残留于正文、R4 顺序权威表述残留、R14 open+terminal 复发、R19 AGENTS policy 部分下沉、R25 README/schema projection 未收干净。本次已修复这些实例，并新增 FINDING-0024（canonical 元数据被多份投影重复）。完成判据升级为：canonical rule 只有一份；所有 README/index/projection 与 canonical 一致；所有 metadata 值有语义依据；所有已声明 resolved 的问题在仓库中找不到反例。


## 未决风险

- 路由判定本质是分类问题，无法完全机械化；用「主问题唯一」+「Forbidden 锚定」降低歧义，但最终仍有人工/Agent 判断成分。
- 机械 carrier 的修复（如 check-roadmap-sync 对新结构适配）留后续执行层迁移，不在本计划完成范围内。

## 参考

- 知识对象五分类：ADR-0013；用途优先：ADR-0016；Roadmap 定位：ADR-0015；阶段执行：ADR-0018
- 治理模型（ADR/Roadmap/Plan 权威）：ADR-0015 § 决策 6、ADR-0018 § 决策 6、`docs/README.md` § 治理模型
- 边界失效证据：FINDING-0020、FINDING-0021
- 完整系统模型：`docs/research/RESEARCH-0007-documentation-knowledge-architecture.md`
