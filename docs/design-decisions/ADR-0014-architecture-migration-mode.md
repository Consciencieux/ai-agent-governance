---
id: ADR-0014
status: Accepted
generation: gen2
---

# ADR-0014：架构迁移模式


## 背景

即将进入 Generation-1 → Generation-2 的大规模重构，改动面覆盖：repo / skill separation、rule ownership、directory structure、plan/findings model、test organization、checker responsibilities、dispatcher、policy representation、CI routing。

而现有 gate（`check-doc-consistency`、doc parity、layout sync、roadmap sync、role completeness、plan delivery、changelog narration、doc freshness，以及先跑完整 `npm test` 再叠加检查的 `check` / `check:docs` / `check:payload` / `check:tests`）验证的是 **Generation-1 architecture 的内部一致性**——「当前目录必须长这样、文档必须这样同步、role 必须这样分类、plan lifecycle 必须这样」。

如果重构期间继续要求「任何中间 commit 同时符合旧 schema 与新 schema」，会出现荒谬循环：为改旧架构 → 修改旧架构 → 旧 gate 报错 → 花时间让新设计暂时兼容旧架构 → 添加注定马上删除的 adapter/exception/regex → 继续改。最后为了让旧治理系统持续绿色，制造大量污染新架构的兼容代码。

## 决策

**1. 冻结旧治理体系的 blocking authority，而不是冻结所有反馈。**

大规模重构期间：
- legacy governance gates 是 **non-authoritative**（Generation-1 compatibility probes）：失败不阻断开发，但作为观测数据保留。
- 不「把 npm 和所有验证彻底关掉、最后一天一次性全开」，也不要求每个中间 commit 都符合旧 invariant。

**2. 保留一个最小的 Refactor Safety Kernel，只有四类：**

```text
1. 基础代码可执行性    JS syntax/load；明确修改模块的 targeted test
2. 安全底线            secret scanning；不把凭据提交进去
3. 不可逆操作安全      commit / push / tag / release 的人工授权；不做危险 Git 操作
4. 产品边界 characterization  generator 最基本还能运行；skill package 不意外包含 repo-only 内容；少量已知重大事故 regression
```

**3. 旧 gate 从 Blocking 改成 Observational。** 不删除。迁移期间偶尔跑一次 `npm run check`，`42 failures` 不代表「重构坏了」，而代表「新架构与 Generation-1 contract 有 42 个 divergence」——这是有价值的数据，用于后续分类：保留 / 替换 / 废弃。

**4. 不用 `npm test` / `npm run check` 作为每次修改后的默认动作。** 用现有 `--suite` 能力只跑相关 characterization（`--suite generator` / `payload` / `security`）。随重构推进可逐步建立 `tests/core/`、`tests/repo/`、`tests/skill/`、`tests/contracts/`，不强迫新代码适配旧 full runner。

**5. 用 architectural checkpoint，而不是 per-edit gate。** 验证频率从「一天几十次 full gate」降到「一个 architecture milestone 一次」：

```text
Baseline       旧架构完整测试一次，保存结果
Checkpoint A   Producer / Product separation 完成 → 相关 characterization tests
Checkpoint B   新目录和 ownership 完成 → packaging / references / contracts
Checkpoint C   Rule model 完成 → registry semantics
Checkpoint D   Dispatcher 完成 → routing / evidence
Checkpoint E   Migration 基本完成 → 第一次 broad regression
Release Candidate → 完整 regression + security + packaging + release gates
```

**6. 重构期间禁止正式 Release。** Migration mode 允许 `tests red / old gates red / docs temporarily inconsistent / directory transitional state`，但 **distribution boundary closed**：禁止正式 tag、GitHub Release、发布 skill tarball、宣称稳定。只有退出 migration mode（新架构 gates green、critical old regressions migrated、release characterization green）后才重新开放。

**7. 冻结规则演进。** 2.0 重构期间暂停给 1.x governance 增加新 policy/checker/cluster，除非是 security critical / data loss / release corruption / 无法继续重构的 blocker。否则一边拆 Generation-1，一边继续建设 Generation-1。

**8. 发现的问题按既有链路由：** 系统性/重复出现的 issue → `docs/findings/`（FINDING，L0–L4 分类）；架构决策 → ADR；具体任务 → Plan。不立即 `改 policy → 加 regex → 加 checker → 加 test → 加三语 docs`。

## 后续修正（2026-09-10）：架构 checkpoint ≠ Release

本修正是对决策 5、6 的 **Narrow amendment**，澄清阶段完成的标记方式。

**Phase / architecture checkpoint 不是 release boundary。** Phase 0–8 某一阶段完成（例如 Phase 2 Documentation Knowledge Architecture Closure）只产生：

```text
Plan → Completed → Archived（lifecycle closure 时物理移入 docs/plans/archive/；不等待 Release）
Roadmap Current Phase → 下一阶段
CHANGELOG [Unreleased] → checkpoint 对账整理
Git commit → 历史锚点（Research / Finding 可引用该 SHA）
```

**不产生** SemVer 版本号、`v*` Git tag、GitHub Release、skill tarball，也不宣称产品稳定。尤其禁止用 `v1.0.x` 描述 migration 分支上的 Gen2 文档/治理工作（会误读为 1.x 稳定 patch），也禁止在未退出 Migration Mode 前发 `v2.0.0` / `v2.0.0-alpha.*` 等任何正式或 prerelease tag——当前决策未授权「migration-only prerelease」例外。

**Plan archive ≠ Release。** 禁止正式发布**不**禁止把已完成 Plan 移入 `docs/plans/archive/`。归档是知识生命周期；Release 是分发生命周期（ADR-0016 / ADR-0019）。

**职责分离保持干净：**

```text
Git tag / SemVer / skill-release.md  = release boundary（distribution）
Plan archive / Roadmap / checkpoint commit   = architecture & knowledge lifecycle
```

`repo-workflows/skill-release.md` 要求 Gen1 full gates 全绿；Migration Mode 下旧 gate 可为 observational 红——二者逻辑冲突，正是决策 6 关闭 distribution boundary 的原因。正式 release 仅在 Phase 8 完成后、本 ADR 退出条件满足、新架构关键 gates 恢复 blocking authority 时，再做 release composition。

## 后续修正（2026-09-09）：第一代机械层冻结

本修正是对决策 1、3、4、7 的 **Narrow amendment**，用于明确迁移边界；它不删除或重定义现有 Gen1 capability。

在 Gen2 Phase 2–3 期间，Generation-1 mechanical implementations 是**冻结的迁移基底**（Frozen Gen1 Mechanical Substrate），是行为证据与 characterization specimen，不是 active architecture design surface。

**允许：**

- security / data-loss / release-corruption / migration-blocker 修复；
- 对现有行为增加 characterization；
- 观察和记录 compatibility divergence。

**禁止：**

- 在 Gen1 checker 或 generator 中编码新的 Gen2 semantics；
- 因单个 incident 持续追加 Gen1 checker / cluster；
- 提前进行 checker restructuring、抽象重构或机制迁移；
- 在没有明确 Gen2 disposition 与替代证据前删除 Gen1 capability。

Replacement / decomposition / retirement 的正式判断从 Phase 4 开始，逐项采用 `keep / wrap / extract / rewrite / retire` disposition，并以 RESEARCH-0006 的 capability baseline 与 invariant/characterization evidence 为输入。必要的 Safety Kernel 修复不构成提前进入 Phase 4。

## 后果

- 正面：避免为旧 gate 持续绿色而制造注定删除的兼容代码；重构速度与认知清晰度显著提升；full vs incremental validation 第一次有真实数据（科研测量框架 FINGING-0008 的第一个数据源）。
- 代价：旧 gate 在迁移期间不阻断，可能放过 Generation-1 内部的回归——由 Safety Kernel 的 characterization + checkpoint 兜底。
- 遗留风险：判断「哪些问题进 findings、哪些必须立即修」仍是人工的；migration mode 的进入/退出需要纪律（由本 ADR + 重构 Plan 约束，不额外造状态机）。

## 实施说明（2026-09-09，非决策性 note）

`.github/workflows/ci.yml` 曾按本决策落实**双模式 CI**，不再由 Gen1 gate 阻断 migration 分支：

- `main` / 1.x → `gen1-check`：`npm run check` 仍为 blocking（+ governance badge）。
- `migration/2.0-governance-architecture` → `migration-safety`（blocking，Refactor Safety Kernel：JS syntax + `--suite security/generator/payload`）+ `migration-legacy-observation`（`npm run check`，`continue-on-error`，仅作 observational compatibility probe）。

这是落实本决策的 Migration Mode 基础设施修正，非新增架构决策；不引入新的 Gen1 gate、checker 或 CI routing 框架。CI 的长期形态（Repo Profile / Dispatcher 路由）留待 Generation-2 另行决策。

## Mode 退出处置（2026-09-12，非决策性 note）

**状态：人类已批准退出（2026-09-12）。** 批准原文：「接受 must-ship 阻断 + Gen1 观测；批准合入 main；批准退出 Migration Mode。暂不批准 v2.0.0 tag。」提案：`docs/plans/mode-exit-proposal.md`。

**CI 落点（`.github/workflows/ci.yml`，随合入 `main` 生效）：**

| 面 | Job | 权威 |
| --- | --- | --- |
| 产品阻断 | `must-ship` → `npm run check:must-ship` | **blocking**（所有分支 / PR） |
| Gen1 兼容探针 | `gen1-observation` → `npm run check` | **observational**（`continue-on-error`） |

含义（对齐 ADR-0024）：产品分支阻断权威 = 必装机械集合；Gen1 全量红不再挡 merge，也**不**再被当作可发布状态。

**仍禁止（直至 skill-release Approval Gate）：** `v2.0.0` tag / GitHub Release / 宣称 2.0 已发布。其余人类项见 `docs/plans/skill-release-2.0-checklist.md`。

Migration Mode **已退出**；分发边界仍关闭，直到完成 skill-release。

## 参考

- 科研测量缺口：FINDING-0008（`docs/findings/FINDING-0008-governance-measurement-gap.md`）
- review 层级错位：FINDING-0014（`docs/findings/FINDING-0014-review-manager-layer-mismatch.md`）
- Finding 档案与知识对象五分类：ADR-0013
- Finding schema / taxonomy / 生命周期：`docs/findings/README.md`
