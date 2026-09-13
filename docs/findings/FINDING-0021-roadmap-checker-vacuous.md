---
id: FINDING-0021
status: Resolved
type: control-gap
observed_in: gen2
resolved_in: gen2
---

# FINDING-0021：路线图机械检查失效（check-roadmap-sync.js 对新目录 / 新结构基本 vacuous）

## 分类

- 严重度：中
- 影响范围：repo
- 研究方向：E. 检查器正确性 / 回归

## 观察

`repo-tools/check-roadmap-sync.js` 仍硬编码旧路径与旧结构：

```text
ROADMAP = docs/en/roadmap.md
PLAN_DIRS = ["docs/en/plans"]
sections = Done / Near-term / Mid-term / Long-term
```

docs 迁移后 Roadmap 位于 `docs/plans/roadmap/{en,zh-CN,zh-TW}.md`（ADR-0016），结构已改为架构演进视图（Vision / Current State / Target Architecture / Migration Phases / …，ADR-0015），不再有 `Done / Near-term / Mid-term / Long-term`。因此该 gate 对当前 Roadmap 基本不构成机械保证：它读不到真实的 Roadmap（旧路径不存在），对新结构也无法解析。FINDING-0020 的漂移未被它发现即为此失效的实例。

## 证据

- `repo-tools/check-roadmap-sync.js` 第 31–33 行：`ROADMAP = docs/en/roadmap.md`、`PLAN_DIRS = ["docs/en/plans"]`、`ARCHIVE_DIR = docs/archive`。
- `docs/product/en/architecture.md` 当前布局：Roadmap 在 `docs/plans/roadmap/`；`docs/en/` 已不存在。
- ADR-0015 § 后果 已记载该适配为「Migration Mode 期间该 gate 为观测性，暂不阻断；适配作为后续实施项」。

## 根因

R4（Enforcement Boundary）：gate 的扫描路径 / section 语义与对象实际位置 / 结构脱节——机制仍在但覆盖边界陈旧，对新目标 vacuous（E01 vacuous pass 模式）。

## 影响

- Roadmap 的「索引 ↔ Plan 生命周期」「阶段清单 ↔ 裁决 ADR」关系失去机械保护。
- 依赖人工纪律（ADR-0015 § 决策 6）防止投影漂移；无 gate 兜底。

## 关闭条件

1. `check-roadmap-sync.js` 扫描 `docs/plans/roadmap/{en,zh-CN,zh-TW}.md` 并理解新结构。
2. 或：该机械职责由 Gen2 control plane（Repo Profile 路由）承接，旧 gate 退役。

## 解决情况

**Resolved（2026-09-13 · PLAN-0048 H2b Stage 1）。** `repo-tools/check-roadmap-sync.js` 已按 Gen2 现树重写：扫描 `docs/plans/roadmap/{en,zh-CN,zh-TW}.md`，对齐 plan 生命周期索引语义；不再读 `docs/en/roadmap.md` / 旧 Done·Near-term 分段。vacuous pass 关闭。

## 关联

- ADR-0014
- ADR-0015
- RESEARCH-0007
- PLAN-0048（H2b）

## 回归保护

- 关闭时机械层：`repo-tools/check-roadmap-sync.js --gate`（曾挂入 `npm run check` / `check:docs`）。
- **PLAN-0055：** 该脚本已删除；**当前**不以它作为日常/`npm run check` 回归保护。Resolved 状态保留（关闭当时条件已满足）；若要恢复机械保护须另开 Plan，不得在正文假装脚本仍在。
- 表征：`tests/suites/h2b-checkers.test.js`（若随 PLAN-0055 一并删除，则以当时归档证据为准）。
