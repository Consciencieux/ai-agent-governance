---
id: FINDING-0023
status: Resolved
type: architecture-gap
observed_in: gen2
resolved_in: gen2
---

# FINDING-0023：知识对象模型缺失「首要权威职责 + 支持性上下文」区分（primary authoritative responsibility + supporting context）

## 分类

- 严重度：中
- 影响范围：repo
- 研究方向：G. 证据 / 研究方法论

## 观察

知识对象模型初版把「唯一主问题」当成唯一分类维度，并规定「一个内容同时回答两个问题 → 必须拆开」。但 ADR 天然含 Background / Decision / Consequences，Finding 天然含 Observation / Root Cause / Resolution，Plan 天然含 Problem / Solution / Validation——若严格执行「两问同答必须拆」，每个 ADR 的 Background 都要变 Finding、每个 Finding 的 Resolution 都要变 Plan，这不是期望的架构。

缺失的是「**primary authoritative responsibility**（决定对象类型）＋ **supporting context**（可简述）＋ **independent authoritative knowledge**（必须拆出并引用）」这一区分。这导致强制拆分压力与作用漂移（如 RESEARCH 把规范写成 ADR、docs/README 开始变知识仓库）。

## 证据

- RESEARCH-0007 初版 / ADR-0016 § 后续补充初版：硬规则「同时回答两个问题必须拆」。
- 作用漂移实例：RESEARCH-0008/0009 把规范决策写进 Research（RESEARCH-0008 的「不变量」、RESEARCH-0009 复述 ADR-0022 九条）。
- docs/README 从「短路由」膨胀为约 90 行政策内容。

## 根因

R1（Policy Structure）：知识对象模型未充分结构化——缺少「authoritative responsibility vs supporting context」两层概念，用单一维度的硬拆分规则代替。

## 影响

- 强制拆分制造不必要的工作量与跨对象复制。
- 无「supporting context」概念时，对象被迫把 supporting 内容拆到错误类型 → 作用漂移。

## 关闭条件

1. 模型区分 primary authoritative responsibility / supporting context / independent authoritative knowledge。
2. 路由按 primary responsibility 判定；supporting content 不触发拆分。

## 解决情况

（Resolved，2026-09-09。）RESEARCH-0007 与 ADR-0016 § 后续补充改为：**七类知识对象 + 每个对象一个 primary authoritative responsibility（决定类型）；允许必要 supporting context；只有形成独立长期知识才拆出并引用**。同时清理 RESEARCH-0008/0009 的规范泄漏（规范归 ADR-0021/0022）。

## 关联

- PLAN-0032
- ADR-0016
- RESEARCH-0007
- FINDING-0027

## 回归保护

- 描述层：`docs/research/RESEARCH-0007-documentation-knowledge-architecture.md` § 七类知识对象 / primary responsibility。
- 规范层：ADR-0016 § 后续补充 §1（内容路由测试按 primary responsibility）；2026-09-10 修正把 supporting 收紧为权威矩阵（FINDING-0027）。
