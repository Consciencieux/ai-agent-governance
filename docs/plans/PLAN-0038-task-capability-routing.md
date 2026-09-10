---
id: PLAN-0038
status: Design
generation: gen2
target: both
---

# PLAN-0038：Phase 5 Task→Capability 适用路由（显式映射）

> **Status: design plan, not implemented**（Phase 5 施工车辆。依赖 RESEARCH-0012 v2 工作假设审查通过后才可 Active。**不**实现 Dispatcher；**不**搬文档物理拓扑；**不** Active PLAN-0037。）

把 RESEARCH-0012 的 Task / Capability / Applicability / Routing 工作假设落成 **人工可维护的显式映射 + 表征验证**，使薄入口能消费稳定 read-set，并为 PLAN-0037 提供可验证的 portable 边界输入。

## 目标

```text
RESEARCH-0012 工作假设
        ↓ 审查
种子 task_class + capability 清单
        ↓
显式 Task×Context → Capability 映射表
        ↓
表征：已知任务 → 稳定 read-set / run-set
        ↓
（可选）Narrow ADR：routing 权威表示
        ↓
再谈 Dispatcher / 物理拓扑 / PLAN-0037
```

**一句话：** 先做出可审查的适用路由表，再谈自动调度与 skill 提炼。

## 范围（In）

- 种子 `task_class` 枚举与归类约定（最小集）
- 种子 capability 清单（Authority 指针；可选 binds_controls）
- 显式 applicability 映射（陈述式；人工维护）
- RoutingResult 形状的文档化（与 RESEARCH-0012 Q6 对齐；可先 Markdown/YAML 表，不强制新 runtime）
- 表征测试或固定夹具：≥N 个典型任务的期望 read-set（N 由 Active 时定，建议 ≥5）
- roadmap / RESEARCH-0012 同步

## 非目标（Out）

```text
runtime Context Detector / Dispatcher / LLM 自动路由
references/ 或 docs/ 大规模搬家
把所有规则 Control 化
PLAN-0037 extraction / 发布通用 skill
完整 Phase 6 oracle 体系
知识图谱 / 句级 ontology
```

## 前置条件

1. RESEARCH-0012 v2 六问工作假设经用户审查（或标注修订）— **Active 前必须**
2. Phase 4 EXITED — 已满足
3. 不阻塞于 consistency cluster 残留 / #9 SKIP

## 提议交付阶段（Active 后）

### P0 — 冻结词汇

- 采纳或修订 RESEARCH-0012 对 Task / Capability / Applicability / 多命中 / Control 关系 / RoutingResult 的假设
- 若假设升格为规范 → Narrow ADR（可与 P2 合并）；否则保持 RESEARCH + 本计划表为施工权威

### P1 — 种子清单

- `task_class` 最小枚举（从真实本仓工作：改 docs、改 references、改 scripts、git 写、release、audit、开 Research/Finding/ADR/Plan…）
- capability 种子：从 RESEARCH-0006 / RESEARCH-0009 / policies / sub-skills **对账**，每条：id · authority_ref · triggers · 可选 controls
- Unaccounted 能力簇必须 deferred（revisit）或显式 retire，不得静默丢失

### P2 — 显式映射 + 表征

- 维护 Task×Context → Capability set 表（高价值关系 only）
- 固定场景夹具：输入 task_class(+context) → 期望 read_set / run_set
- 失败模式登记：unmatched、过宽命中、复制型 capability（整份 lifecycle）

### P3 — 入口消费（可选窄切片）

- 仅当 P2 绿：在 AGENTS/SKILL **指针**层说明「按映射加载」，**不**把表正文塞进入口
- 禁止借机重写 lifecycle 单体

## 完成条件（exit）

- [ ] P0 假设已审查（采纳/修订记录在本计划或 RESEARCH）
- [ ] 种子 task_class + capability 清单存在且对账 Unaccounted=0 或 deferred 有 revisit
- [ ] 显式映射表可人工维护；表征夹具通过
- [ ] 无 Dispatcher；无大规模拓扑搬家；未 Active PLAN-0037
- [ ] Ledger：Open=0；Unaccounted=0

## Domain sync（Target: both）

| Domain | 同步点 |
| --- | --- |
| repo-infra | RESEARCH-0012、roadmap、本计划、表征测试位置 |
| payload | 若写入 INSTALLED 指针/表：reference-closure；否则保持 repo-only 映射直至 Narrow ADR 授权 |

## 受影响文件

（Design；交付门禁跳过。Active 时冻结。）

- RESEARCH-0012
- roadmap ×3
- 映射表落点（Active 时定：优先 repo-only 直至验证）
- 可选 Narrow ADR
- 表征 tests
- CHANGELOG（行为落地时）

## 发现台账（Discovery Ledger）

| 标识（ID） | 类型 | 来源 | 问题 | 影响面 | 严重度 | 状态 | 处置 | 责任人 | 验证/证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R0 | observation | research | 无显式 Task→Capability 映射 | both | high | open | — | — | 本计划 P2 |
| R1 | observation | review | Capability 过粗/过细会污染 PLAN-0037 | skill | high | open | — | — | P0–P1 审查 |
| R2 | observation | design | Dispatcher 易被提前实现 | both | med | closed | deferred | — | revisit: 本计划 exit 后；Out of scope |

## 闭包对账（Design 基线）

```text
Total known:  3
Resolved:     0
Deferred:     1  (R2)
Open:         2  (R0, R1)
Unaccounted:  0
```

## 参考

- RESEARCH-0012 v2 · ADR-0018 Phase 5 · ADR-0022 · ADR-0023
- RESEARCH-0006 / 0009 · PLAN-0035 / 0036 · PLAN-0037（后置）
