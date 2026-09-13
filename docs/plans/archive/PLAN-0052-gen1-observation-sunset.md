---
id: PLAN-0052
status: Archived
generation: gen2
target: repo-infra
---

# PLAN-0052：Gen1 观测门禁 sunset（替代 → 验证 → 观察 → 删除）

**状态：** Archived（2026-09-13；Stage 0–2 完成；退出路径 4a = 删除 CI `gen1-observation`；脚本未删。Plan archive ≠ Release）。

**归属：** [ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md) 决策 10 / 15 —— 删除是最后一步；消费 [`script-inventory.v0.json`](../../../repo-tools/script-inventory.v0.json)，**禁止**预标整夹 `retire`、禁止无裁决批量删 `scripts/` / `repo-tools/`。[FINDING-0028](../../findings/FINDING-0028-script-generation-disposition-gap.md) 已 Resolved（L0 台账）；本计划兑现其「仅当 inventory 非空 `retire` 才隔离/删除」余句。

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

### Stage 0 — 契约冻结 — **完成**（2026-09-13）

- [x] 固定验收五条 + Out（见上；本 Stage 不改契约）
- [x] 枚举 `package.json` `check` 链与 CI `gen1-observation` 实际调用面（下表）
- [x] 与 inventory 对账：`retire = []`；观测面 ∩ gen1_carrier / wrap 已标出

#### Stage 0 产物：观测面枚举

**CI job `gen1-observation`**（`continue-on-error: true`）实际跑：

1. `npm run check`（见下链）
2. `node scripts/verify_governance.js --json`（失败被 `|| true` 吞掉；只服务 badge artifact）

**阻断 job `must-ship`**：`npm run check:must-ship` → `repo-tools/check-must-ship.sh`（**不**跑全量 Gen1 `check`）。本 Plan 不改其阻断地位。

**`npm run check` 展开**（`package.json`）与 inventory 对账：

| # | 入口 | inventory | generation | disposition | 备注 |
| --- | --- | --- | --- | --- | --- |
| 0 | `npm test` → `tests/run-tests.js` | **范围外**（`tests/**` 不进 inventory） | — | — | Stage 1 不经由 inventory `retire`；观测面附属 |
| 1 | `repo-tools/check-doc-parity.js` | yes | gen1_carrier | keep | |
| 2 | `repo-tools/check-layout-sync.js` | yes | gen1_carrier | keep | |
| 3 | `scripts/check-doc-consistency.js` | yes | dual_profile | wrap | dogfood INSTALLED |
| 4 | `repo-tools/check-terminology.js` | yes | gen2_native | keep | |
| 5 | `repo-tools/check-coding-hygiene.js` | yes | gen1_carrier | keep | |
| 6 | `repo-tools/check-role-completeness.js` | yes | gen1_carrier | keep | |
| 7 | `repo-tools/check-roadmap-sync.js` | yes | gen2_native | rewrite | |
| 8 | `repo-tools/check-docs-shape.js` | yes | gen2_native | keep | |
| 9 | `repo-tools/check-discovery-ledger.js` | yes | gen2_native | keep | |
| 10 | `repo-tools/check-metadata-projection.js` | yes | gen2_native | keep | |
| 11 | `repo-tools/check-control-registry.js` | yes | gen2_native | keep | |
| 12 | `repo-tools/check-template-responsibility.js` | yes | gen2_native | keep | |
| 13 | `repo-tools/run-control-x.js` | yes | gen2_native | keep | |
| CI+ | `scripts/verify_governance.js` | yes | gen1_carrier | keep | INSTALLED；仅观测 job 附加 |

**Inventory 快照（Stage 0 时点）：** total 37 · keep 33 · wrap 3 · rewrite 1 · **retire 0** · gen1_carrier 16 · gen2_native 18 · dual_profile 3。

**wrap 三条：** `scripts/check-doc-consistency.js`（**在**观测面）、`scripts/check-doc-freshness.js`（**不在** `npm run check`；在 `check:all` / freshness 路径）、`scripts/check-secrets.js`（**不在** `npm run check`）。

**Stage 0 结论（喂给 Stage 1，不是裁决）：**

1. 今日 **无人可删**：`retire = ∅` → Stage 1 若要删，必须先改 inventory。
2. 观测面 =「全量 `check` + verify_governance badge」，不是「仅 gen1_carrier 列表」；多数 check 节点已是 gen2_native keep。
3. Stage 1 裁决对象优先：观测面内 **gen1_carrier keep**（parity / layout / hygiene / role-completeness / verify_governance）+ **wrap**（doc-consistency）；其余 gen1_carrier 若不在观测面，不挡 sunset 退出声明 4a/4b，可另表 keep。
4. 扩展脚本 `check:skill-release` / `check:all` **不是** CI `gen1-observation` 调用面；Stage 1 默认不扩 scope，除非发现它们被误当成观测义务。

### Stage 1 — 逐项裁决 — **完成**（2026-09-13）

- [x] 每条观测面入口 → keep / wrap / retire（禁止「看起来像 1.0 就删」）
- [x] wrap：写明 Gen2 替代与何时可薄化
- [x] retire：本带 **零条目**（inventory `retire` 仍为空；不删脚本）

#### Stage 1 产物：裁决表

| # | 入口 | 裁决 | 理由 | 替代 / 薄化条件 |
| --- | --- | --- | --- | --- |
| 0 | `tests/run-tests.js`（`npm test`） | **keep**（附属） | 测试入口；不在 inventory scope | 不经 `retire` 删除 |
| 1 | `repo-tools/check-doc-parity.js` | **keep** | 仍为 REPO-ONLY 三语文档对等门禁；must-ship 未覆盖 | — |
| 2 | `repo-tools/check-layout-sync.js` | **keep** | 仍为 REPO-ONLY 布局同步门禁 | — |
| 3 | `scripts/check-doc-consistency.js` | **wrap**（维持） | 已 dual_profile WRAP；repo dogfood + INSTALLED | 语义在 consistency clusters / EXTRACT 路径；薄化属后续 H2 余债，**本带不薄化** |
| 4 | `repo-tools/check-terminology.js` | **keep** | gen2_native；ADR-0020 术语门 | — |
| 5 | `repo-tools/check-coding-hygiene.js` | **keep** | REPO-ONLY 卫生门；本地/观测仍有用 | — |
| 6 | `repo-tools/check-role-completeness.js` | **keep** | REPO-ONLY 角色完备；打包边界仍依赖 | — |
| 7 | `repo-tools/check-roadmap-sync.js` | **keep**（rewrite 维持） | gen2 rewrite 后仍为 roadmap 权威门 | — |
| 8–13 | docs-shape / discovery / metadata / control-registry / template-responsibility / run-control-x | **keep** | 均为 gen2_native 现行门禁 | — |
| CI+ | `scripts/verify_governance.js` | **keep** | INSTALLED 校验器；badge 可读，但 **不必占 CI 观测 job** | 本地/被治理项目仍可跑；CI badge 步骤随 4a 去掉 |

**范围外注明（R5）：** `check-doc-freshness.js` / `check-secrets.js` 为 wrap 但不在 CI 观测面 → 本带 **不裁决、不删**。

**Stage 1 结论 → Stage 2 退出路径：**

- 脚本层：**无 retire** → 不删、不隔离任何 inventory 文件。
- CI 层：全量 `npm run check` 作为非阻断 CI job **已无产品价值**（阻断权威 = must-ship；本地仍可 `npm run check`）。选定验收 **4a**：删除 `gen1-observation` job，文档写明观测已 sunset；**不**走 4b（永久探针）。

### Stage 2 — 执行 sunset — **完成**（2026-09-13）

- [x] retire 脚本：无（跳过观察窗）
- [x] 删除 CI `gen1-observation` job + 更新 CI 注释（4a）
- [x] CHANGELOG + roadmap + AGENTS；Plan → Archived

## Discovery Ledger

| ID | 类型 | 问题 | 状态 | 处置 |
| --- | --- | --- | --- | --- |
| R0 | constraint | 禁无 inventory `retire` 批量删 | resolved | Stage 1 零 retire；未删脚本 |
| R1 | constraint | 禁升 Gen1 check 为 CI 阻断 | resolved | Stage 2 未升阻断；仅删观测 job |
| R2 | process | 观测 job 退出条件须显式 | resolved | 4a：删除 gen1-observation；本地 npm run check 仍可用 |
| R3 | inventory | `retire = ∅` | resolved | Stage 1 确认；不删文件 |
| R4 | scope | `tests/run-tests.js` 附属 keep | resolved | 裁决 keep（附属） |
| R5 | scope | freshness/secrets 不在观测面 | resolved | 本带不裁决 |

```text
Total known:  6
Resolved:     6
Open:         0
Unaccounted:  0
```

## 参考

- ADR-0025 决策 10 / 15 · FINDING-0028 · `repo-tools/script-inventory.v0.json` · `.github/workflows/ci.yml`
- 排队：Design [PLAN-0053](../PLAN-0053-v2.1.x-finding-patch-slice.md) · Design [PLAN-0054](../PLAN-0054-h3-runtime-research-design.md)
