---
id: PLAN-0048
status: Archived
generation: gen2
target: both
---

# PLAN-0048：H2b 检查器与台账（consistency 按 cluster 抽出 · 门禁真覆盖 · 台账 L2）

> **勿当今日 carrier 地图：** 本计划抽出的 consistency `adr-status` 簇与 `scripts/lib/adr-status.js` 已于 FINDING-0035 退役。FINDING-0011 误报修复结论仍成立；勿把已删 lib 当活门禁。

**状态：** Archived（2026-09-13 exit review）。Stage 0–4 完成；B0–B9 全关。Plan archive ≠ Release。

**归属：** [ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md) **H2b**（决策 5 + 决策 14：H2-0 → PLAN-0046 → H2a → **b**→c→d）。前置 H2a [PLAN-0047](PLAN-0047-h2a-residue-extraction.md) 已 Archived。下一步 = **H2c**（尚无 Active Plan；待 Design）。

**问题（已对齐）：** `check-doc-consistency.js` 仍按事故堆 cluster（FINDING-0019）；若干门禁对现树 vacuous 或误报（FINDING-0011 / 0021）；Discovery Ledger 缺任务级宽度控制（FINDING-0022）；元数据投影漂移（FINDING-0024）；docs 形状 allowlist 未 fail-closed（FINDING-0030 §5）；Gen1 plan-status 解析与 frontmatter `Active`/`Archived` 分歧未收（ADR-0016 parser 迁移）。H2a 已清 AuthorityRef / dogfood / facet，本带消费其结果，不重开残留抽出。

**不是：** 把 Gen1 全量 `npm run check` 改成 CI 阻断（决策 5 Out · 决策 14）；进 H2c CONTROL-X / 机器 Control；进 H2d INSTALLED router；新建第三份能力去向表；预标 `retire` 或批量删脚本；按 Gen1 目录骨架对称拆文件。

## 一句话目标

让检查器**按 cluster 可抽出、可挂 registry/primitive**，消灭已知 vacuous/误报；台账与投影有可验证契约；docs 形状与 plan-status 解析与现在时一致——**不**把全量 Gen1 check 升为 CI 阻断。

## Stage 0 冻结（Design 定稿，Active 前可窄修）

| 项 | 裁决 |
| --- | --- |
| consistency | **按 cluster EXTRACT**（ADR-0025 决策 10 表）；新检查优先 registry/primitive，**禁止**往 `check-doc-consistency.js` 单文件继续堆事故 cluster（FINDING-0019） |
| CI 权威 | 唯一阻断 = `npm run check:must-ship`；Gen1 `npm run check` **保持观测**直至本计划完成 parser 迁移且人类另裁是否升阻断 |
| 台账 | Discovery Ledger **L2** = 任务级宽度/闭包（FINDING-0022）；不另造 issue tracker；条目家仍在 Active TASK 计划内 |
| 投影 | FINDING-0024：index/README 投影只读或可对账；权威在对象 frontmatter |
| 形状 | FINDING-0030 §5：`docs/` 形状 allowlist **fail-closed**（目录∈封闭树、文件名模式、ID 唯一）；**不做**内容分类门禁 |
| 消费 | 只消费 `script-inventory.v0.json` + ADR-0024；不发明第三份去向表；今日 `retire` 仍空则不删 |
| 顺序 | 未完成 H2b **不得**把半拆 checker 拓扑写进 H2c Control 文件 |

## 范围（In）

1. **剩余 consistency clusters** — 盘点 `check-doc-consistency.js` 现有 cluster；抽出可独立的门禁/表征；留下薄编排或 WRAP，不一次重写全世界。
2. **principles-index #9** — 原则索引指针可解析、与权威原则文件同步（既有 gate 收口或抽出）。
3. **FINDING-0011** — `adr_statuses` 不再把正文里的 `[Unreleased]` 节名误报为 ADR 状态异常；负向 fixture。
4. **FINDING-0019** — 停止 monolith 增长；至少一条「新检查不进单文件」的可验证纪律（表征或 hygiene gate）。
5. **FINDING-0021** — roadmap/plan 同步检查对齐现树路径与 horizon 结构；消灭 vacuous pass。
6. **Discovery Ledger L2** — FINDING-0022：任务级 known-issue 宽度/处置/闭包（计划内载体 + 最小机械或表征）；不建平行 tracker。
7. **FINDING-0024** — 元数据投影漂移：对账或只读投影契约；至少一处已知 drift 类缺陷有门禁/表征。
8. **FINDING-0030 §5** — docs 形状 allowlist fail-closed。
9. **ADR-0016 parser 迁移** — plan-status 识别 frontmatter / 现在时关键词（含 `Active`/`Archived`），与归档语义对齐；减少「全树 unknown」假红或假绿。

## 非目标（Out）

```text
把 Gen1 全量 npm run check 改成 CI 阻断
H2c CONTROL-X / 机器 Control 文件 · H2d INSTALLED router
新建 Gen1→2.x 能力去向权威表
预标 retire、批量删 scripts/
一次搬空 check-doc-consistency.js 全部历史 cluster（允许分切片；禁止继续往里堆新事故 cluster）
内容分类 / 语义等价门禁（形状 allowlist ≠ 语义）
把本计划等同一次 SemVer 发布
```

## 阶段

### Stage 0 — 契约冻结 — **完成**（冻结已记录）

- [x] consistency cluster 清单 + 首批 EXTRACT 目标（≤可验证切片，不一口吃）
- [x] plan-status 解析目标形状（frontmatter 优先 vs 正文 Status 行兼容窗口）
- [x] docs 形状 allowlist 数据源（单一 JSON/表，禁止第三份）
- [x] 人类 Active（「开始施工」；冻结已记录）

### Stage 1 — 误报 / vacuous 先收 — **完成**

- [x] FINDING-0011 adr_statuses 负向 fixture + 修复（`scripts/lib/adr-status.js` + `tests/suites/h2b-checkers.test.js`）
- [x] FINDING-0021 roadmap checker 路径/结构对齐现树（`repo-tools/check-roadmap-sync.js`）
- [x] ADR-0016 plan-status parser 迁移（`scripts/lib/plan-status.js` frontmatter-first；init-spec 拷贝两 lib）

### Stage 2 — consistency 按 cluster EXTRACT — **完成**

- [x] 至少一组 cluster 抽出为独立脚本/primitive + 注册（plan-status / adr-status EXTRACT；docs-shape / discovery / metadata 独立 repo-tools）
- [x] FINDING-0019：新增检查路由纪律可测（h2b 测试禁止 re-inlined Unreleased 全文扫描）
- [x] principles-index #9 收口

### Stage 3 — 台账 / 投影 / 形状 — **完成**

- [x] Discovery Ledger L2（FINDING-0022）最小载体 + 闭包对账（`repo-tools/check-discovery-ledger.js`）
- [x] FINDING-0024 投影对账或只读契约（`repo-tools/check-metadata-projection.js` navigation-only ADR README）
- [x] FINDING-0030 §5 docs 形状 allowlist fail-closed（`repo-tools/check-docs-shape.js` + `repo-tools/docs-shape-allowlist.v0.json`）

### Stage 4 — 验证与闭包 — **完成**

- [x] Discovery Ledger Open=0
- [x] 本带 Findings：Resolved（0011 / 0019 / 0021 / 0022 / 0024 / 0030）
- [x] exit review → Implemented → Archived（Plan archive ≠ Release）
- [x] Roadmap / AGENTS 现在时 → 下一步 H2c（awaiting Design）
- [x] **确认** Gen1 `npm run check` 仍为观测；`check:must-ship` 仍为唯一 CI 阻断

## 完成条件（outcome）

- [x] 已知 vacuous/误报（0011 / 0021）有真实证据关闭
- [x] consistency 增长轴被切断：新检查不默认进 monolith；至少一次成功 EXTRACT
- [x] plan-status 解析与 Gen2 frontmatter 生命周期对齐（机械可证）
- [x] Ledger L2 / 投影 / docs 形状三者有可运行门禁或表征
- [x] 未把全量 Gen1 check 升为 CI 阻断；未进 H2c/d；未建第三份去向表
- [x] 证据真实，非宣称（392/392 tests；`check:docs` / `check:must-ship` green）

## Discovery Ledger（闭包）

| ID | 类型 | 问题 | 状态 | 处置 |
| --- | --- | --- | --- | --- |
| B0 | constraint | 不得升 Gen1 check 为 CI 阻断（默认） | resolved | observed — must-ship 仍唯一 CI 阻断 |
| B1 | defect | FINDING-0011 adr_statuses 误报 | resolved | `scripts/lib/adr-status.js` + h2b 负向测试 |
| B2 | defect | FINDING-0021 roadmap checker vacuous | resolved | `repo-tools/check-roadmap-sync.js` Gen2 现树 |
| B3 | migration_gap | ADR-0016 plan-status parser | resolved | `scripts/lib/plan-status.js` frontmatter-first |
| B4 | architecture_gap | FINDING-0019 consistency monolith | resolved | EXTRACT + 独立 repo-tools checkers + 禁 re-inline 测试 |
| B5 | architecture_gap | principles-index #9 | resolved | 既有 gate 收口 |
| B6 | control_gap | FINDING-0022 Ledger L2 | resolved | `repo-tools/check-discovery-ledger.js` |
| B7 | mechanism_gap | FINDING-0024 投影漂移 | resolved | `repo-tools/check-metadata-projection.js` |
| B8 | control_gap | FINDING-0030 §5 形状 allowlist | resolved | `repo-tools/check-docs-shape.js` + `repo-tools/docs-shape-allowlist.v0.json` |
| B9 | constraint | 禁第三份去向表；不预标 retire | resolved | observed — 只消费 inventory + ADR-0024 |

```text
Total known:  10
Resolved:     10
Open:         0
Unaccounted:  0
```

## 受影响文件（已交付）

- `scripts/check-doc-consistency.js` · `scripts/lib/adr-status.js` · `scripts/lib/plan-status.js`
- `repo-tools/check-roadmap-sync.js` · `repo-tools/check-discovery-ledger.js` · `repo-tools/check-metadata-projection.js` · `repo-tools/check-docs-shape.js` · `repo-tools/docs-shape-allowlist.v0.json`
- `tests/suites/h2b-checkers.test.js` · `references/init-spec.json`（拷贝两 lib）
- `docs/findings/FINDING-0011-*` · `FINDING-0019-*` · `FINDING-0021-*` · `FINDING-0022-*` · `FINDING-0024-*` · `FINDING-0030-*`
- `docs/plans/roadmap/{en,zh-CN,zh-TW}.md` · `AGENTS.md` · `CHANGELOG.md`

## 参考

- ADR-0025 决策 5 / 10 / 14 · ADR-0024 · ADR-0016 · ADR-0020 · ADR-0018 决策 7
- PLAN-0047 Archived（H2a）· PLAN-0041 script-inventory · PLAN-0035 disposition（只消费）
- FINDING-0011 · 0019 · 0021 · 0022 · 0024 · 0030
