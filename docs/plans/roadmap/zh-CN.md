# Roadmap

[English](en.md) · [简体中文](zh-CN.md) · [繁體中文](zh-TW.md)

> **只做索引。** Plan 是事实源；顺序由 ADR 裁定。本页只回答「现在在哪 / 下一步是什么」——不是 CHANGELOG，也不是 Plan 全文转载。细节见 `docs/plans/` 与 `docs/plans/archive/`。

## 愿景

做成仓库内生、工具中立、可验证的治理，尽量少依赖 Agent 注意力：机读控制 → 上下文 → 适用性 → 调度 → 证据 → 裁决 → 明确强制边界。

2.x 路径权威：[ADR-0024](../../design-decisions/ADR-0024-gen2-product-freeze.md) · [ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md)。

## 现在

| | |
| --- | --- |
| **产品** | `v2.1.1` — INSTALLED 必装切片；CI 阻断 = `npm run check:must-ship` |
| **Horizon** | H2 **已完成**；下一施工带 = **H3**（远；默认不挡下一 minor） |
| **Active Plan** | **无** |
| **排队 Design** | [PLAN-0054](../PLAN-0054-h3-runtime-research-design.md) — H3 边界 / 运行时与科研（未升 Active） |

残留主题（不等于 Active Plan）：INSTALLED 机械调度（FINDING-0004/0005，须 Narrow ADR）、按需 Finding 补丁、仅在触契约时再 EXTRACT 厚 CLI。

## 近线

| 项 | 角色 | 说明 |
| --- | --- | --- |
| [PLAN-0054](../PLAN-0054-h3-runtime-research-design.md) | Design | H3 成员 / 非成员 / 升 Active 前置。只冻结边界；默认不装 L3。 |
| Finding 补丁 | 按需 | 选定后做小切片——不是常驻清扫。最近闭合：[PLAN-0053](../archive/PLAN-0053-v2.1.x-finding-patch-slice.md)（Archived）。何时需要 Plan：见 [AGENTS.md](../../../AGENTS.md) 原则索引（Horizon vs 日常小改）。 |

SemVer ≠ Horizon。施工规则在 [AGENTS.md](../../../AGENTS.md) / [ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md) / lifecycle § 规模分级——**不**写在本页。

## 已完成（一句）

迁移 Phase 0–8 EXITED → `v2.0.0` 发布 → H0–H2 Archived（[PLAN-0045](../archive/PLAN-0045-post-2.0-doc-truth.md) … [PLAN-0050](../archive/PLAN-0050-h2d-payload-portability.md)）→ `v2.1.0`（[PLAN-0051](../archive/PLAN-0051-v2.1.0-release-acceptance.md)）→ Gen1 观测 sunset / carrier 重裁（[PLAN-0052](../archive/PLAN-0052-gen1-observation-sunset.md)、[PLAN-0055](../archive/PLAN-0055-gen1-carrier-absorb-and-retire.md)）→ FINDING-0003 判断语言分层（[PLAN-0053](../archive/PLAN-0053-v2.1.x-finding-patch-slice.md)）。**Plan archive ≠ Release。** 全文见 `docs/plans/archive/`。

## 远景（H3）

L3 运行时拦截、测量、注意力实验、可选统一 dispatcher —— 科研 / adapter 面，**不是** portable 必装。索引：[PLAN-0054](../PLAN-0054-h3-runtime-research-design.md)。默认不挡下一 patch/minor。

## 维护规则

1. 每次 Plan 生命周期事件（Design → Active → Archived），在**同一变更**更新三语的 **现在 / 近线**。
2. **已完成** 保持一段话；叙事进 Archived Plan / CHANGELOG / Finding。
3. 不在此复述 Plan 步骤、Affected Files 或 Finding 清单。
4. 方向变更须有 Finding / Research / ADR —— 禁止静默改路线图。

```text
Research / Findings → ADR → Roadmap（索引）→ 按 AGENTS + ADR-0025 + lifecycle 计划/实现
```
