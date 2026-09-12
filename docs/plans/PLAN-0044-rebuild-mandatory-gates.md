---
id: PLAN-0044
status: Active
generation: gen2
target: both
---

# PLAN-0044：Phase 8 Rebuild mandatory gates

> **Status: Active**（P0 已批准并开工。前置：Phase 7 EXITED · [ADR-0024](../design-decisions/ADR-0024-gen2-product-freeze.md) Accepted。Architecture checkpoint ≠ Release；Phase 8 EXIT ≠ 2.0 skill-release；PLAN-0037 仍冻结。）

在新控制面约束下，**只把 ADR-0024 必装机械控制**的阻断权威交回 CI / release。动机权威：ADR-0018 决策 1 Phase 8 · ADR-0014 Migration Mode 退出前提 · ADR-0024 发布门槛「阻断」条。

## 目标

```text
Phase 7 EXITED + ADR-0024 可用性门槛
        ↓
必装机械控制 × 当前阻断路径台账（缺则显式 gap）
        ↓
定义 must-ship gate set（≠ 全量 Gen1 npm run check）
        ↓
CI / release 对该集合 fail-closed
        ↓
Migration Mode 退出清单可执行（实际退出可与 skill-release 同批）
        ↓
Phase 8 checkpoint EXITED → 2.0 skill-release 仍须干净目标证据
```

## 现状

| 观察 | 含义 |
| --- | --- |
| Migration CI | Safety Kernel（syntax + security/generator/payload）blocking；Gen1 `npm run check` observational |
| ADR-0024 | 禁止用 WRAP 载体清单当发布证据；必装控制须可阻断 |
| FINDING-0003 | 声明–机制差距；**仅必装控制**是 2.0 blocker |
| PLAN-0042 | 种子 oracle / 路由负向已有；未全部挂进 blocking CI |
| skill-release | 仍假设 Gen1 full gates；与 Migration Mode 冲突（ADR-0014） |

## 范围（In）

- **必装阻断台账**（施工权威）：`docs/research/working/must-ship-gates.md`（+ 可选机读 JSON）
- 每条 ADR-0024 must-ship **机械**能力 → 载体 → 当前权威（blocking / observational / none）→ Phase 8 目标
- **must-ship gate set**：npm script / CI job 只跑该集合；不把全部 observational Gen1 cluster 变红
- 接线：migration / 产品路径 CI；`repo-workflows/skill-release.md` 的前置检查对齐 must-ship set（薄改）
- Git consent **单一语义权威**指针检查（`git.policy.md`）；不实现机械 consent evaluator（later）
- Migration Mode **退出清单**成文（ADR-0014）；实际切主线/tag 仍属 skill-release 人类批准
- FINDING-0003：按必装阻断面推进；未覆盖的声明差距记 later / 豁免

## 非目标（Out）

```text
把 Gen1 npm run check 全量改成 migration 分支 blocking
CONTROL-X / 独立机器可读 Control 文件
L3 运行时拦截
FINDING-0006 全量 oracle
Active PLAN-0037 / 跨项目通用包
干净目标全量 dogfood 作为 Phase 8 Exit（那是 2.0 skill-release）
关闭全部 Confirmed Finding
consent 机械 evaluator
MIGRATE 独立入口
5c leftover / FINDING-0028 / 0029
重写全部 checker 为新 Control 模型
```

## 设计裁决（本计划冻结）

| # | 裁决 |
| --- | --- |
| D1 | **消费 ADR-0024**：只重建 must-ship 机械控制阻断；repo-keep / later 不挡 Phase 8 Exit |
| D2 | **gate set ≠ 全绿 Gen1**：观测化红可以保留在非必装面上；Mode 退出看必装 set + ADR-0014 条件 |
| D3 | **WRAP 可保留为实现**：但必须进入 fail-closed 路径；「文件存在」不算 |
| D4 | **Phase 8 EXIT ≠ 2.0**：干净目标 INIT/AUDIT/RELEASE 证据留给 skill-release |
| D5 | **切片可停**：P1 台账可单独合入；P2 接线；P3 Mode 退出清单 + Finding；P4 才标 EXITED |
| D6 | **PLAN-0037 仍冻结**；Phase 8 EXIT 不解冻 |

## 交付阶段

### P0 — Design 批准 → Active

- [x] 批准本 Design → `status: Active`
- [x] In/Out / D1–D6 与 ADR-0024 / ADR-0014 对齐
- [x] roadmap ×3 + AGENTS：Phase 8 = PLAN-0044 Active；Phase 7 EXITED

### P1 — 必装阻断台账

- [x] `docs/research/working/must-ship-gates.md`：must-ship 机械控制全表
- [x] 每行：能力 · 载体 · 当前 CI/release 权威 · 目标 · gap/ok
- [x] 明确「不进 set」的 Gen1 观测项（防偷渡变红）

### P2 — 接线 fail-closed

- [x] `package.json` 暴露 `check:must-ship` → `repo-tools/check-must-ship.sh`
- [x] `.github/workflows/ci.yml`：migration blocking job 调用 `npm run check:must-ship`（含 oracle-inventory + routing）
- [x] `repo-workflows/skill-release.md`：前置检查增加 `gates.must_ship`；注明 ≠ 全量 Gen1 observational 必须绿
- [ ] 表征或手工记录：故意破坏一条必装控制 → CI/脚本红（待补：security suite 本地仍有环境噪声，先记 O4）

### P3 — Mode 退出清单 + Finding

- [x] ADR-0014 退出条件对照表（已写入 `must-ship-gates.md`）
- [x] FINDING-0003：必装阻断面推进（解决情况已记；Finding 仍 Confirmed）
- [x] Git 单一权威：`AGENTS.md` / `SKILL.md` 仅指针+摘要；正文权威 = `references/policies/git.policy.md`（ADR-0024）

### P4 — Exit

- [ ] 台账无 must-ship `gap`（或书面豁免）
- [ ] CI + skill-release 路径对 must-ship set fail-closed
- [ ] roadmap ×3：Phase 8 Implemented / EXITED
- [ ] PLAN-0037 仍 Design 冻结；未宣称 2.0 已发布
- [ ] Ledger Open=0

## 完成条件（exit）

- [ ] P0–P4 完成
- [ ] 必装机械控制在 CI/release 有阻断权威（ADR-0024）
- [ ] 未把非 must-ship Gen1 全集强制变红
- [ ] 未 Active PLAN-0037；未打 2.0 tag
- [ ] 2.0 干净目标证据**不**作为本 checkpoint 必达（留给 skill-release）

## Discovery Ledger

| ID | 类型 | 来源 | 摘要 | 域 | 严重度 | 状态 | 处置 | 证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O0 | observation | ADR-0014 CI | Safety Kernel 已 blocking；全量 Gen1 观测 | repo | high | closed | resolved | must-ship-gates.md 台账 |
| O1 | observation | ADR-0024 | WRAP 清单 ≠ 可用/可阻断 | both | high | closed | resolved | check:must-ship + CI 接线 |
| O2 | observation | skill-release | 仍写 Gen1 full gates | repo | med | closed | resolved | gates.must_ship 行 |
| O3 | observation | FINDING-0003 | 声明–机制差距（必装面） | both | high | closed | resolved | FINDING-0003 解决情况 + must-ship set（Finding 仍 Confirmed） |
| O4 | observation | security suite | 本地 `check:must-ship` 在 security 段仍红（需与 CI 对照） | repo | high | open | — | P2 残留 |

## 闭包对账

```text
Total known:  5
Resolved:     4  (O0–O3)
Deferred:     0
Open:         1  (O4)
Unaccounted:  0
```

## Phase 8 Exit Criteria（checkpoint）

```text
Required:
□ must-ship 机械控制台账完整且 gap=0（或豁免）
□ CI / skill-release 对 must-ship set fail-closed
□ 非 must-ship Gen1 全集未被迫 blocking
□ PLAN-0037 仍冻结
□ 未宣称 2.0 skill-release 完成

Deferred by design / 2.0 skill-release:
- 干净目标 tarball INIT/AUDIT/RELEASE 跑通证据
- Migration Mode 正式退出后的 main 合入 / tag（人类批准）
- CONTROL-X / L3 / 全量 oracle / PLAN-0037
```

## Affected Files（预期）

- `docs/plans/PLAN-0044-rebuild-mandatory-gates.md`（本文件）
- `docs/research/working/must-ship-gates.md`（+ 可选 `.json`）
- `.github/workflows/ci.yml`
- `package.json`
- `repo-workflows/skill-release.md`
- `AGENTS.md` · `CHANGELOG.md` · `docs/plans/roadmap/{zh-CN,en,zh-TW}.md`
- 可选：`docs/findings/FINDING-0003-*.md` · `references/policies/git.policy.md` 指针对账
- 可选表征：`tests/suites/*` 仅当证明 must-ship set 破坏变红

## Successor

- **2.0 skill-release**（ADR-0024 可用性门槛：干净目标 + Mode 退出 + 本 Phase 阻断面）
- PLAN-0037 解冻（仅 2.0 发布之后）
- FINDING-0003 / 0007 / 0018 按发布门槛关闭或豁免
