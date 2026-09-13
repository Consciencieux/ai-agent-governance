---
id: PLAN-0055
status: Active
generation: gen2
target: both
---

# PLAN-0055：Gen1 carrier 重裁 — 吸收 / retire / 测试瘦身

**状态：** Active（2026-09-13；**裁决重开**：最小必要面学说。Stage 1R+3 完成；Stage 4 假绿修复 + 初剪完成；**Stage 4Q live 测重建完成**（Gen1 suites 曾封存后**已删**）；**Stage 3/4S 脚本 EXTRACT 完成**；**脚本 + 测 monolith/suite 封存均已删除**（缺功能/缺测按现行义务重写，不回捞）。0053/0054 Design。）

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

### 1.2 Test Disposition v2（Stage 4 执行表 · 2026-09-13 刷新）

基线（Stage 4 前）：约 **396** `test()` / **18** suite（`narration` 已随 Stage 3 删除）。Stage 4A/B 本轮已删约 **37**；全量（非沙箱）**359/359**（含 hygiene SHA liveness 纠偏）。

| suite | 标记 | 备注 |
| --- | --- | --- |
| consistency | **pruned** | 已删 parity 双跑/次候选、consent 组合矩阵多余项、changelog 空白仪式；保留五同步点 1 pass + 1 fail + 双语 + mid-sequence |
| docs | **pruned** | 已删 legacy 不扫、package.json/CI 串钉群；保留 skill-release 一钉 |
| payload | **pruned** | 已删 plan-delivery SEARCH_ROOTS 镜像 |
| security | **pruned** | 已压 pattern 目录；保留 fail-closed 核心；validator 碎测已迁出 |
| generator | **pruned** | 已删 governance-lessons 子串 |
| validator / hygiene | **pruned** | 可选 `--help` / SHA liveness 纠偏 |
| h2d-portability | **pruned** | 已删 existsSync 载体钉 |
| routing / release / plan-delivery / sync / h2b / h2c / script-inventory / oracle / principles / instruction-surface | **keep** | |

> **已删除行（相对 v1）：** `narration` suite。**不再**把 hygiene 绑到 mutation-probe keep。

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
| repo_gate | 16+ | 本仓最小门禁 |
| debt | 0（纠偏后） | consistency/generate 已 EXTRACT；monolith 封存已删；残留 = verify/release 厚活体（动则重写/正规 EXTRACT） |
| retire→deleted | 2 | mutation-probe + changelog-narration |

## Stage 3 — Retire / EXTRACT

- [x] 首刀：mutation-probe + changelog-narration
- [x] **product_cli / must_ship monolith EXTRACT（Stage 3/4S）：**
  - `scripts/check-doc-consistency.js` → 薄 CLI + `scripts/lib/doc-consistency/run.js`（INIT copy）
  - `scripts/generate-governance.js` → 薄 CLI + `scripts/lib/generate/run.js`（skillInternal）
  - Gen1 厚实现曾封存于 `tests/archive/gen1-script-impl/` → **已删**（2026-09-13；git 历史可查；缺功能按现行义务重写，禁止回捞）
  - `verify_governance` / `release-manager` / lock / sync：活体未拆；需要动时正规 EXTRACT/重写，不恢复 monolith
- [x] 无独立 `necessity=debt` 文件残留
- [ ] 可选后续：consistency `run.js` 按 cluster 再切；verify 若要 EXTRACT 须先改 INIT 闭包契约

## Stage 4 — 通裁：测瘦身 + Script Health — **完成（含 4Q）**

**施工边界：** 删/并测 + 统一 ledger + **已证实假绿路径修复**；随后 **4Q 测封存重建** + **4S 脚本封存/EXTRACT**（consistency/generate）。

### 4Q 封存重建（2026-09-13）

人类否决「只砍几十个不够」后执行：

1. **曾封存后已删：** 全部原 `tests/suites/*.test.js`（约 **512** `test()`）曾入 `tests/archive/gen1-suites/` → **已删**（2026-09-13；与脚本 monolith 同裁决；git 历史可查）。
2. **重建判据：** `necessity` 短名单（must_ship ∪ product_cli ∪ repo_gate）+ **脚本**首次引入 commit（非测试文件出生）+ `testing.policy` 负例活性。
3. **Live 面（≈50）：** `security` · `generator` · `payload` · `repo-gates` · `routing` · `script-inventory` · `oracle-inventory`。`check:must-ship` 已改挂这些 suite。
4. **禁止**从 git 历史整夹回灌 Gen1 suites；只允许按现行义务新写最短负例。

### 4.0 事实源学说

权威：[`references/policies/testing.policy.md`](../../references/policies/testing.policy.md) § 测试活性 + 事实源规定。

裁决链：用途 → 事实源（`references/` / SKILL / init-spec / must-ship / inventory / CTRL）→ 活性负例 → 与门禁/更短负例去重。

**重组默认：** **禁止**把 parity / terminology / layout / roadmap / role **合并回** consistency（FINDING-0019）。干净 = **正交主人 + 去双跑 + 修路径 + EXTRACT 厚实现**。

### 4.1 Script Health Disposition

| 脚本 / 面 | 问题 | reorg | 本轮动作 |
| --- | --- | --- | --- |
| `scripts/check-doc-consistency.js` · prompt_sync | 读 `docs/{lang}/commands.md`；本仓在 `docs/product/` → 空转 | **fix_path** | **已做**：优先 `docs/product/{lang}/commands.md` |
| 同上 · `mdFiles()` | product 树不可见 | **fix_path** | **已做**：扫描 `docs/product/{lang}/` |
| 同上 · parity spawn | 与 `docs:parity` 双跑 | **drop_dup_invoke** | **已做**：`parity: "delegated"` |
| `repo-tools/check-layout-sync.js` | 只认 `docs/{lang}/architecture.md` → 本仓 always N/A | **fix_path** | **已做**：优先 `docs/product/`；basename 提取修；架构树补全 |
| freshness CTRL-0004 | 路径偏 legacy | ledger | 排队（低成本可点状） |
| consistency monolith | ~950LOC accretion | **extract** | **已做**（薄 CLI + `lib/doc-consistency/run.js`；monolith 封存） |

脚本层终裁：`keep_cli` 全部现有 `check-*` / generate 名；**extract** consistency+generate **已做**；无新 absorb/retire。

### 4.2 状态检查表

- [x] Disposition v2 + Script Health 表落盘
- [x] **fix_path** layout-sync + prompt_sync + mdFiles
- [x] **drop_dup_invoke** parity 嵌入 spawn
- [x] Stage 4A/B 高信心删/并（约 −37）
- [x] 全量 test（非沙箱）+ `check:must-ship` 绿
- [x] inventory `notes` 补 `health=` / `reorg=`（本提交收尾）
- [x] CHANGELOG + 三语 roadmap 指针
- [ ] **不**归档 PLAN-0055（可选 cluster 再切 / verify EXTRACT 仍 open；非阻塞）

## Discovery Ledger

| ID | 类型 | 问题 | 状态 | 处置 |
| --- | --- | --- | --- | --- |
| R0 | process | 双 Active | **resolved** | 0055 独占 |
| R1 | scope | 引用中心主义假 keep | **resolved** | 改最小必要面 |
| R2 | constraint | INSTALLED SemVer | **resolved** | product_cli 不因厚而删名 |
| R3 | tests | testing.policy 活性/事实源 | **resolved** | Stage 4A/B + Disposition v2 + CHANGELOG；残留 = 持续克制非本 Plan 阻塞 |
| R4 | inventory | summary 漂移 | **resolved** | total 跟 entries |
| R5 | finding | 零 retire 错觉 | **resolved** | 已删 2；debt 待拆 |
| R6 | absorb | dogfood INSTALLED | **resolved** | Stage 2 |
| R7 | debt | consistency monolith EXTRACT | **resolved** | Stage 3/4S：薄 CLI + lib；monolith 封存已删（不回捞） |
| R8 | defect | 假绿路径（prompt_sync / layout-sync；parity 双跑） | **resolved** | Stage 4 fix_path + drop_dup_invoke |

```text
Total known:  9
Resolved:     9
Open:         0
Unaccounted:  0
```

## 参考

- ADR-0025 · FINDING-0028 · PLAN-0041 · PLAN-0052
- `repo-tools/script-inventory.v0.json` · `tests/suites/script-inventory.test.js`
- `references/policies/testing.policy.md` · `package.json` · `repo-tools/check-must-ship.sh`
