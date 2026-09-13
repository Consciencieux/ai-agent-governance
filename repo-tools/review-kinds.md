# Review 三类（施工权威 · PLAN-0043 / ADR-0024）

**权威级别：** 施工权威（Phase 7）。非正式 INSTALLED 规范全文。  
**产品边界：** [ADR-0024](../../../design-decisions/ADR-0024-gen2-product-freeze.md) — Implementation = `must-ship`；System / Research = `repo-keep`。  
**动机：** [ADR-0018](../../../design-decisions/ADR-0018-generation-2-dev-path.md) 决策 5 · [FINDING-0014](../../../findings/FINDING-0014-review-manager-layer-mismatch.md)。

## 三类（互斥问题集）

| 类 | Capability id | 问什么 | 产品档 | 权威 |
| --- | --- | --- | --- | --- |
| Implementation Review | `review-implementation` | 这次变更有没有具体缺陷（逻辑 / 安全 / 测试空洞 / 文档矛盾 / 治理工件） | must-ship | `references/templates/sub-skills.md` § review-manager |
| System Review | `review-system` | 架构 / control topology / producer–product 耦合 / 系统性过度工程是否在恶化 | repo-keep | [system-review.md](system-review.md) |
| Research Review | `review-research` | 我们如何理解与评价系统；证据是否支撑主张 | repo-keep | [research-review.md](research-review.md) |

禁止：把 System/Research 的问题塞进 Implementation 五域再贴标签。  
禁止：把 System/Research 打进 INSTALLED 默认子技能（ADR-0024）。

## 触发（路由）

| 用户意图（例） | task_class | 默认 read Capability |
| --- | --- | --- |
| review this / 审核一下 / deep review（变更集缺陷） | `audit` | `review-implementation`（+ 既有 doc-knowledge 等） |
| system review / 架构审查 / control topology review | `system_review` | `review-system` |
| research review / 研究审查 / 评价框架审查 | `research_review` | `review-research` |

**负向不变量：** 默认 `audit` / 普通 `repair` **不得**静默把 `review-system` / `review-research` 全文加入 read_set。

## 默认工作流纪律

```text
Find → 取证 → 分类抽象层级 → 搜同类/系统实例 → 判根因
        → 再决定 remediation（修局部 vs 开 Finding vs 改架构）
```

System / Research：**默认只读至分类完成**（FINDING-0014）。Implementation 可按既有 review-manager 流程；发现疑似 L2+ 问题时 **升级** 到 System/Research，而不是在 Impl 五域里「顺便」做架构裁决。

## Finding Level（最小约定；全量工具化 later）

| 级 | 含义 | 典型去向 |
| --- | --- | --- |
| L0 | 局部缺陷 | Implementation 修复 |
| L1 | 机制缺口 | Finding / Control 补齐 |
| L2 | 控制缺口 | Finding + Control model |
| L3 | 架构缺口 | System Review → ADR/Plan |
| L4 | 研究问题 | Research Review → RESEARCH |

同一 L0 在多子系统重复出现 → 必须向上检查 L1+（FINDING-0014 关闭条件 5）。

## 与 Phase 8 / 2.0

本文件不授权重建 gate。Phase 7 Exit 只证明三类可加载且边界互斥。2.0 发布门槛仍是 ADR-0024。
