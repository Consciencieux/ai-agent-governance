---
id: PLAN-0055
status: Active
generation: gen2
target: both
---

# PLAN-0055：Gen1 carrier 重裁 — 吸收 / retire / 测试瘦身

**状态：** Active（2026-09-13；**裁决重开**：最小必要面学说，取代「引用图保活」。Stage 1R + Stage 3 首刀完成（已删 mutation-probe / changelog-narration）；下一步 consistency EXTRACT / Stage 4。）0053/0054 保持 Design。

**归属：** [ADR-0025](../design-decisions/ADR-0025-gen2x-product-path.md) 决策 10 / 15 —— 删除是最后一步；**唯一**去向权威 = [`script-inventory.v0.json`](../../repo-tools/script-inventory.v0.json)（禁第三份 ledger）。接续 [FINDING-0028](../findings/FINDING-0028-script-generation-disposition-gap.md) / [PLAN-0041](archive/PLAN-0041-script-inventory.md) 与 [PLAN-0052](archive/PLAN-0052-gen1-observation-sunset.md)。测试面遵守 [`references/policies/testing.policy.md`](../../references/policies/testing.policy.md) § 测试保护。

**问题（已对齐 · 重开）：** Gen1 是一套**自洽屎山**——门禁引用脚本、脚本互引、测试锁死引用。用「谁还在引用」裁决必然全员 keep，**看不见过度工程**。正确刀法：先冻结 **2.x 最小必要面**；名单外默认 `debt`；引用只决定**拆线顺序**，不授予生存权。

**不是：** 口径 C 无名单整夹删；用引用图证明「有用」；重开 H2b/H2c；hooks/L3 必装；第三份去向表；跳过 inventory 直接 `rm`。

## 一句话目标

冻结 must_ship ∪ product_cli ∪ repo_gate 短名单；名单外标 `debt`/`retire`；按依赖倒序拆线删除；测试按 Disposition 瘦身；`check:must-ship` 诚实绿。

## 裁决口径（2026-09-13 重钉 · 最小必要面）

| 层 | 判据 | 动作 |
| --- | --- | --- |
| **must_ship** | `check-must-ship-carriers.js` 列出的脚本载体 | 生存 |
| **product_cli** | `references/init-spec.json` 安装的 CLI（及支撑 lib/evaluator） | 生存（可标 monolith 债务，但不因「厚」直接删契约名） |
| **repo_gate** | `npm run check` + `check:must-ship` + release delivery 链上的 REPO-ONLY | 生存 |
| **debt** | 不在上述三集合 | 默认债务；引用无效；排队 extract/retire |
| **retire** | debt 且本轮选定拆除（无 2.x 最小职责） | inventory → 清引用 → 删文件 → 去条目 |

硬规则：引用图**禁止**单独导致 keep；删前 `disposition=retire`；INSTALLED 删除 = 载荷 breaking（须先改 INIT/契约）；`tests/` 另表。

### 冻结短名单（权威副本也在 `summary.short_lists`）

- **must_ship：** `scripts/check-secrets.js` · `check-git-policy.js` · `generate-governance.js` · `verify_governance.js` · `repo-tools/package-skill.sh`
- **product_cli：** INIT 安装的 `scripts/check-*` / `release-manager` / `migrate-governance` / `verify_*` 等（见 inventory）
- **repo_gate：** `npm run check` 闭包 + must-ship 机械 + `check-plan-delivery`（见 inventory）

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
| （全库 · Stage 1 旧结论） | — | **retire = ∅** | **已被 Stage 1R 作废** —— 见下方「最小必要面重裁」 |

> **Stage 1R 勘误：** 上表「retire=∅ / Stage 3 跳过」是引用中心主义产物，已作废。现行权威 = `necessity` + `summary.short_lists`；已删 mutation-probe / changelog-narration。

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

## Stage 1R — 最小必要面重裁 + Stage 3 首刀 — **完成**（2026-09-13）

人类否决「引用保活」后重裁：

| necessity | 约数 | 含义 |
| --- | --- | --- |
| must_ship | 5 | 必装载体 |
| product_cli | 19 | INIT/产品 CLI 及支撑 |
| repo_gate | 16 | 本仓最小门禁 |
| debt | 0（纠偏后） | 首轮误伤已升回 repo_gate；剩余过度工程主要在 **product_cli 内部 monolith**（如 consistency ~950LOC） |
| retire→deleted | 2 | 本轮已拆 |

**本轮已删：**

| 路径 | 理由 |
| --- | --- |
| `repo-tools/mutation-probe.js` | 仅 `mutation:probe`；Gen1 自证仪式；不在三短名单 |
| `repo-tools/check-changelog-narration.js` | 仅 `check:all` advisory；FINDING-0016 已证无效；不在三短名单 |

同步：去掉 `package.json` 脚本、narration suite、hygiene 探针表征、架构树/CONTRIBUTING 行；inventory 去条目。

**仍为 debt（未删）：** 无独立 debt 文件。过度工程主战场 = `product_cli` 内厚实现（尤其 `scripts/check-doc-consistency.js`）→ EXTRACT，不是先删 CLI 名。

**仍为 product 但 monolith 债务：** `scripts/check-doc-consistency.js`（~950LOC）— 保留 CLI 名，EXTRACT 另排，不在本刀物理删除。

## Stage 3 — Retire 执行

- [x] 首刀：mutation-probe + changelog-narration（见上）
- [ ] 继续：对 **product_cli monolith** 做 EXTRACT（先 consistency）；仅当 INIT 允许时缩 INSTALLED 面
- [ ] 无独立 `necessity=debt` 文件残留（纠偏后为 0）

## Stage 4 — 测试瘦身

- [ ] 按 Disposition 对 `prune-candidate` / `review` 删或并；门禁类留替代证据
- [ ] 全量 test + must-ship；Plan → Archived

## Discovery Ledger

| ID | 类型 | 问题 | 状态 | 处置 |
| --- | --- | --- | --- | --- |
| R0 | process | 双 Active | **resolved** | 0055 独占 |
| R1 | scope | 引用中心主义假 keep | **resolved** | 改最小必要面 |
| R2 | constraint | INSTALLED SemVer | **resolved** | product_cli 不因厚而删名 |
| R3 | tests | testing.policy | open | Stage 4 |
| R4 | inventory | summary 漂移 | **resolved** | total 跟 entries |
| R5 | finding | 零 retire 错觉 | **resolved** | 已删 2；debt 待拆 |
| R6 | absorb | dogfood INSTALLED | **resolved** | Stage 2 |
| R7 | debt | 文件级 debt / monolith | open | debt 文件=0；consistency EXTRACT 待排 |

```text
Total known:  8
Resolved:     6
Open:         2
Unaccounted:  0
```

## 参考

- ADR-0025 · FINDING-0028 · PLAN-0041 · PLAN-0052
- `repo-tools/script-inventory.v0.json` · `tests/suites/script-inventory.test.js`
- `references/policies/testing.policy.md` · `package.json` · `repo-tools/check-must-ship.sh`
