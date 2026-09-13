---
id: PLAN-0049
status: Archived
generation: gen2
target: both
---

# PLAN-0049：H2c 跨 profile / 机器 Control

**状态：** Archived（2026-09-13 exit review）。Stage 0–4 完成；C0–C7 全关。Plan archive ≠ Release。下一步 = **H2d**（PLAN-0050）。

**归属：** [ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md) **H2c**（决策 5 + 决策 14：H2-0 → PLAN-0046 → H2a → H2b → **c**→d）。前置 H2b [PLAN-0048](archive/PLAN-0048-h2b-checkers-and-ledgers.md) 已 Archived。下一步 = **H2d**（本带未完成前不得开工）。

**问题（已对齐）：** Control 仍主要活在 ADR 正文表与脚本路径里——机器看不到稳定 identity / binding（FINDING-0002 / 0025）；双 profile 共享义务缺少同一 fixture 打两侧的 CONTROL-X（FINDING-0001 · ADR-0020 决策 4）；`references/templates/` 仍按生成方式混住 instruction source 与 boilerplate（FINDING-0026）。H1 已 Archived；本带做**本仓** Control 机读化，portable 只抽形状，不抽 `CTRL-NNNN`（ADR-0025 决策 13）。

**不是：** 把本仓 CTRL 号写成 portable invariant；实现完整 Dispatcher / Evidence Model 全套（FINDING-0002 关闭条件 2–3 留给后续）；进 H2d INSTALLED router；按 Gen1 目录骨架对称拆 `templates/`；把 Gen1 全量 `npm run check` 升为 CI 阻断；新建第三份能力去向表。

## 一句话目标

让本仓 Control 有可加载的机读投影 + 至少一条真实 CONTROL-X；instruction source 与 template 责任可声明、可对账——**不**把 `CTRL-NNNN` 钉进 portable skill，**不**实现全量 Dispatcher。

## Stage 0 冻结（Design 定稿；Active 后窄修须入 Ledger）

| 项 | 裁决 |
| --- | --- |
| 物理家 | 机读 Control 文件 = **REPO-ONLY** `repo-tools/controls/`（一 CTRL 一 JSON + 可选 index）。**不**新建 `governance-core/` / `docs/controls/`。Schema 权威仍是 [ADR-0023](../../design-decisions/ADR-0023-governance-control-model.md)；文件是 slot 投影，不是第二语义家 |
| 第二 consumer | CONTROL-X runner + registry checker 即为 ADR-0023 决策 6 所等的「第二个真实机器 consumer」——本计划 Narrow 授权序列化 |
| Portable | `references/principles/` 只写 identity · semantic owner · evaluator · binding · evidence **形状**；**禁止**把本仓 `CTRL-NNNN` 写成 INSTALLED/portable invariant（决策 5 Out · 决策 13） |
| CONTROL-X | 仅双 profile 都有实现的 Control；首刀 = **CTRL-0001**（skill `scripts/check-secrets.js` × repo `repo-tools/check-secrets.js`）；同一 canonical negative fixture；禁止两侧各写语义不同的夹具（ADR-0020） |
| FINDING-0002 | 本带关闭「最小 Policy/Control 身份可机读」切片；**不**宣称 Dispatcher 全链关闭（条件 2–3 → H2d / 后续 Plan） |
| FINDING-0026 | 责任分类表（机读 map + architecture/init-spec 指针）；**允许**声明性归类；**禁止**本带按 Gen1 骨架 bulk move `templates/` |
| 消费 | 只消费 ADR-0023 已发号 CTRL + `script-inventory.v0.json`；新 CTRL 仅在 EXTRACT 新机械能力时分配（决策 13）；不发明第三份去向表 |
| 顺序 | 未完成 H2c **不得**开工 H2d；不得把半成品 leftover 拓扑写进 Control 文件（决策 5） |

## 范围（In）

1. **机读 Control 投影** — 将 ADR-0023 种子 CTRL（至少 0001–0006 中已有 evaluator/binding 的）落到 `repo-tools/controls/`；registry gate 校验必填 slot、identity 唯一、路径存在。
2. **ADR-0023 Narrow** — 决策 6：授权本仓机读序列化落点；明确「文件 ≠ 语义权威」。
3. **CONTROL-X（FINDING-0001）** — 首刀 CTRL-0001：同一 fixture → repo CLI fail + skill CLI fail；可运行脚本/测试；契约可复用到后续双域 Control。
4. **FINDING-0025** — semantics / applicability / evaluator / evidence 关系可从机读文件追踪；投影不再只靠 ADR 人手抄表。
5. **FINDING-0026** — instruction source vs bootstrap template 责任 map（机读）；发现/对账不依赖「是否被 generator 使用」这一物理属性 alone。
6. **FINDING-0002（切片）** — 最小 Control 身份机读存在；完整 Dispatcher 明确 Out。
7. **Portable 形状** — principles 包补一节/一叶：Control 形状（无本仓编号承诺）。
8. **Layout / inventory** — 新 `repo-tools` 文件进 architecture ×3 + script-inventory（若适用）。

## 非目标（Out）

```text
把本仓 CTRL-NNNN 写成 portable / INSTALLED invariant
完整 Dispatcher + Evidence Model 全链（FINDING-0002 条件 2–3）
H2d INSTALLED router / Narrow ADR 进默认安装面
按 Gen1 目录骨架 bulk 拆搬 references/templates/
把 Gen1 全量 npm run check 改成 CI 阻断
新建 Gen1→2.x 能力去向权威表
预标 retire、批量删 scripts/
把本计划等同一次 SemVer 发布
为尚无双 profile 实现的 Control 硬造 CONTROL-X
```

## 阶段

### Stage 0 — 契约冻结 — **完成**

- [x] 物理家 / portable 边界 / CONTROL-X 首刀 / Finding 切片裁决（上表）
- [x] 人类 Active（「开始H2c」）
- [x] ADR-0023 决策 6 Narrow（本仓 `repo-tools/controls/` + registry / CONTROL-X consumer）

### Stage 1 — 机读 registry + ADR Narrow — **完成**

- [x] `repo-tools/controls/` 种子（CTRL-0001 / 0002 / 0003 / 0004 / 0006）
- [x] `repo-tools/check-control-registry.js`（fail-closed）
- [x] ADR-0023 决策 6 Narrow + architecture ×3 布局行
- [x] 表征：`tests/suites/h2c-controls.test.js`

### Stage 2 — CONTROL-X 首刀（CTRL-0001） — **完成**

- [x] canonical negative fixture（运行时组装；跟踪文件无活密钥形）
- [x] `repo-tools/run-control-x.js`：同一 fixture 打 repo + skill CLI
- [x] 接入 `npm run check` / `check:docs` + h2c suite；`check:must-ship` 保持唯一 CI 阻断
- [x] FINDING-0001 → Resolved

### Stage 3 — FINDING-0026 责任面 + portable 形状 — **完成**

- [x] `repo-tools/template-responsibility.v0.json` + `check-template-responsibility.js`
- [x] `references/principles/control-shape.md`（无 CTRL 号承诺；入 init-spec skillInternal）
- [x] FINDING-0026 / 0025 → Resolved；FINDING-0002 写明切片 vs Dispatcher 剩余（仍 Confirmed）

### Stage 4 — 验证与闭包 — **完成**

- [x] 核心门禁绿：`h2c-controls` 4/4；`check-roadmap-sync --gate`；`check:must-ship` OK
- [x] Discovery Ledger Open=0
- [x] exit review → Implemented → Archived（Plan archive ≠ Release；人类「开始H2d」触发收口）
- [x] Roadmap / AGENTS / ADR-0025 现在时 → 下一步 H2d
- [x] 确认未升 Gen1 check；未把 CTRL 号写入 portable invariant

## 完成条件（outcome）

- [x] 至少一条双域 Control 有真实 CONTROL-X 证据（非宣称）
- [x] 机读 Control 投影可被 registry gate 校验；ADR-0023 仍为 schema 权威
- [x] instruction vs template 责任可声明、可对账
- [x] portable 仅有形状、无本仓 CTRL 号承诺
- [x] FINDING-0001 / 0025 / 0026 Resolved；FINDING-0002 切片进展写清、Dispatcher 仍 Open/Confirmed
- [x] 证据真实（tests + `check:must-ship` / 相关 scope gate）

## Discovery Ledger

| ID | 类型 | 问题 | 状态 | 处置 |
| --- | --- | --- | --- | --- |
| C0 | constraint | 禁止 CTRL 号进 portable invariant | resolved | observed — control-shape + principles 无编号硬承诺 |
| C1 | constraint | 禁止升 Gen1 check 为 CI 阻断；H2c 期间禁止开工 H2d | resolved | observed — must-ship 仍唯一 CI 阻断；H2d 于本计划 Archived 后开工 |
| C2 | architecture_gap | FINDING-0002 机读 Control 身份 | resolved | `repo-tools/controls/` + registry；Dispatcher 仍 Open |
| C3 | architecture_gap | FINDING-0025 sync / identity | resolved | 机读投影 + FINDING-0025 Resolved |
| C4 | architecture_gap | FINDING-0001 CONTROL-X | resolved | `run-control-x.js` CTRL-0001 |
| C5 | architecture_gap | FINDING-0026 instruction vs template | resolved | template-responsibility map + gate |
| C6 | migration_gap | ADR-0023 决策 6 序列化未授权 → 需 Narrow | resolved | ADR-0023 Narrow 2026-09-13 |
| C7 | constraint | 禁第三份去向表；禁 Gen1 骨架 bulk move templates | resolved | observed — 只消费 inventory + ADR-0024；未 bulk move |

```text
Total known:  8
Resolved:     8
Open:         0
Unaccounted:  0
```

## 受影响文件（预告；交付时按实改修订）

### repo-infra

- `repo-tools/controls/` · `repo-tools/check-control-registry.js` · CONTROL-X runner（路径 Stage 1 定）
- `repo-tools/template-responsibility.v0.json`（或等价）
- `repo-tools/script-inventory.v0.json` · `tests/suites/`（新表征）
- `docs/design-decisions/ADR-0023-governance-control-model.md` · `docs/design-decisions/ADR-0025-gen2x-product-path.md`
- `docs/findings/FINDING-0001-*` · `FINDING-0002-*` · `FINDING-0025-*` · `FINDING-0026-*`
- `docs/plans/roadmap/{en,zh-CN,zh-TW}.md` · `AGENTS.md` · `CHANGELOG.md`
- `docs/product/{en,zh-CN,zh-TW}/architecture.md`

### payload（形状 / 原则；非 CTRL 号）

- `references/principles/`（Control 形状一节或一叶）
- 若 CONTROL-X 表征需触达 skill CLI：仅测试调用既有 `scripts/check-secrets.js`，不改秘密语义

## Target: both — 同步点

| 域 | 同步点 |
| --- | --- |
| repo | 机读 controls、registry/CONTROL-X、architecture 布局、findings、roadmap |
| payload | principles 形状 only；不安装 `repo-tools/controls/`；不把 CTRL 号写入 INSTALLED 规则 |
| 两侧 | CTRL-0001 CONTROL-X 同一 fixture 打两侧 CLI |

## 参考

- ADR-0025 决策 5 / 13 / 14 · ADR-0023 · ADR-0020 决策 4 · ADR-0024
- PLAN-0048 Archived（H2b）· PLAN-0035 disposition（只消费）· PLAN-0037 Archived（H1）
- FINDING-0001 · 0002 · 0025 · 0026
- RESEARCH-0010（模型；不重开为施工日记）
