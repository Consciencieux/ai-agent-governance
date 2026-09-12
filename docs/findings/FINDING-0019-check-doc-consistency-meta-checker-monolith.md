---
id: FINDING-0019
status: Confirmed
type: architecture-gap
observed_in: gen1
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

（待填。纳入 2.0 重构的 Rule Registry / Dispatcher 范围。）

## 关联

- GitHub Issue #7

## 回归保护

负向测试：新增一个检查时，若它被判定可归入现有 primitive 却仍追加 cluster，由 review 的 L1/L2 分类（FINDING-0014）捕获；registry 落地后由「机制复用率」指标观测。
