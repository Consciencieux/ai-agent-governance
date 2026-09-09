---
id: FINDING-0021
status: Confirmed
type: control-gap
severity: Medium
affected: [repo]
observed_in: gen1
direction: E
root_cause: R4
related:
  adrs: [ADR-0014, ADR-0015]
  research: [RESEARCH-0007]
---

# FINDING-0021：Roadmap 机械检查失效（check-roadmap-sync.js 对新目录 / 新结构基本 vacuous）

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

（未解决。Migration Mode 下旧 gate 为 observational（ADR-0014），不为此改 Gen1 gate 至绿灯；适配作为后续执行层迁移项。）

## 回归保护

- 描述层：`docs/research/RESEARCH-0007`「机械 carrier」表显式标记本 gate「失效中」。
- 规范层：ADR-0015 § 决策 6 + ADR-0018 § 决策 6 提供投影与执行的权威纪律。
- 待落地：真正修复（更新路径/结构，或由 Repo Profile 承接）——后续执行层迁移任务。
