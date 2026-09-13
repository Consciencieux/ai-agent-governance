---
id: PLAN-0055
status: Active
generation: gen2
target: both
---

# PLAN-0055：Gen1 carrier 重裁 — 吸收 / retire / 测试瘦身

**状态：** Active（2026-09-13；口径 **B**。Stage 0–2 完成；Stage 3 跳过（retire=∅）；下一步 Stage 4 测试瘦身。）0053/0054 保持 Design。

**归属：** [ADR-0025](../design-decisions/ADR-0025-gen2x-product-path.md) 决策 10 / 15 —— 删除是最后一步；**唯一**去向权威 = [`script-inventory.v0.json`](../../repo-tools/script-inventory.v0.json)（禁第三份 ledger）。接续 [FINDING-0028](../findings/FINDING-0028-script-generation-disposition-gap.md) / [PLAN-0041](archive/PLAN-0041-script-inventory.md) 与 [PLAN-0052](archive/PLAN-0052-gen1-observation-sunset.md)。测试面遵守 [`references/policies/testing.policy.md`](../../references/policies/testing.policy.md) § 测试保护。

**问题（已对齐）：** 用更严的 **2.x 产品价值** 重裁全部 `gen1_carrier`（及必要 dogfood dual_profile）：无独立价值 → `retire`→清引用→删；有价值但臃肿 → absorb（`wrap`/`extract`/`rewrite`）；并瘦身 `tests/` 冗余用例。

**不是：** 口径 C 整夹删；口径 A 只删零引用；重开 H2b/H2c；hooks/L3 必装；第三份去向表；跳过 inventory 直接 `rm`。

## 一句话目标

按 B 产出 **absorb / keep / retire** 表并执行；测试按 Test Disposition 有证据裁剪；`check:must-ship` 与本地 `check` 诚实绿。

## 裁决口径（已钉死；不得改宽）

| 裁决 | 判据 | 动作 |
| --- | --- | --- |
| **retire** | 无独立 2.x 价值：已被 must-ship / CTRL evaluator / 另一 keep 入口完整覆盖；或仅服务已 sunset 观测/迁徙夹具 | inventory → 清引用 → 短观察 → 删 |
| **absorb** | 仍有价值，逻辑应并入 evaluator / REPO-ONLY / must-ship | 迁语义；旧 CLI 薄壳；**不**假标 retire |
| **keep** | 仍是产品/本仓入口且无更优单一主人 | 保留 + 一行证据 |

硬规则：`unchanged-since-baseline ≠ retire`；删前 disposition=`retire` 且引用清零；INSTALLED 删除 = 载荷变更；`tests/` 另表。

## 验收面

1. 16×`gen1_carrier` 终态入表；inventory `summary.total` 与 `entries.length` 对账（Stage 1 已修：**44 = 44**）。
2. 每个 `retire` 无残留引用且已删。
3. 每个 `absorb` 有替代 + 表征。
4. Test Disposition + `npm test` + `npm run check:must-ship` exit 0。
5. 禁无表批量删；禁 Gen1 `check` 重回 CI block；禁第三 ledger。

---

## Stage 0 — 契约与引用图 — **完成**（2026-09-13）

- [x] 本 Plan → Active；0053/0054 Design
- [x] 引用图（下表；机械扫描 `package.json` / `check-must-ship.sh` / must-ship-carriers / INIT / AGENTS / tests / require）
- [x] 16×carrier + 2×dogfood WRAP 初裁草稿（**不删**）
- [x] 测试基线
- [x] Discovery Ledger 更新

### 0.1 引用图（焦点集）

图例：`check*` = 出现在对应 npm script；`must` = must-ship 载体或脚本正文引用。

| 路径 | gen / disp / role | npm | must-ship | 主要其他引用 |
| --- | --- | --- | --- | --- |
| `repo-tools/check-changelog-narration.js` | gen1 / keep / REPO-ONLY | `check:all` | n | narration / h2d tests |
| `repo-tools/check-coding-hygiene.js` | gen1 / keep / REPO-ONLY | `check`, `check:payload`, `check:tests`, `check:repo-release` | n | hygiene / docs tests |
| `repo-tools/check-doc-parity.js` | gen1 / keep / REPO-ONLY | `docs:parity` | n | consistency / docs tests |
| `repo-tools/check-layout-sync.js` | gen1 / keep / REPO-ONLY | `docs:layout` | n | helpers；lifecycle policy |
| `repo-tools/check-plan-delivery.js` | gen1 / keep / REPO-ONLY | `plans:delivery`, skill/repo-release | n | plan-delivery tests |
| `repo-tools/check-role-completeness.js` | gen1 / keep / REPO-ONLY | `check`, `check:payload` | n | payload / docs tests |
| `repo-tools/mutation-probe.js` | gen1 / keep / REPO-ONLY | `mutation:probe` **only** | n | hygiene 表征（探针自身） |
| `repo-tools/package-skill.sh` | gen1 / keep / REPO-ONLY | （无 npm 直调） | **Y**（carriers） | packaging / role-completeness |
| `scripts/check-git-policy.js` | gen1 / keep / INSTALLED | — | **Y** | INIT / verify_governance / validator |
| `scripts/check-lock.js` | gen1 / keep / INSTALLED | — | n | INIT / sync / h2d / payload |
| `scripts/check-plan-sync.js` | gen1 / keep / INSTALLED | — | n | INIT / payload / release workflow |
| `scripts/check-secrets.js` | gen1 / **wrap** / INSTALLED | — | **Y** | CTRL-0001 evaluator；repo-tools profile |
| `scripts/check-sync.js` | gen1 / keep / INSTALLED | — | n | INIT / sync tests / verify |
| `scripts/generate-governance.js` | gen1 / keep / SKILL-INTERNAL | — | **Y** | INIT / generator / consistency |
| `scripts/release-manager.js` | gen1 / keep / INSTALLED | — | n | INIT / release tests |
| `scripts/verify_governance.js` | gen1 / keep / INSTALLED | — | **Y** | INIT / plan-delivery / consistency |
| `scripts/check-doc-consistency.js` | dual / **wrap** / INSTALLED | `check`, `check:docs`, `check:payload`, skill-release | n | **dogfood**；CTRL clusters |
| `scripts/check-doc-freshness.js` | dual / **wrap** / INSTALLED | `check:all`, skill/repo-release | n | **dogfood**；CTRL-0003/0004 |

### 0.2 初裁草稿（Stage 1 可改；**今日零 retire**）

| 路径 | 草稿裁决 | 理由（一行） |
| --- | --- | --- |
| `scripts/check-secrets.js` | **absorb**（保留薄 WRAP） | 语义在 evaluator / repo profile；CLI 名仍是产品面 |
| `scripts/check-doc-consistency.js` | **absorb**（dogfood） | 本仓 `check` 应改调 REPO-ONLY 等价面；INSTALLED CLI 保留给目标仓 |
| `scripts/check-doc-freshness.js` | **absorb**（dogfood） | 同上 |
| `repo-tools/check-coding-hygiene.js` | **keep** | 本地 `check` 链主人；非 must-ship ≠ 无价值 |
| `repo-tools/check-doc-parity.js` | **keep** | `docs:parity` 主人 |
| `repo-tools/check-layout-sync.js` | **keep** | `docs:layout` 主人 |
| `repo-tools/check-role-completeness.js` | **keep** | `check` / payload 链 |
| `repo-tools/check-plan-delivery.js` | **keep** | release / plans:delivery |
| `repo-tools/check-changelog-narration.js` | **keep** | `check:all` 叙述门禁；Stage 1 再审是否并入别簇 |
| `repo-tools/mutation-probe.js` | **keep**（纠正「易 retire」） | 按需断言活性工具，**不是**已 sunset 观测夹具；不在 gate 链 ≠ 无 2.x 价值 |
| `repo-tools/package-skill.sh` | **keep** | must-ship 打包载体 |
| `scripts/check-git-policy.js` | **keep** | INSTALLED + must-ship |
| `scripts/check-lock.js` | **keep** | INSTALLED 产品（锁语义） |
| `scripts/check-plan-sync.js` | **keep** | INSTALLED 产品 |
| `scripts/check-sync.js` | **keep** | INSTALLED 产品 |
| `scripts/generate-governance.js` | **keep** | SKILL-INTERNAL + must-ship |
| `scripts/release-manager.js` | **keep** | INSTALLED 发布执行器 |
| `scripts/verify_governance.js` | **keep** | INSTALLED + must-ship |

**Stage 0 结论：** 口径 B 下 **尚无合格 `retire`**。下一刀是 **absorb 三条 WRAP/dogfood**（Stage 1–2），不是批量删 `scripts/`。任何新 `retire` 必须在 Stage 1 写出「被谁完整覆盖」证据。

### 0.3 测试基线（2026-09-13）

`node tests/run-tests.js --list` → 19 suite。`test(` 注册约 **409**；约 **7.1k** 行。

| suite | ~tests | ~lines | Stage 0 嫌疑 |
| --- | --- | --- | --- |
| consistency | 73 | 1089 | 与 docs / payload 门禁镜像重叠 — 瘦身优先 |
| docs | 56 | 777 | 同上 |
| payload | 43 | 957 | 大；含迁徙期路径断言 — 逐簇审 |
| security | 39 | 616 | 保留负向；禁空洞删 |
| generator | 34 | 452 | 对照 must-ship generator |
| validator | 26 | 379 | |
| hygiene | 21 | 280 | 含 mutation-probe 表征 — 与探针 keep 绑定 |
| routing | 19 | 382 | gen2；默认 keep |
| release | 18 | 295 | |
| plan-delivery | 15 | 203 | |
| h2d-portability | 14 | 239 | |
| sync | 11 | 208 | |
| narration | 9 | 74 | |
| h2b-checkers | 7 | 82 | |
| instruction-surface | 6 | 169 | |
| script-inventory | 6 | 142 | 本 Plan 护栏；不可当冗余删 |
| h2c-controls | 4 | 50 | |
| oracle-inventory | 4 | 121 | must-ship |
| principles-extraction | 4 | 183 | |

Test Disposition 表 → Stage 1 落盘（先标记不删）。

### 0.4 INSTALLED 删除风险分类（R2）

| 类 | 路径 | SemVer 含义 |
| --- | --- | --- |
| A 薄 WRAP 可吸收 | check-secrets / check-doc-* | 默认可 patch（保留 CLI 名） |
| B 产品入口 | lock / git-policy / plan-sync / sync / release-manager / verify / generate | 删 = breaking；默认 **不** retire |
| C 仅本仓 | 全部 repo-tools gen1 | 无载荷 SemVer；仍须清引用 |

---

## Stage 1 — 裁决落盘 — **完成**（2026-09-13）

- [x] 终裁写入 §1.1 + 更新 [`script-inventory.v0.json`](../../repo-tools/script-inventory.v0.json)（`summary.total=44`；`summary.adjudication`；notes）
- [x] Test Disposition v1（§1.2；**仅标记，不删测**）
- [x] `node tests/run-tests.js --suite script-inventory` 绿（含 `summary.total` 对账表征）

### 1.1 终裁表（disposition 落盘结果）

| 路径 | disposition | PLAN 裁决 | Stage 2+ |
| --- | --- | --- | --- |
| `scripts/check-secrets.js` | **wrap**（保持） | **absorb** | 可薄壳；语义已在 evaluator |
| `scripts/check-doc-consistency.js` | **wrap**（保持） | **absorb**（dogfood） | 本仓 `check*` 改调 REPO-ONLY 等价 |
| `scripts/check-doc-freshness.js` | **wrap**（保持） | **absorb**（dogfood） | 本仓 `check:all`/release 改调 REPO-ONLY 等价 |
| 其余 13×`gen1_carrier` | **keep** | **keep** | 无删除；见各条 `notes` |
| （全库） | — | **retire = ∅** | Stage 3 **跳过**直至新证据重裁 |

`summary.adjudication`（inventory）：`plan=PLAN-0055`, `stage=1`, `absorb=[3 wraps]`, `retire=[]`。

### 1.2 Test Disposition v1（标记；Stage 4 执行）

| suite | ~n | 标记 | 备注 |
| --- | --- | --- | --- |
| consistency | 73 | **prune-candidate** | 与 docs/payload 门禁镜像重叠优先审 |
| docs | 56 | **prune-candidate** | 同上 |
| payload | 43 | **review** | 大；迁徙期路径断言逐簇 |
| security | 39 | **keep** | 负向必留；禁空洞删 |
| generator | 34 | **keep** | 对齐 must-ship generator |
| validator | 26 | **keep** | |
| hygiene | 21 | **keep** | 含 mutation-probe 表征，与 keep 绑定 |
| routing | 19 | **keep** | gen2 |
| release | 18 | **keep** | |
| plan-delivery | 15 | **keep** | |
| h2d-portability | 14 | **keep** | |
| sync | 11 | **keep** | |
| narration | 9 | **review** | 对照 changelog-narration keep |
| h2b-checkers | 7 | **keep** | |
| instruction-surface | 6 | **keep** | |
| script-inventory | 6→7 | **keep** | 本 Plan 护栏（已加 summary 对账） |
| h2c-controls | 4 | **keep** | |
| oracle-inventory | 4 | **keep** | must-ship |
| principles-extraction | 4 | **keep** | |

## Stage 2 — 吸收 — **完成**（2026-09-13）

- [x] dogfood：本仓 `package.json` `check*` / release 链改调 `repo-tools/check-doc-consistency.js` 与 `repo-tools/check-doc-freshness.js`
- [x] AGENTS 诚实门禁指针改 REPO-ONLY profile
- [x] secrets：确认 `scripts/check-secrets.js` 已是薄 WRAP；本仓继续用 `repo-tools/check-secrets.js`（无 package.json dogfood）
- [x] CTRL-0003/0004/0006 repo binding CLI → `repo-tools/` 双 profile 入口
- [x] inventory：新增 2×REPO-ONLY CLI；INSTALLED wrap `dogfood_*=false`；`summary.dogfood_installed_from_repo=[]`
- [x] `script-inventory` 表征绿；`check:must-ship` 绿

**未做（有意）：** 不删 INSTALLED CLI 名；不把共享 `main()` 从 `scripts/` 搬走（薄委托 = absorb，不是 rewrite）。

## Stage 3 — Retire 执行

- [ ] **本轮跳过**（`retire=[]`）；仅当未来重裁出现非空 `retire`
- [ ] 清引用 → 观察 → 删

## Stage 4 — 测试瘦身

- [ ] 按 Disposition 对 `prune-candidate` / `review` 删或并；门禁类留替代证据
- [ ] 全量 test + must-ship；Plan → Archived

## Discovery Ledger

| ID | 类型 | 问题 | 状态 | 处置 |
| --- | --- | --- | --- | --- |
| R0 | process | 双 Active | **resolved** | 0055 独占 Active |
| R1 | scope | 16 carrier 终裁 | **resolved** | §1.1；retire∅；absorb=3；keep=13 |
| R2 | constraint | INSTALLED SemVer | **resolved** | §0.4；B 类默认不删 |
| R3 | tests | testing.policy | open | Stage 4；v1 已标记 |
| R4 | inventory | summary.total 漂移 | **resolved** | 46=46（Stage 2 +2 REPO-ONLY CLI） |
| R5 | finding | 零 retire | **resolved** | B≠批量删；Stage 2 吸收已执行 |
| R6 | absorb | dogfood 仍调 INSTALLED | **resolved** | package.json / AGENTS 已迁 repo-tools |

```text
Total known:  7
Resolved:     6
Open:         1
Unaccounted:  0
```

## 参考

- ADR-0025 · FINDING-0028 · PLAN-0041 · PLAN-0052
- `repo-tools/script-inventory.v0.json` · `tests/suites/script-inventory.test.js`
- `references/policies/testing.policy.md` · `package.json` · `repo-tools/check-must-ship.sh`
