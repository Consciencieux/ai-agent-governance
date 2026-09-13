---
id: FINDING-0019
status: Resolved
type: architecture-gap
observed_in: gen1
resolved_in: gen2
---

# FINDING-0019：check-doc-consistency.js 正在形成巨型元检查器

## 分类

- 严重度：高
- 影响范围：repo
- 研究方向：E. 检查器正确性 / 回归

## 观察

`scripts/check-doc-consistency.js` 承载了越来越多的职责：version sync、protected files、ADR status、links、numeric claims、prompt sync、consent sync、principles index、plan status、CHANGELOG、terminology……它的问题不一定是代码质量差，而是职责逐渐累积。历史模式：某事实漂移 → 给 check-doc-consistency 再加一个 regex/cluster——**incident-driven checker accretion（事故驱动的门禁堆积）**。

## 证据

- Issue #7 §9 枚举其承载的 10+ 类检查，全部累积在一个脚本里。
- 历史事故（v1.0.x）的修复模式：新缺陷 → 新 cluster，脚本随每次发布膨胀。
- 若继续「Issue #5 发现一个问题 → 再加一个 cluster」，项目会继续过度工程。
- 与 FINDING-0014 同构：review-manager 若「发现不足 → 堆功能」会成为第二个 check-doc-consistency.js。

## 根因

没有统一的 rule registry / primitive 层（FINDING-0002 B04），新事故没有现成的通用机制可挂，只能往已有的巨型 checker 上加特定 cluster。缺位的是「通用 primitive + rule registry」，不是「更全的特定事故 checker」。

## 影响

- 单一脚本成为理解与维护瓶颈；改一处影响十几类检查。
- cluster 数量增长与治理强度增长不成比例（每个新 cluster 只堵一个特定洞）。
- 直接违背 engineering restraint 的 machinery test（FINDING-0003）。

## 关闭条件

1. 提取通用 primitive（instance-closure、shared-value、projection-sync、required-file、forbidden-pattern、command-result、regression-oracle、change-requires-change——见 Issue #7 §27），多个 rule 复用同一 mechanism。
2. 新检查优先挂到 registry/primitive，不追加进 check-doc-consistency.js 单文件。
3. 在 ADR-0014 Migration Mode 内完成拆分，不阻塞日常开发。

## 解决情况

**Resolved（2026-09-13 · PLAN-0048 H2b Stage 2）。** 增长轴已切断：`plan-status` / `adr-status` 抽出为 `scripts/lib/plan-status.js` 与 `scripts/lib/adr-status.js`；docs-shape / discovery-ledger / metadata-projection 以独立 `repo-tools/` 检查器落地，不再往 `check-doc-consistency.js` 堆新事故 cluster。`tests/suites/h2b-checkers.test.js` 禁止把 Unreleased 全文扫描重新内联进 consistency 单文件。完整 Rule Registry 仍可由 H2c 承接，不挡本 Finding 关闭。

## 关联

- GitHub Issue #7
- PLAN-0048（H2b）

## 回归保护

`tests/suites/h2b-checkers.test.js`：禁止 re-inlined Unreleased 全文扫描；新检查默认走独立脚本/primitive，不追加进 consistency monolith。
