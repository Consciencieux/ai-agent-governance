---
id: PLAN-0046
status: Design
generation: gen2
target: both
---

# PLAN-0046：指令面 2.0 对齐（薄入口 + 可调用能力叶）

**状态：** Design（待人类 Active）。不自动开工改写 `AGENTS.md` / `SKILL.md`。

**归属：** [ADR-0025](../design-decisions/ADR-0025-gen2x-product-path.md) **H2-front**（决策 14：薄入口 + must-ship 叶卡，排在 H2a 之前）。**不是** H2d（安装面 router / Narrow ADR 进 INSTALLED）。不吞并 H2-0 台账校准、也不吞并 H2a/H2b/H2c。

**问题（已对齐）：** 机械面已是薄入口 + Task→Capability 查表，但人/Agent 可读指令面仍大量 Gen1 厚入口平面堆规则；可调用能力也未统一写成 2.0 叶文档。FINDING-0015 / ADR-0022 / PLAN-0034 E1 deferred 为同一债。

**不是：** 「开始解决 RESEARCH-0006」。0006 已是 Gen1 能力基线 + ADR-0024 投影；本计划**只消费**它，不重开、不改写其处置列、不另建第三份能力去向表。

## 一句话目标

让 always-on 入口只做身份 / invariants / 路由；每个 ADR-0024 `must-ship` 能力有一份可查表调用的 2.0 叶说明（触发 → 权威 → 调用 → 验证）；厚平面政策不再充当 dispatcher。

## 范围（In）

1. **入口变薄（repo + skill）** — `AGENTS.md` / `SKILL.md` 收敛到 ADR-0022：identity · scope · always-on invariants · 显式路由表 · fallback。详细规则迁出到叶文件或已有权威，禁止入口变百科。
2. **能力叶卡（2.0 形状）** — 对 ADR-0024 §4 `must-ship` 集合（以 RESEARCH-0006 投影列为索引，不以复制矩阵为正文）：每条能力具备可加载叶文档，至少含：
   - Trigger（何时加载）
   - Authority（唯一语义权威路径）
   - Invoke（Agent / 脚本如何调用）
   - Verify（如何证明做对了）
   - Non-goals（本叶不负责什么）
3. **路由表闭合** — 入口路由表 ↔ 叶文件 ↔ must-ship 索引无悬空指针；缺口进 Discovery Ledger，不得静默跳过。
4. **消费已有权威** — ADR-0020 / `references/principles/`（H1 产物）；ADR-0022；ADR-0024；RESEARCH-0006；FINDING-0015。
5. **表征测试** — 入口体积/禁区（无完整 workflow 正文、无能力百科）；叶卡必填节；must-ship→叶 覆盖率；干净目标 INIT 后引用仍闭合。

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

### Stage 0 — 契约冻结（Design → Active 前）

- [ ] 叶卡 schema 定稿（Trigger / Authority / Invoke / Verify / Non-goals）；落点目录裁决（现有 `references/capabilities/` 扩展 vs INSTALLED `docs/rules/capabilities/` 投影——**不得双写权威**）
- [ ] must-ship 覆盖清单 = **指针**到 ADR-0024 §4 + RESEARCH-0006 投影列，禁止在本 Plan 粘贴能力百科
- [ ] 人类 Active

### Stage 1 — 缺口台账

- [ ] 逐条 must-ship：已有叶 / 可改写叶 / 缺失叶 → Discovery Ledger
- [ ] 入口现状：厚段归类（迁叶 / 删重复 / 留 always-on）
- [ ] Open 项全部有 owner；禁止边改边发现不记账

### Stage 2 — 叶卡落地

- [ ] 补齐或改写 must-ship 叶到 2.0 schema
- [ ] Authority 单点：叶只引用，不复制政策全文
- [ ] INIT/分发角色声明（INSTALLED vs SKILL-INTERNAL）与 `init-spec.json` 同步

### Stage 3 — 入口改写

- [ ] `SKILL.md` / `AGENTS.md` 按 ADR-0022 瘦身 + 路由表指向叶
- [ ] 与 `references/principles/entry.md` 指针一致（原则包仍 SKILL-INTERNAL；入口不粘贴 L1 全文）
- [ ] 三语产品文档若声称入口职责，只改指针/现在时，不把手册写成第二权威

### Stage 4 — 验证

- [ ] 表征测试绿（入口禁区 + 叶 schema + must-ship 覆盖）
- [ ] 干净目标：打包 → INIT → 路由/叶引用可解析；必装机械门禁仍 fail-closed
- [ ] Discovery Ledger Open=0（或 defer+revisit 显式）
- [ ] exit review → Implemented → Archived（Plan archive ≠ Release）

## 完成条件（outcome）

- [ ] Always-on 入口不再承载完整政策/能力百科；路由表可解析到叶
- [ ] 每个 ADR-0024 must-ship 能力有且仅有一条 2.0 叶卡权威说明（Trigger/Authority/Invoke/Verify）
- [ ] RESEARCH-0006 / ADR-0024 未被本计划改写为第二处置源
- [ ] 未借机清理 scripts/、未装本仓 router 为 INSTALLED 默认、未做 H2a–c 大爆炸
- [ ] 干净目标证据真实（非宣称）

## Discovery Ledger（Active 后维护）

| ID | 类型 | 问题 | 状态 | 处置 |
| --- | --- | --- | --- | --- |
| Y0 | observation | 入口厚平面 vs 机械薄路由（FINDING-0015） | open | Stage 3 |
| Y1 | migration_gap | must-ship 能力缺少 2.0 叶卡 | open | Stage 1–2 |
| Y2 | observation | PLAN-0034 E1 完整瘦身曾 deferred | open | 本计划闭合或显式再 defer |
| Y3 | constraint | 不得把 0006 当施工合同重开 | closed | resolved（本计划 Out） |

```text
Total known:  4
Resolved:     1  (Y3)
Open:         3  (Y0–Y2)
Unaccounted:  0
```

## 受影响文件（Active 后增量冻结）

- `AGENTS.md` · `SKILL.md`
- `references/capabilities/*`（及/或 INIT 投影路径，Stage 0 定稿）
- `references/init-spec.json`
- `references/principles/entry.md`（指针同步，不改 L1 权威）
- `docs/product/{en,zh-CN,zh-TW}/architecture.md`（若布局/角色变化）
- `tests/suites/*`（入口/叶卡/覆盖表征）
- `docs/plans/roadmap/{en,zh-CN,zh-TW}.md`
- CHANGELOG.md
- RESEARCH-0006 / ADR-0024（**只读引用**；默认不改）

## 参考

- ADR-0022 · ADR-0020 · ADR-0024 · ADR-0025 H2
- FINDING-0015 · FINDING-0024 · FINDING-0026
- RESEARCH-0006（基线输入）· RESEARCH-0009
- PLAN-0034 E1 · PLAN-0037 Archived（`references/principles/`）· PLAN-0038/0039/0040（路由已 EXITED）
