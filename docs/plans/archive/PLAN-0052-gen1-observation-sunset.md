---
id: PLAN-0052
status: Active
generation: gen2
target: repo-infra
---

# PLAN-0052：Gen1 观测门禁 sunset（替代 → 验证 → 观察 → 删除）

**状态：** Active（2026-09-13；人类选「1」= 近端施工。前置：`v2.1.0` 已发；H2 / PLAN-0051 Archived）。

**归属：** [ADR-0025](../design-decisions/ADR-0025-gen2x-product-path.md) 决策 10 / 15 —— 删除是最后一步；消费 [`script-inventory.v0.json`](../../repo-tools/script-inventory.v0.json)，**禁止**预标整夹 `retire`、禁止无裁决批量删 `scripts/` / `repo-tools/`。[FINDING-0028](../findings/FINDING-0028-script-generation-disposition-gap.md) 已 Resolved（L0 台账）；本计划兑现其「仅当 inventory 非空 `retire` 才隔离/删除」余句。

**问题（已对齐）：** CI 阻断权威已是 `check:must-ship`，但 Gen1 `npm run check` 仍以 `continue-on-error` 观测跑全量。观测 ≠ 废弃；若不逐项裁决，会误删仍 keep/wrap 的载体，或让观测探针无限期堆成本。

**不是：** 把 Gen1 check 升回 CI 阻断；H3 / L3；一次 `rm -rf` 清 Gen1；第三份能力去向表；把本计划当成一次 SemVer 发布。

## 一句话目标

按 inventory **逐项**裁决 Gen1 观测面：该 keep 的留下、该 wrap 的写清替代、仅对已标 `retire` 的条目停引用并隔离/删除——使「观测探针」有退出条件，而不是默许永久双轨。

## 验收面（In）

1. **裁决表（本 Plan 内或 inventory 字段）**：每个仍被 `npm run check` / `gen1-observation` CI job 拉起的入口，有 `keep | wrap | retire` + 理由 + 替代（若 retire/wrap）。
2. **`retire` 非空才允许删**：任何删除/停用须先出现在 `script-inventory.v0.json` 的 `retire`（或等价 disposition），且引用清零（package.json / CI / AGENTS / tests）。
3. **CI 契约不变糟**：`must-ship` 仍为唯一阻断；不得在本 Plan 内把 Gen1 全量改回 blocking。
4. **退出声明**：要么 (a) `gen1-observation` job 删除且文档写明「观测已 sunset」；要么 (b) 显式保留为 **永久兼容探针** 并缩小到已裁决 keep 集合（不得继续跑未裁决的巨型 check）。
5. **`npm run check:must-ship` exit 0**（本带每次可合并切片）。

## 非验收（Out）

- 关闭 FINDING-0003/0007 等 Confirmed 全文（→ PLAN-0053）
- H3 runtime / 测量（→ PLAN-0054 Design）
- 无替代的脚本物理删除
- 升 Gen1 check 为 CI 阻断

## 阶段

### Stage 0 — 契约冻结 — **进行中**

- [ ] 固定验收五条 + Out
- [ ] 枚举 `package.json` `check` 链与 CI `gen1-observation` 实际调用面
- [ ] 与 inventory `by_disposition` / `gen1_carrier` 对账（今日 `retire = ∅`）

### Stage 1 — 逐项裁决

- [ ] 每条入口 → keep / wrap / retire（禁止「看起来像 1.0 就删」）
- [ ] wrap：写明 Gen2 替代与何时可薄化
- [ ] retire：写入 inventory，列引用清零清单

### Stage 2 — 执行 sunset

- [ ] 仅对 retire：停引用 → 观察窗（本 Plan 约定）→ 隔离或删除
- [ ] 收敛或移除 CI `gen1-observation`（满足验收 4a 或 4b）
- [ ] CHANGELOG + roadmap 同步；Plan → Archived

## Discovery Ledger

| ID | 类型 | 问题 | 状态 | 处置 |
| --- | --- | --- | --- | --- |
| R0 | constraint | 禁无 inventory `retire` 批量删 | open | Stage 1–2 |
| R1 | constraint | 禁升 Gen1 check 为 CI 阻断 | open | observe |
| R2 | process | 观测 job 退出条件须显式（删或缩 keep 集） | open | Stage 2 |
| R3 | inventory | 今日 `retire = ∅`；删除前必须先标 | open | Stage 1 |

```text
Total known:  4
Resolved:     0
Open:         4
Unaccounted:  0
```

## 参考

- ADR-0025 决策 10 / 15 · FINDING-0028 · `repo-tools/script-inventory.v0.json` · `.github/workflows/ci.yml`
- 排队：Design [PLAN-0053](PLAN-0053-v2.1.x-finding-patch-slice.md) · Design [PLAN-0054](PLAN-0054-h3-runtime-research-design.md)
