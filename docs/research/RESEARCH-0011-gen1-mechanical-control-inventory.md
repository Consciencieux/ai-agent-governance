---
id: RESEARCH-0011
status: Active
version: 4
subject_generation: gen1
---

# RESEARCH-0011：Gen1 机械控制库存（CTRL-centric）

本 RESEARCH 是 **Phase 4 事实库存（inventory）**：按 **CTRL identity**（不是 `scripts/` 文件名）记录 Generation-1 当前机械面。它回答「这条 Control 现在靠什么实现、挂在哪条门禁、测什么、哪个 profile」。

Gen1→Gen2 **如何共存与吸收** 的演化模型见 RESEARCH-0004 v3；本文件不重复。

**不**裁决 KEEP / WRAP / EXTRACT / REWRITE / RETIRE（执行 disposition → PLAN-0035）。  
**不**实现 Dispatcher（Phase 5 EXITED）。  
**不**在本文件建设 invariant oracle 体系——施工计划 = [PLAN-0042](../plans/PLAN-0042-invariant-based-testing.md)（**Implemented / EXITED**）。  
覆盖台账：`docs/research/working/oracle-inventory.v0.json`。  
规范 Control 模型 → ADR-0023；本文件只描述现状。

行形态：

```text
Control
→ current evaluator(s)
→ gate / enforcement boundary
→ tests
→ profile
→ characterization anchors
→ notes（耦合 / 共文件 / interim semantics）
```

## 种子 Control（ADR-0023 vertical slices）

### CTRL-0001 Secret protection

| 字段 | 现状 |
| --- | --- |
| semantics_ref | interim：模式表住在 `scripts/lib/secret-scan-facts.js`（JS ≠ 长期语义家） |
| evaluator(s) | `scripts/evaluators/ctrl-0001-secret-protection.js`；skill CLI `scripts/check-secrets.js` WRAP；**repo CLI** `repo-tools/check-secrets.js` WRAP |
| enforcement_boundary | skill：local/pre-commit 手册调用；repo：`AGENTS.md` → `repo-tools/check-secrets.js` |
| decision_effect | 命中 / unscanned / git error → deny（exit 1）；`--json`；不回显秘密 |
| tests | `tests/suites/security.test.js`（`check-secrets:*` + direct CTRL-0001 + repo/skill CLI parity） |
| profile | skill INSTALLED + **repo-owned CLI**（P3：accidental same-file coupling 已消） |
| characterization | staged fake secret fail；binary/`-diff` 仍扫；clean exit 0；placeholder vs real；generated project passes；repo≠skill CLI path |
| 候选 disposition（非权威） | PLAN-0035：**P3 CLOSED** |


### CTRL-0002 Git write consent

| 字段 | 现状 |
| --- | --- |
| semantics_ref | `references/policies/git.policy.md` § 确认范围（权威）；`AGENTS.md` § Git Operation Safety Protocol = 投影/双写残留 |
| evaluator(s) | （1）`scripts/check-doc-consistency.js` **consent-cluster**（#8）：同步点 marker 扫描；（2）`scripts/release-manager.js` consent / proposal 绑定；（3）大量路径仍为 Agent 遵守（`none`） |
| enforcement_boundary | `--gate` 下 consent_cluster fail-closed；release-manager 写路径；协议路径无单一 JS exit |
| decision_effect | 缺 marker → gate deny；无确认则不得执行所覆盖写序列（L0 为主） |
| tests | `tests/suites/consistency.test.js`（consent / gate 相关）；release-manager 套件 |
| profile | repo + skill（shared semantic；implementation 分散） |
| characterization | 现有点必须含同一 marker 集合；缺文件点 skip；plan approval ≠ commit consent |
| 候选 disposition | 见 PLAN-0035 § Disposition |


### CTRL-0003 Governance-document freshness（相对代码活动）

| 字段 | 现状 |
| --- | --- |
| semantics_ref | interim：`scripts/evaluators/ctrl-0003-doc-freshness.js`（30/90 天与 CODE_DIRS 政策） |
| evaluator(s) | `scripts/evaluators/ctrl-0003-doc-freshness.js`；CLI 入口仍为 `scripts/check-doc-freshness.js`（薄 WRAP） |
| enforcement_boundary | `npm run check:all` / `check:repo-release` 调用（默认 **advisory**，exit 0） |
| decision_effect | stale → warn/advisory；不得称为 blocking |
| tests | `tests/suites/docs.test.js`：`doc freshness: stale/fresh/very stale/drift-report` |
| profile | repo 直接跑 INSTALLED 脚本（repo→skill accidental）；skill 安装同脚本给被治理项目 |
| characterization | git 日期非 mtime；30/90 天阈值；drift-report.freshness 段；共享 `scripts/lib/git-facts.js` |
| 候选 disposition | PLAN-0035 § Disposition；**第一条 vertical 已落地（P7 resolved）** |


### CTRL-0004 Translation freshness

| 字段 | 现状 |
| --- | --- |
| semantics_ref | interim：`scripts/evaluators/ctrl-0004-translation-freshness.js`（译文/draft/review + release-gate） |
| evaluator(s) | `scripts/evaluators/ctrl-0004-translation-freshness.js`；CLI 仍经 `scripts/check-doc-freshness.js` WRAP |
| enforcement_boundary | `npm run check:skill-release` → `check-doc-freshness.js --release-gate` |
| decision_effect | `--release-gate` → deny（stale/draft translation） |
| tests | `tests/suites/docs.test.js`：`translation freshness:*`（含 release-gate 子例） |
| profile | 本仓库 repo；skill 侧当目标有对等译文树 |
| characterization | source after translation → stale；synchronized commit OK；uncommitted rules；bogus review SHA fail-closed；共享 `scripts/lib/git-facts.js` |
| 候选 disposition | PLAN-0035 § Disposition；与 0003 **分 evaluator**（已落地） |


### CTRL-0005 Plan delivery

| 字段 | 现状 |
| --- | --- |
| semantics_ref | interim：`repo-tools/check-plan-delivery.js` 头注释 + plans/lifecycle 格式 |
| evaluator(s) | `repo-tools/check-plan-delivery.js`（REPO-ONLY） |
| enforcement_boundary | `npm run plans:delivery` / `check:all` / `check:skill-release` → `--gate` |
| decision_effect | 默认可 advisory；`--gate` → deny |
| tests | `tests/suites/plan-delivery.test.js`（整套） |
| profile | **repo-only** |
| characterization | Affected Files H2–H4；多 section；writes/wires；SEARCH_ROOTS 含 repo-tools；design-only skip |
| 候选 disposition | 见 PLAN-0035 § Disposition；第三批 |


### CTRL-0006 Relative markdown link validity（consistency cluster #4）

| 字段 | 现状 |
| --- | --- |
| semantics_ref | `references/policies/lifecycle.policy.md` § 相对 Markdown 链接有效性 |
| evaluator(s) | `scripts/evaluators/ctrl-0006-broken-links.js`；consistency shell 仍 WRAP 调用 |
| enforcement_boundary | `check-doc-consistency.js` 默认/任何模式均 **advisory**（不进 `--gate` fail-closed） |
| decision_effect | 本 CLI 绑定 = advisory；verdict fail ≠ process deny |
| tests | `tests/suites/consistency.test.js`：wrapper + **direct** `evaluateBrokenLinks`（missing→fail / valid→pass / `--gate` 不 deny） |
| profile | skill INSTALLED；repo 直接跑同一 WRAP |
| characterization | `f -> target`；跳过 `https?://` / `mailto:`（大小写不敏感）；**无** root-containment；无链接 = vacuous pass / always applicable；scan set 含 README/SKILL/AGENTS + docs/{en,zh-CN,zh-TW} + design-decisions/archive + references/ |
| 候选 disposition | PLAN-0035：**#4 CLOSED**；SKIP #9 |

## 共文件反例（Phase 4 纪律）→ 0003/0004 已拆 evaluator

```text
# Gen1（inventory 时）→ 一个文件装两条 Control
scripts/check-doc-freshness.js
        ├── CTRL-0003  (default advisory)
        └── CTRL-0004  (--release-gate deny)

# 第一条 vertical 后（仍共享 CLI 入口，分 evaluator + 共享 primitive）
scripts/lib/git-facts.js                 # shared factual primitives（无政策）
scripts/evaluators/ctrl-0003-…js         # CTRL-0003
scripts/evaluators/ctrl-0004-…js         # CTRL-0004
scripts/check-doc-freshness.js           # 薄 WRAP（CLI 不变）

scripts/check-doc-consistency.js
        ├── consent-cluster     → CTRL-0002（部分）
        ├── 其余 cluster        → 尚未分配 CTRL（见下表）
        └── terminology (#12)   → 已 EXTRACT → repo-tools/check-terminology.js
```

**主键是 Control，不是文件。** Disposition 不得写成整文件一句 `REWRITE`。

## Monolith 集群库存（`check-doc-consistency.js`，~961 行）

尚未批量发 CTRL 编号（避免 Markdown 规则大爆炸）。每行 = 机械能力候选；EXTRACT 时再分配 `CTRL-0006+`。

| Cluster # | 名称 | Gate 形态 | 主要测试面 | 备注 |
| --- | --- | --- | --- | --- |
| 1 | version-example / release sync points | `--gate` fail-closed | consistency suite | package.json / CHANGELOG / SKILL frontmatter / init-spec / generator |
| 2 | protected-files sync | `--gate` | payload / consistency | 读 governance-files 权威表 |
| 3 | ADR status sync | 报告；部分 gate | consistency | Unreleased vs 已发布 |
| 4 | broken links | 报告（advisory） | consistency | **CTRL-0006 EXTRACT 已落地**；shell WRAP |
| 5 | numeric claims | 报告 | consistency | 文档数字 vs 源 |
| 6 | prompt sync | `--gate` | consistency / docs | ADR-0008；双向 |
| 7 | trilingual parity | 委托 | docs:parity | → `repo-tools/check-doc-parity.js` |
| 8 | consent-cluster | `--gate` | consistency | **属 CTRL-0002** |
| 9 | principles-index pointers | `--gate` | consistency | AGENTS 索引路径存在 |
| 10 | plan-status / pending-archive | unknown=`--gate`；pending=`--release-gate` | consistency | Gen1 pending-archive 语义 vs ADR-0016 归档触发 = known divergence |
| 11 | changelog coverage | `--release-gate`（结构缺陷可 gate） | consistency | Unreleased 覆盖 |
| 12 | terminology | **已 EXTRACT** | `repo-tools/check-terminology.js` | ADR-0020 先例 |

## 其他机械面（本库存未赋 CTRL）

| 机制 | 路径 | 为何暂不编号 |
| --- | --- | --- |
| terminology gate | `repo-tools/check-terminology.js` | 已分离；赋 CTRL 可在 disposition 时做 |
| coding hygiene | `repo-tools/check-coding-hygiene.js` | repo-only；待 inventory 扩面 |
| role completeness | `repo-tools/check-role-completeness.js` | 同上 |
| roadmap sync | `repo-tools/check-roadmap-sync.js` | 同上 |
| layout sync | `repo-tools/check-layout-sync.js` | 同上 |
| doc parity | `repo-tools/check-doc-parity.js` | cluster 7 委托 |
| git-policy | `scripts/check-git-policy.js` | skill INSTALLED；扩面时再 CTRL |
| multi-agent lock | `scripts/check-lock.js` | skill INSTALLED；无独立 Plan；RESEARCH-0006 v6 已入压缩层 |
| sync groups | `scripts/check-sync.js` | skill INSTALLED；PLAN-0008/0010 |
| governance validator | `scripts/verify_governance.js` → INSTALLED `verify-governance.js` | skill INSTALLED；Pre-PLAN 产品面 |
| **plan/milestone sync** | **`scripts/check-plan-sync.js`** | **skill INSTALLED；`--release-gate` 可阻断；≠ CTRL-0005 plan-delivery（repo-only）；v3 显式补录（v2 漏）** |
| release-manager | `scripts/release-manager.js` | 部分支撑 CTRL-0002；整机非单 CTRL |
| freshness shared primitive | `scripts/lib/git-facts.js` | 被 CTRL-0003/0004 共享；非 Control |
| freshness evaluators | `scripts/evaluators/ctrl-0003-*.js` / `ctrl-0004-*.js` | 已挂 CTRL-0003/0004 |
| link facts primitive | `scripts/lib/md-link-facts.js` | 被 CTRL-0006 共享；非 Control |
| broken-links evaluator | `scripts/evaluators/ctrl-0006-broken-links.js` | **CTRL-0006**（consistency #4） |

### INSTALLED scripts ↔ inventory 闭合（v3）

与 RESEARCH-0006 v6 反向清单对齐。`init-spec` 当前 `scripts/` copy set 必须全部出现在上表或种子 Control 行：

```text
verify-governance.js     ✓ validator
check-lock.js            ✓ multi-agent lock
check-git-policy.js      ✓ git-policy
check-secrets.js         ✓ CTRL-0001 skill CLI WRAP
lib/secret-scan-facts.js ✓ shared secret facts
evaluators/ctrl-0001…    ✓ CTRL-0001
repo-tools/check-secrets.js ✓ CTRL-0001 repo CLI（REPO-ONLY）
check-sync.js            ✓ sync groups
check-doc-freshness.js   ✓ CTRL-0003/0004 CLI WRAP
lib/git-facts.js         ✓ shared primitive
evaluators/ctrl-0003…    ✓ CTRL-0003
evaluators/ctrl-0004…    ✓ CTRL-0004
check-doc-consistency.js ✓ monolith WRAP（#4 → CTRL-0006）
lib/md-link-facts.js         ✓ shared link primitive
evaluators/ctrl-0006…        ✓ CTRL-0006
check-plan-sync.js       ✓ plan/milestone sync（本版补录）
release-manager.js       ✓ release executor
```

闭合结果：INSTALLED scripts 面 `Unaccounted = 0`。

## Characterization 冻结锚点（Safety Kernel）

Migration CI blocking（ADR-0014）：

```text
node tests/run-tests.js --suite security   ← 含 CTRL-0001
node tests/run-tests.js --suite generator
node tests/run-tests.js --suite payload
```

**基线快照（2026-09-10，本机全权限；沙箱 git 不可用时 security 会假红）：**

```text
security   35/35 passed
generator  33/33 passed
payload    42/42 passed
```

种子 Control 重构前后必须保持同 fixture 同 verdict 的最小锚点：

| Control | 最小锚点套件 / 测试前缀 |
| --- | --- |
| CTRL-0001 | `--suite security` / `check-secrets:` |
| CTRL-0003/0004 | `tests/suites/docs.test.js` freshness* |
| CTRL-0005 | `tests/suites/plan-delivery.test.js` |
| CTRL-0002（cluster） | consistency consent / gate 相关例 |

完整 positive/negative oracle 矩阵 → [PLAN-0042](../plans/PLAN-0042-invariant-based-testing.md)（Phase 6 Implemented / EXITED；种子集台账已落地，全量矩阵仍延后）；本库存只保留 characterization 锚点。

## repo → skill 调用面（P3 输入）

| 调用 | 脚本角色 | 与 CTRL |
| --- | --- | --- |
| AGENTS 预提交 → `repo-tools/check-secrets.js` | REPO-ONLY CLI | CTRL-0001 repo binding（P3；不再 accidental 调 skill CLI） |
| `npm run check*` → `scripts/check-doc-consistency.js` | INSTALLED | monolith；含 CTRL-0002 cluster |
| `check:all` / release → `scripts/check-doc-freshness.js` | INSTALLED | CTRL-0003/0004 |
| `plans:delivery` → `repo-tools/check-plan-delivery.js` | REPO-ONLY | CTRL-0005（无 skill 耦合） |
| `check` → `repo-tools/check-terminology.js` | REPO-ONLY | 已解耦先例 |

## 对 PLAN-0035 的影响

1. P1 的事实源 = 本文件；Plan 只记 disposition 与施工顺序。  
2. 下一步 B：用上表 characterization 锚点跑基线，再 C disposition。  
3. 拆 `check-doc-consistency.js` 时按 **cluster 行** disposition，禁止整文件 REWRITE。  
4. 新 CTRL 编号仅在 EXTRACT 出独立机械能力时分配。

## 参考

- ADR-0023 · RESEARCH-0010 · PLAN-0035  
- FINDING-0019（monolith）· FINDING-0001（coupling）  
- ADR-0014 Safety Kernel · ADR-0020 terminology EXTRACT 先例  
- Phase 6 oracle：[PLAN-0042](../plans/PLAN-0042-invariant-based-testing.md)  
