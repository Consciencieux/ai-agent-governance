---
id: PLAN-0046
status: Active
generation: gen2
target: both
---

# PLAN-0046：指令面 2.0 对齐（薄入口 + 可调用能力叶）

**状态：** Active（人类开工 2026-09-13）。

**归属：** [ADR-0025](../design-decisions/ADR-0025-gen2x-product-path.md) **H2-front**（决策 14：薄入口 + must-ship 叶卡，排在 H2a 之前）。**不是** H2d（安装面 router / Narrow ADR 进 INSTALLED）。不吞并 H2-0 台账校准、也不吞并 H2a/H2b/H2c。

**问题（已对齐）：** 机械面已是薄入口 + Task→Capability 查表，但人/Agent 可读指令面仍大量 Gen1 厚入口平面堆规则；可调用能力也未统一写成 2.0 叶文档。FINDING-0015 / ADR-0022 / PLAN-0034 E1 deferred 为同一债。

**不是：** 「开始解决 RESEARCH-0006」。0006 已是 Gen1 能力基线 + ADR-0024 投影；本计划**只消费**它，不重开、不改写其处置列、不另建第三份能力去向表。

## 一句话目标

让 always-on 入口只做身份 / invariants / 路由；每个 ADR-0024 `must-ship` 能力有一份可查表调用的 2.0 叶说明（触发 → 权威 → 调用 → 验证）；厚平面政策不再充当 dispatcher。

## Stage 0 冻结（已定稿）

| 项 | 裁决 |
| --- | --- |
| 叶卡 schema | 必填节：`## Trigger` · `## Authority` · `## Invoke` · `## Verify` · `## Non-goals` |
| 落点 | **唯一权威写作面** = `references/capabilities/*.md`（INSTALLED；INIT → `docs/rules/capabilities/`）。禁止在入口或 `docs/` 双写叶正文 |
| 覆盖清单 | **指针**：ADR-0024 §4 + RESEARCH-0006 处置列；机读覆盖索引（非处置权威）=`repo-tools/instruction-surface-leaves.v0.json` |
| discovery-ledger | 保留叶并符合 schema；处置仍为 `later`（不计入 must-ship 覆盖） |

## 范围（In）

1. **入口变薄（repo + skill）** — `AGENTS.md` / `SKILL.md` 收敛到 ADR-0022：identity · scope · always-on invariants · 显式路由表 · fallback。详细规则迁出到叶文件或已有权威，禁止入口变百科。
2. **能力叶卡（2.0 形状）** — 对 ADR-0024 §4 `must-ship` 集合（以 RESEARCH-0006 投影列为索引，不以复制矩阵为正文）：每条能力具备可加载叶文档，含上述五节。
3. **路由表闭合** — 入口路由表 ↔ 叶文件 ↔ must-ship 索引无悬空指针；缺口进 Discovery Ledger，不得静默跳过。
4. **消费已有权威** — ADR-0020 / `references/principles/`（H1 产物）；ADR-0022；ADR-0024；RESEARCH-0006；FINDING-0015。
5. **表征测试** — 叶卡必填节；must-ship→叶 覆盖率；init-spec 角色完备；入口禁区逐步收紧。

## 非目标（Out）

```text
重写或「完成」RESEARCH-0006（它已是基线，不是施工合同）
新建「Gen1 能力 → 2.x 去向」权威表（FINDING-0024；权威仍是 ADR-0024）
H2a 残留叶 CTRL 重排 / H2b consistency 大拆 / H2c CONTROL-X 机读化
删除、隔离或批量退役 scripts/（今日 retire=∅；ADR-0025 决策 10）
把本仓 Task→Capability router 写入 INSTALLED 默认面（完整调度属 H2d 后续；本计划只做指令面可调用化）
把 RESEARCH / Finding / ADR 全文塞进入口或叶卡
为每个 later/retire/out 能力写叶（本计划只覆盖 must-ship；其余另开或延后）
把本计划等同一次 SemVer 发布
```

## 阶段

### Stage 0 — 契约冻结 — **DONE**

- [x] 叶卡 schema 定稿
- [x] 落点 = `references/capabilities/`（单写）
- [x] must-ship 覆盖 = 指针 + `instruction-surface-leaves.v0.json`
- [x] 人类 Active

### Stage 1 — 缺口台账 — **DONE（首版）**

- [x] must-ship → 叶路径记账（见 inventory；Open 缺口进 Ledger）
- [x] 入口厚段归类（Y0：SKILL 仍厚，Stage 3 收）
- [x] Open 项有 owner

### Stage 2 — 叶卡落地 — **IN PROGRESS**

- [x] must-ship 叶卡齐备（32 must-ship + 1 later）并符合 schema
- [x] `references/init-spec.json` 同步 INSTALLED 角色
- [x] architecture ×3 布局树列出新叶
- [ ] Authority 路径抽检（脚本/政策名与磁盘一致）— 持续

### Stage 3 — 入口改写 — **IN PROGRESS**

- [x] `SKILL.md` / `AGENTS.md` 增加显式 Capability 路由表
- [ ] 继续删减入口百科正文（迁叶 / 留 always-on）
- [ ] 与 `references/principles/entry.md` 指针一致复核
- [ ] 三语产品文档现在时指针（若声称入口职责）

### Stage 4 — 验证 — **IN PROGRESS**

- [x] 表征测试 `instruction-surface`（schema + must-ship 覆盖 + inventory 闭合）
- [ ] 干净目标：打包 → INIT → 叶引用可解析
- [ ] Discovery Ledger Open=0（或 defer+revisit 显式）
- [ ] exit review → Implemented → Archived（Plan archive ≠ Release）

## 完成条件（outcome）

- [ ] Always-on 入口不再承载完整政策/能力百科；路由表可解析到叶
- [x] 每个 ADR-0024 must-ship 能力有且仅有一条 2.0 叶卡权威说明（Trigger/Authority/Invoke/Verify/Non-goals）— 以 inventory 为准
- [x] RESEARCH-0006 / ADR-0024 未被本计划改写为第二处置源
- [x] 未借机清理 scripts/、未装本仓 router 为 INSTALLED 默认、未做 H2a–c 大爆炸
- [ ] 干净目标证据真实（非宣称）

## Discovery Ledger（Active 维护）

| ID | 类型 | 问题 | 状态 | 处置 |
| --- | --- | --- | --- | --- |
| Y0 | observation | 入口厚平面 vs 机械薄路由（FINDING-0015） | open | Stage 3 继续瘦身 |
| Y1 | migration_gap | must-ship 缺少 2.0 叶卡 | closed | resolved（32 叶 + inventory） |
| Y2 | observation | PLAN-0034 E1 完整瘦身曾 deferred | open | 本计划 Stage 3 收口 |
| Y3 | constraint | 不得把 0006 当施工合同重开 | closed | resolved（Out） |
| Y4 | observation | SKILL 仍含执行层百科；路由表已加但正文未删净 | open | Stage 3 |
| Y5 | verification | 干净目标 INIT 叶闭包证据 | open | Stage 4 |

```text
Total known:  6
Resolved:     2  (Y1, Y3)
Open:         4  (Y0, Y2, Y4, Y5)
Unaccounted:  0
```

## 受影响文件

- `AGENTS.md` · `SKILL.md`
- `references/capabilities/*`
- `references/init-spec.json`
- `repo-tools/instruction-surface-leaves.v0.json`
- `tests/suites/instruction-surface.test.js`
- `docs/product/{en,zh-CN,zh-TW}/architecture.md`
- `docs/plans/roadmap/{en,zh-CN,zh-TW}.md`
- `CHANGELOG.md`
- RESEARCH-0006 / ADR-0024（**只读引用**）

## 参考

- ADR-0022 · ADR-0020 · ADR-0024 · ADR-0025 H2
- FINDING-0015 · FINDING-0024 · FINDING-0026
- RESEARCH-0006（基线输入）· RESEARCH-0009
- PLAN-0034 E1 · PLAN-0037 Archived（`references/principles/`）· PLAN-0038/0039/0040（路由已 EXITED）
