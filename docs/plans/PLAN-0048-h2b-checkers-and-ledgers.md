---
id: PLAN-0048
status: Design
generation: gen2
target: both
---

# PLAN-0048：H2b 检查器与台账（consistency 按 cluster 抽出 · 门禁真覆盖 · 台账 L2）

**状态：** Design（2026-09-13）。**禁止口头开工**——须人类显式 Active 后才进入施工（ADR-0018 决策 7 · ADR-0025 决策 2）。

**归属：** [ADR-0025](../design-decisions/ADR-0025-gen2x-product-path.md) **H2b**（决策 5 + 决策 14：H2-0 → PLAN-0046 → H2a → **b**→c→d）。前置 H2a [PLAN-0047](archive/PLAN-0047-h2a-residue-extraction.md) 已 Archived。

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

### Stage 0 — 契约冻结 — **Design 中**

- [ ] consistency cluster 清单 + 首批 EXTRACT 目标（≤可验证切片，不一口吃）
- [ ] plan-status 解析目标形状（frontmatter 优先 vs 正文 Status 行兼容窗口）
- [ ] docs 形状 allowlist 数据源（单一 JSON/表，禁止第三份）
- [ ] 人类 Active

### Stage 1 — 误报 / vacuous 先收 — Active 后

- [ ] FINDING-0011 adr_statuses 负向 fixture + 修复
- [ ] FINDING-0021 roadmap checker 路径/结构对齐现树
- [ ] ADR-0016 plan-status parser 迁移（表征：已知 Archived 计划不再整树 unknown）

### Stage 2 — consistency 按 cluster EXTRACT — Active 后

- [ ] 至少一组 cluster 抽出为独立脚本/primitive + 注册
- [ ] FINDING-0019：新增检查路由纪律可测（单文件行数/注册表二选一或等价）
- [ ] principles-index #9 收口

### Stage 3 — 台账 / 投影 / 形状 — Active 后

- [ ] Discovery Ledger L2（FINDING-0022）最小载体 + 闭包对账
- [ ] FINDING-0024 投影对账或只读契约
- [ ] FINDING-0030 §5 docs 形状 allowlist fail-closed

### Stage 4 — 验证与闭包 — Active 后

- [ ] Discovery Ledger Open=0（或 defer+revisit 显式）
- [ ] 本带 Findings：Resolved 或书面「剩余为何不挡 H2c」
- [ ] exit review → Implemented → Archived（Plan archive ≠ Release）
- [ ] Roadmap / AGENTS 现在时 → 下一步 H2c
- [ ] **确认** Gen1 `npm run check` 仍为观测（除非人类另裁升阻断——默认不升）

## 完成条件（outcome）

- [ ] 已知 vacuous/误报（0011 / 0021）有真实证据关闭或书面延期
- [ ] consistency 增长轴被切断：新检查不默认进 monolith；至少一次成功 EXTRACT
- [ ] plan-status 解析与 Gen2 frontmatter 生命周期对齐（机械可证）
- [ ] Ledger L2 / 投影 / docs 形状三者有可运行门禁或表征
- [ ] 未把全量 Gen1 check 升为 CI 阻断；未进 H2c/d；未建第三份去向表
- [ ] 证据真实，非宣称

## Discovery Ledger（Active 后维护；Design 预置）

| ID | 类型 | 问题 | 状态 | 处置 |
| --- | --- | --- | --- | --- |
| B0 | constraint | 不得升 Gen1 check 为 CI 阻断（默认） | open | Stage 0 Out |
| B1 | defect | FINDING-0011 adr_statuses 误报 | open | Stage 1 |
| B2 | defect | FINDING-0021 roadmap checker vacuous | open | Stage 1 |
| B3 | migration_gap | ADR-0016 plan-status parser | open | Stage 1 |
| B4 | architecture_gap | FINDING-0019 consistency monolith | open | Stage 2 |
| B5 | architecture_gap | principles-index #9 | open | Stage 2 |
| B6 | control_gap | FINDING-0022 Ledger L2 | open | Stage 3 |
| B7 | mechanism_gap | FINDING-0024 投影漂移 | open | Stage 3 |
| B8 | control_gap | FINDING-0030 §5 形状 allowlist | open | Stage 3 |
| B9 | constraint | 禁第三份去向表；不预标 retire | open | 全程 |

```text
Total known:  10
Resolved:     0
Open:         10  (B0–B9)
Unaccounted:  0
```

## 受影响文件（Active 后预期；Design 不预提交）

- `scripts/check-doc-consistency.js`（及抽出后的独立 checker / evaluators）
- `repo-tools/check-roadmap-sync.js`（或现树等价）· plan-status 解析点
- Discovery Ledger 政策/叶卡 · docs 形状 allowlist 机读面
- `tests/suites/*consistency*` · `*roadmap*` · 形状/台账表征
- `docs/findings/FINDING-0011-*` · `FINDING-0019-*` · `FINDING-0021-*` · `FINDING-0022-*` · `FINDING-0024-*` · `FINDING-0030-*`
- `docs/plans/roadmap/{en,zh-CN,zh-TW}.md` · `AGENTS.md` · `CHANGELOG.md`（行为落地时）

## 参考

- ADR-0025 决策 5 / 10 / 14 · ADR-0024 · ADR-0016 · ADR-0020 · ADR-0018 决策 7
- PLAN-0047 Archived（H2a）· PLAN-0041 script-inventory · PLAN-0035 disposition（只消费）
- FINDING-0011 · 0019 · 0021 · 0022 · 0024 · 0030
