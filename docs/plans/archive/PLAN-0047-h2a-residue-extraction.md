---
id: PLAN-0047
status: Archived
generation: gen2
target: both
---

# PLAN-0047：H2a 残留抽出（AuthorityRef 重指向 · lifecycle 辨析 · 脚本 dogfood）

> **Status: Archived

**状态：** Archived（2026-09-13 exit review）。Stage 0–4 完成；A0–A5 全关。Plan archive ≠ Release。

**归属：** [ADR-0025](../design-decisions/ADR-0025-gen2x-product-path.md) **H2a**（决策 5 + 决策 14：H2-0 → PLAN-0046 → **a**→b→c→d）。前置 H2-front [PLAN-0046](archive/PLAN-0046-instruction-surface-2.0-alignment.md) 已 Archived。

**问题（已对齐）：** Phase 5c（PLAN-0040）只投影了 P0–P2 / Slice B；leftover Capability 叶的 AuthorityRef 仍可能钉在旧 lifecycle 单体或过粗 policy 节。FINDING-0029 的 lifecycle 一名三义与 `state.json` phase-as-facet 未收。FINDING-0028 的 L0 台账（PLAN-0041）已在，但本仓 dogfood / dual_profile 声明未收口。今日 `script-inventory.v0.json` 的 `retire = ∅`。

**不是：** 重开 Phase 5；按 Gen1 目录骨架细切；新建「Gen1 能力 → 2.x 去向」权威表（FINDING-0024）；预标或批量 `retire`；进 H2b consistency 大拆 / H2c CONTROL-X / H2d INSTALLED router。

## 一句话目标

在**不重排目录、不发明第三份处置台账**的前提下：把 leftover Capability 叶的 AuthorityRef 指到正确权威；切断 lifecycle 错误生长坐标并处理 `state.json` phase→facet；让脚本 inventory 的代际/处置可门禁，本仓 dogfood 边界可声明——为 H2b 清 checker 铺路。

## Stage 0 冻结（Design 定稿，Active 前可窄修）

| 项 | 裁决 |
| --- | --- |
| leftover 投影 | **只改 AuthorityRef**（及必要的叶内指针）；**不**按 Gen1 lifecycle/Phase 目录细切；**不**重开 Phase 5 |
| 台账 | **只消费** [`repo-tools/script-inventory.v0.json`](../../repo-tools/script-inventory.v0.json)（PLAN-0041）；今日 `retire = ∅`；**禁止**第三份能力去向表 |
| lifecycle | 关闭坐标 = FINDING-0029 辨析落地（义项 A 不回归本仓 · B=产品模式 · C=编排 facet）；残留抽出按 Finding「不得再按错误坐标新增」；不要求一次搬光全部历史正文 |
| `state.json` | phase 降级为 **facet**（命名与机读字段与现有治理状态契约对齐；Active 后定字段名，Design 不锁实现细节） |
| dogfood | FINDING-0028：本仓 `npm run check` 对 INSTALLED CLI 的调用须有 dual_profile / 显式声明或迁到 REPO-ONLY；**不**借机整夹删 Gen1 |
| 顺序纪律 | 未收完 H2a leftover **不得**把旧拓扑写进 H2c Control 文件（ADR-0025 决策 5） |

## 范围（In）

1. **5c leftover Capability 叶** — 枚举仍指向 lifecycle 单体 / 过粗 AuthorityRef 的叶；逐叶重指向正确 policy/capability 权威；表征：路由图 / inventory 无悬空 AuthorityRef。
2. **FINDING-0029** — 文档与入口指针固定三义辨析；阻断「往 Phase 里塞横切」；`state.json` phase→facet 迁移（含生成物/模板同步点）；不把 Skill Manager 自更新（义项 A）拉回本仓。
3. **FINDING-0028 dogfood** — 在已有 script-inventory 上补齐 generation/disposition/dual_profile 缺口的**可验证声明**；拆本仓对 INSTALLED CLI 的隐式狗粮或显式双 profile 门禁；`retire` 仍为空则**不**删脚本、不预标。
4. **消费台账** — 任何「能否删 / 是否遗留」问题只问 `script-inventory.v0.json` + ADR-0024 处置；缺口进本计划 Discovery Ledger。
5. **表征测试** — AuthorityRef 闭合；inventory `retire` 仍为空则门禁保持；state facet 机读；dogfood 声明可测。

## 非目标（Out）

```text
重开 Phase 5 / 按 Gen1 目录骨架对称拆文件
新建 Gen1→2.x 能力去向权威表（FINDING-0024）
预标 retire、批量删 scripts/、整夹隔离「看起来像旧的」路径
H2b consistency 大拆 · H2c CONTROL-X / 机器 Control · H2d INSTALLED router
把 RESEARCH / Finding 全文塞进 SKILL 入口
把本计划等同一次 SemVer 发布
一次性搬空 lifecycle.policy.md 全部历史正文（允许分切片；坐标错误的新增必须停）
```

## 阶段

### Stage 0 — 契约冻结 — **完成**

- [x] leftover 叶清单定稿：`change-hygiene` / `discovery-ledger` / `root-cause-repair` / `rule-capture`（恢复 5c 正文 + Authority→本叶）；`ssot-repair` → root-cause-repair；`installed-portability` → 本叶契约
- [x] `state.json` 字段 = `facet`；兼容窗口双写 `phase`；读者 `facet ?? phase`
- [x] dogfood 声明形状 = inventory `dogfood_from_repo_package_json` + `generation: dual_profile`（不双源）
- [x] 人类 Active（「开始」）

### Stage 1 — leftover AuthorityRef — **完成**

- [x] 抽检并改写 leftover 叶 AuthorityRef；恢复被 PLAN-0046 薄卡冲掉的 5c 权威正文
- [x] 路由图 Authority 路径保持指向 capabilities/*；表征测试通过
- [x] 未按 Gen1 目录骨架细切 / 未重开 Phase 5

### Stage 2 — FINDING-0029 — **完成**

- [x] lifecycle 生长禁令 + ADR-0022 三义可引用；FINDING-0029 Resolved
- [x] `state.json` phase→facet（双写兼容）
- [x] generator + sub-skills 模板 + SKILL 指针同步

### Stage 3 — FINDING-0028 dogfood — **完成**

- [x] dogfood 门禁测试（package.json 调用的 INSTALLED 必须 dual_profile + 声明）
- [x] check-doc-consistency / check-doc-freshness → dual_profile
- [x] `retire = ∅` 保持；未删脚本

### Stage 4 — 验证与闭包 — **完成**

- [x] Discovery Ledger Open=0（A0–A5 closed）
- [x] FINDING-0028 / 0029：Resolved
- [x] exit review → Implemented → Archived（Plan archive ≠ Release）
- [x] Roadmap / AGENTS 现在时 → 下一步 H2b

## 完成条件（outcome）

- [x] leftover Capability 叶 AuthorityRef 可解析且无「钉死在错误 lifecycle 坐标」的新增
- [x] FINDING-0029 辨析可引用；`state.json` 以 facet 为权威阶段维度（或兼容窗口有截止日期）
- [x] FINDING-0028：不可再靠猜测区分遗留/新建（inventory + dogfood 声明）；今日仍无 retire 删除义务
- [x] 未新建第三份能力去向表；未预标 retire；未跳进 H2b/c/d
- [x] 证据真实（表征测试 / 干净抽检），非宣称

## Discovery Ledger（Active 后维护；Design 预置）

| ID | 类型 | 问题 | 状态 | 处置 |
| --- | --- | --- | --- | --- |
| A0 | constraint | 不得重开 Phase 5 / 按 Gen1 骨架细切 | closed | observed |
| A1 | migration_gap | 5c leftover AuthorityRef 未收 | closed | resolved |
| A2 | architecture_gap | FINDING-0029 lifecycle 三义 + phase 坐标 | closed | resolved |
| A3 | architecture_gap | FINDING-0028 dogfood / dual_profile | closed | resolved |
| A4 | constraint | retire=∅；禁第三份去向表 | closed | observed |
| A5 | constraint | 未收 leftover 不得写进 H2c Control | closed | observed |

```text
Total known:  6
Resolved:     6  (A0–A5)
Open:         0
Unaccounted:  0
```

## 受影响文件（Active 后预期；Design 不预提交）

- `references/capabilities/*`（AuthorityRef / 指针）
- `references/policies/lifecycle.policy.md`（及 INSTALLED 投影）
- `.governance/state.json` 契约 · 相关模板/生成器
- `repo-tools/script-inventory.v0.json` · 本仓 `package.json` check 入口
- 表征测试（routing / inventory / state）
- `docs/findings/FINDING-0028-*` · `FINDING-0029-*`（关闭记录）
- `docs/plans/roadmap/{en,zh-CN,zh-TW}.md` · `AGENTS.md` · `CHANGELOG.md`（行为落地时）

## 参考

- ADR-0025 决策 5 / 10 / 14 · ADR-0024 · ADR-0022 · ADR-0020 · ADR-0018 决策 7
- PLAN-0040（5c EXITED；leftover 显式延后）· PLAN-0041（script-inventory L0）· PLAN-0046 Archived（H2-front）
- FINDING-0028 · FINDING-0029 · FINDING-0024（禁第三表）
- RESEARCH-0012 § 物理拓扑 · RESEARCH-0006（只消费）
