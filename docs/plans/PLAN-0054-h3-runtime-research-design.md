---
id: PLAN-0054
status: Design
generation: gen2
target: both
---

# PLAN-0054：H3 运行时与科研（Design only）

**状态：** Design（2026-09-13；人类选「2」。**远景冻结草案**——不升 Active、不挡下一 minor/patch。[ADR-0025](../design-decisions/ADR-0025-gen2x-product-path.md) 决策 6 / 8 / 11：H3 不挡 2.1；SemVer ≠ Horizon）。

**归属：** ADR-0025 H3 —— L3 运行时拦截、测量框架、注意力实验、完整 activity 轨迹；属科研与 runtime adapter，**不**进入 portable core 必装面（ADR-0020 / ADR-0024）。

**问题（已对齐）：** H2 已完成且 `v2.1.0` 已发；需要一份 H3 **边界说明书**，避免把 Confirmed Finding 的 later 项或 Gen1 sunset 误标成 H3 开工。

**不是：** 现在开工 L3；把 hooks 钉成必装；用 H3 清库存 Finding；替代 PLAN-0052/0053。

## 一句话目标

写清 H3 **成员 / 非成员 / 升 Active 前置**，使后续真要开工时不必重争论「H3 是什么」。

## H3 成员（In — 仅当未来 Active）

| 主题 | 线索 | 备注 |
| --- | --- | --- |
| L3 运行时拦截 | FINDING-0007 later（tool-call / hooks 不可绕过） | 需宿主 adapter；非 portable MUST |
| 测量框架 | FINDING-0008（若仍开放） | 科研 |
| 静态 vs 注入 | FINDING-0015 | 实验 |
| 完整 activity 轨迹 | `activity.jsonl` 类 | 非 2.x 默认必装 |
| 统一 Dispatcher | FINDING-0004 / 0005 残留 | 仅当 Narrow ADR 允许进产品面 |

## H3 非成员（Out）

- Gen1 观测门禁 sunset → [PLAN-0052](archive/PLAN-0052-gen1-observation-sunset.md)（Archived）
- Gen1 carrier 重裁 / 测试瘦身 → [PLAN-0055](archive/PLAN-0055-gen1-carrier-absorb-and-retire.md)（已 Archived；优先于 0053 的前置已落地）
- FINDING-0003 规范语言分层等 2.1.x 补丁 → [PLAN-0053](PLAN-0053-v2.1.x-finding-patch-slice.md)
- 已交付的 must-ship / consent / lock / sibling-closure / MIGRATE / portability 矩阵（H2）
- 把 H3 写成 v2.2/v2.3 发布门槛（ADR-0025 决策 11）

## 升 Active 前置（未来）

1. 人类明确批准「开工 H3」+ 本 Plan 升 Active（或拆子 Plan）
2. 选定 **一个** 首切片（禁止一次吃完上表）
3. 写清与 INSTALLED 默认面的边界（默认：adapter opt-in，非必装）
4. 不影响 `check:must-ship` 作为唯一 CI 阻断

## 阶段（Design 正文）

### Stage 0 — 边界冻结 — **本文件交付**

- [x] 成员 / 非成员 / 升 Active 前置
- [ ] 人类确认本 Design 可接受为 H3 索引（不必升 Active）

### Stage 1+ — 仅升 Active 后

- [ ] 首切片 Plan 或本 Plan Stage 展开
- [ ] …

## Discovery Ledger

| ID | 类型 | 问题 | 状态 | 处置 |
| --- | --- | --- | --- | --- |
| R0 | constraint | H3 不挡 2.x tag | open | observe |
| R1 | process | 本带保持 Design，直至人类开工令 | open | observe |
| R2 | scope | 首切片未选 | open | 升 Active 时钉死 |

```text
Total known:  3
Resolved:     0
Open:         3
Unaccounted:  0
```

## 参考

- ADR-0025 决策 6 / 8 / 11 · ADR-0024 later · FINDING-0004 / 0005 / 0007 later
