# ADR-0014: Architecture Migration Mode——2.0 重构期间旧 gate 的降级策略

- 状态：Accepted
- 代际：gen2
- 日期：2026-09-08

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

## 后果

- 正面：避免为旧 gate 持续绿色而制造注定删除的兼容代码；重构速度与认知清晰度显著提升；full vs incremental validation 第一次有真实数据（科研测量框架 FINGING-0008 的第一个数据源）。
- 代价：旧 gate 在迁移期间不阻断，可能放过 Generation-1 内部的回归——由 Safety Kernel 的 characterization + checkpoint 兜底。
- 遗留风险：判断「哪些问题进 findings、哪些必须立即修」仍是人工的；migration mode 的进入/退出需要纪律（由本 ADR + 重构 Plan 约束，不额外造状态机）。

## 参考

- 科研测量缺口：FINDING-0008（`docs/findings/FINDING-0008-governance-measurement-gap.md`）
- review 层级错位：FINDING-0014（`docs/findings/FINDING-0014-review-manager-layer-mismatch.md`）
- Finding 档案与知识对象五分类：ADR-0013
- Finding schema / taxonomy / 生命周期：`docs/findings/README.md`
