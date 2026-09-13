---
id: PLAN-0055
status: Design
generation: gen2
target: both
---

# PLAN-0055：Gen1 carrier 重裁 — 吸收 / retire / 测试瘦身

**状态：** Design（2026-09-13；人类选定口径 **B**：重裁全部 `gen1_carrier`；完全无 2.x 价值的标 `retire` 后删除；仍有用的重组吸收进 must-ship / WRAP·evaluator / 现有 REPO-ONLY 门禁；并瘦身 `tests/` 冗余用例）。升 Active 须人类明确改派。排队优先于 [PLAN-0053](PLAN-0053-v2.1.x-finding-patch-slice.md)。

**归属：** [ADR-0025](../design-decisions/ADR-0025-gen2x-product-path.md) 决策 10 / 15 —— 删除是最后一步；**唯一**去向权威 = [`script-inventory.v0.json`](../../repo-tools/script-inventory.v0.json)（禁第三份 ledger）。接续 [FINDING-0028](../findings/FINDING-0028-script-generation-disposition-gap.md) / [PLAN-0041](archive/PLAN-0041-script-inventory.md)「`retire` 非空才删」与 [PLAN-0052](archive/PLAN-0052-gen1-observation-sunset.md)（CI 观测已 sunset；脚本层 `retire` 仍为空）。测试面遵守 [`references/policies/testing.policy.md`](../../references/policies/testing.policy.md) § 测试保护（删测须理由 + 替代 + 覆盖率影响）。

**问题（已对齐）：** 「1.0 过度工程」今天多数仍标 `keep`/`wrap`——不是「看起来像旧就删」，而是用更严的 **2.x 产品价值** 重裁：无独立价值 → `retire`→清引用→删；有价值但形态臃肿 → `wrap`/`extract`/`rewrite` 吸收，再考虑薄化旧壳。测试约 **400+** `test()`（19 suite / ~7k 行），存在重复门禁表征与迁徙期夹具，需与脚本裁决同批记账，禁止无台账乱删。

**不是：** 凡 `gen1_carrier` 一律物理删除（口径 C）；只删零引用孤儿（口径 A）；重开 H2b/H2c 大施工；把 hooks/L3 升必装；新建第二份能力去向表；跳过 inventory 直接 `rm`。

## 一句话目标

按 B 口径重裁 inventory 中全部 `gen1_carrier`（及必要的 dogfood dual_profile），产出可执行的 **absorb / keep / retire** 表；对 `retire` 走替代→验证→观察→删除；对仍有用者吸收进现有 2.x 面；并对 `tests/suites` 做有证据的冗余裁剪，使 `check:must-ship` 与本地 `check` 仍诚实绿。

## 裁决口径（Stage 0 钉死；升 Active 不得改宽）

对每个 `gen1_carrier`（及 Stage 0 点名的 dual_profile / wrap）只许落入一格：

| 裁决 | 判据 | 动作 |
| --- | --- | --- |
| **retire** | 无独立 2.x 产品/本仓价值：能力已被 must-ship、CTRL evaluator、或另一 keep 入口完整覆盖；或仅服务已 sunset 的观测/迁徙夹具 | 先改 inventory → 清 package.json/CI/AGENTS/INIT/docs/tests 引用 → 短观察（本仓 dogfood）→ 删文件 → summary 更新 |
| **absorb**（处置仍 `wrap`/`extract`/`rewrite`，路径可暂留） | 仍有价值，但逻辑应并入已有 evaluator / REPO-ONLY gate / must-ship 链 | 迁语义 → 旧 CLI 变薄壳或改调用 → 表征跟上；**不**假标 retire |
| **keep** | 仍是 INSTALLED/SKILL-INTERNAL/REPO-ONLY 产品入口，且无更优单一主人 | 保留；写清「为何不是过度工程」一行证据 |

硬规则：

1. **`unchanged-since-baseline ≠ retire`**（inventory rules）——必须有覆盖/无价值论证。
2. **删文件前 `disposition` 必须已是 `retire`**，且引用图清零。
3. **INSTALLED 路径删除 = 载荷行为变更** → CHANGELOG + 参考闭包；若破坏已发布契约，须 SemVer/兼容说明（默认 patch 仅当 CLI 名保留为薄委托）。
4. **`tests/` 不进 script-inventory** —— 另建本 Plan 内 **Test Disposition 表**（suite×用例簇），删测遵循 testing.policy。

## 验收面

1. 全部 `gen1_carrier`（今日 16）在 Plan 裁决表有终态；inventory `summary.retire` 与条目一致；`summary.total` 与磁盘对账。
2. 每个 `retire`：无残留引用；文件已删或显式隔离窗已关闭并删除。
3. 每个 `absorb`：有替代入口 + 至少一条表征证明旧行为未静默丢失（或有意收窄并记 CHANGELOG）。
4. Test Disposition：列出删除/合并的用例簇 + 理由 + 替代；`npm test` 与 `npm run check:must-ship` exit 0。
5. 禁：无表批量删；把 Gen1 本地 `npm run check` 重新打进 CI block；第三份去向 ledger。

## 阶段

### Stage 0 — 契约与引用图（升 Active 时先做）

- [ ] 冻结本 Plan 为 Active；0053/0054 保持 Design
- [ ] 生成引用图：每个 inventory 路径 ← `package.json` scripts / `check-must-ship.sh` / INIT·init-spec / AGENTS / CI / `tests/**` / 其他脚本 `require`
- [ ] 列出 16×`gen1_carrier` + dogfood 两条 dual_profile WRAP 的初裁草稿（不写盘删）
- [ ] 测试基线：`node tests/run-tests.js --list` + 每 suite 用例计数；标出疑似冗余簇（重复 gate 镜像、已删产品路径、迁徙期-only）
- [ ] Discovery Ledger 清零口径

### Stage 1 — 裁决落盘（只改台账与 Plan 表，不删）

- [ ] 逐项写入 Plan 裁决表 + 更新 `script-inventory.v0.json`（`retire` / `wrap` / `keep` / 必要时 `extract`·`rewrite`）
- [ ] 刷新 inventory `summary.*`（含今日总数字漂移）
- [ ] Test Disposition 表 v1（先标记，不删测）
- [ ] `node tests/run-tests.js --suite script-inventory` 绿

### Stage 2 — 吸收（有用者重组）

- [ ] 按裁决表执行 absorb：语义迁入 evaluator / 现有 REPO-ONLY / must-ship；旧壳变 WRAP 或改 npm 脚本指向
- [ ] 更新表征；CHANGELOG（若行为/入口变）
- [ ] `check:must-ship` + 受影响 `npm test --suite …` 绿

### Stage 3 — Retire 执行（完全废弃者）

- [ ] 对每个 `retire`：清引用 →（可选短观察：本地 check 一次）→ 删文件
- [ ] packaging / role-completeness / layout 若受影响一并修
- [ ] inventory 去条目或保留 tombstone 策略按表征夹具现约（默认：删条目 + 磁盘不存在）

### Stage 4 — 测试瘦身

- [ ] 按 Test Disposition 删除/合并空洞或重复用例；禁止「看起来多就删」
- [ ] 对门禁类删除：留下负向/变异证据或指向仍覆盖同一事实源的保留用例
- [ ] 全量 `npm test` + `check:must-ship` 绿；Plan → Archived（≠ Release）

## 初裁提示（非最终；Stage 1 可改）

| 路径 | 今日 | 初裁倾向 | 备注 |
| --- | --- | --- | --- |
| `scripts/check-secrets.js` | wrap | absorb/keep 壳 | 已有 evaluator；勿假 retire |
| `scripts/check-doc-consistency.js` / `check-doc-freshness.js` | wrap dual | absorb（dogfood） | 本仓改调 REPO-ONLY profile 属吸收，不是删产品 CLI |
| `scripts/verify_governance.js` / `generate-governance.js` / `release-manager.js` | keep | keep 或 thin | 产品入口；默认不 retire |
| `scripts/check-{lock,git-policy,plan-sync,sync}.js` | keep | 逐项 | INSTALLED；有替代才 retire |
| `repo-tools/check-{parity,layout,hygiene,role-completeness,…}.js` | keep | 对照 must-ship | 已在 must-ship/check 链上的默认 keep；仅重复探针可 retire |
| `repo-tools/mutation-probe.js` | keep | 易 retire 候选 | 若仅迁徙/观测夹具 |
| `tests/suites/{consistency,docs,payload,security,generator}.test.js` | — | 瘦身优先 | 体量最大；按簇裁，不整文件砍 |

## Discovery Ledger

| ID | 类型 | 问题 | 状态 | 处置 |
| --- | --- | --- | --- | --- |
| R0 | process | 不得与其他 Plan 双 Active | open | 升 Active 时独占 |
| R1 | scope | 16 carrier 终裁未钉 | open | Stage 1 |
| R2 | constraint | INSTALLED 删除的 SemVer/兼容 | open | Stage 0 分类 |
| R3 | tests | 删测须满足 testing.policy | open | Stage 4 |
| R4 | inventory | summary.total 与 entries 可能漂移 | open | Stage 1 对账 |

```text
Total known:  5
Resolved:     0
Open:         5
Unaccounted:  0
```

## 参考

- ADR-0025 决策 10/15 · FINDING-0028 · PLAN-0041 · PLAN-0052
- `repo-tools/script-inventory.v0.json` · `tests/suites/script-inventory.test.js`
- `references/policies/testing.policy.md` · `package.json` `check` / `check:must-ship`
- 排队关系：本带优先于 PLAN-0053；PLAN-0054 仍远
