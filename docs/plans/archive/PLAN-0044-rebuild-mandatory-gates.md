---
id: PLAN-0044
status: Archived
generation: gen2
target: both
---

# PLAN-0044：Phase 8 Rebuild mandatory gates

> （已归档。Phase checkpoint EXITED；按 ADR-0016 于 lifecycle closure 移入 archive。Plan archive ≠ Release。）

> **Status: Implemented**（P0–P4 完成。**Phase 8 checkpoint EXITED**。前置：Phase 7 EXITED · [ADR-0024](../../design-decisions/ADR-0024-gen2-product-freeze.md) Accepted。Architecture checkpoint ≠ Release；**Phase 8 EXIT ≠ 2.0 skill-release**；PLAN-0037 仍冻结。）

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

## 现状（Exit 时）

| 观察 | 含义 |
| --- | --- |
| `npm run check:must-ship` | fail-closed；含 syntax + security/generator/payload/oracle-inventory/routing + carriers |
| Migration CI | blocking job 调用 `check:must-ship` |
| skill-release | `gates.must_ship` 行已接线 |
| 台账 | `docs/research/working/must-ship-gates.md` **gap=0** |
| FINDING-0003 | 必装阻断面已推进；Finding 仍 Confirmed（判断型 MUST = later） |
| Git consent | 单一语义权威 = `references/policies/git.policy.md` |

## 范围（In）

- **必装阻断台账**：`docs/research/working/must-ship-gates.md`
- **must-ship gate set**：`npm run check:must-ship`
- 接线：migration CI；`repo-workflows/skill-release.md` 前置 `gates.must_ship`
- Git consent 单一权威指针（机械 evaluator = later）
- Migration Mode **退出清单**成文；实际切主线/tag 属 skill-release 人类批准
- FINDING-0003：按必装阻断面推进；未覆盖声明差距记 later

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
| D2 | **gate set ≠ 全绿 Gen1**：观测化红可以保留在非必装面上 |
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
- [x] 明确「不进 set」的 Gen1 观测项

### P2 — 接线 fail-closed

- [x] `package.json` 暴露 `check:must-ship` → `repo-tools/check-must-ship.sh`
- [x] `.github/workflows/ci.yml`：migration blocking job 调用 `npm run check:must-ship`
- [x] `repo-workflows/skill-release.md`：前置检查增加 `gates.must_ship`
- [x] 表征：破坏 `drift-check` 叶名 → carriers exit 1；非沙箱 `check:must-ship` exit 0（O4 关闭）

### P3 — Mode 退出清单 + Finding

- [x] ADR-0014 退出条件对照表（`must-ship-gates.md`）
- [x] FINDING-0003：必装阻断面推进（Finding 仍 Confirmed）
- [x] Git 单一权威：`AGENTS.md` / `SKILL.md` 仅指针+摘要；正文权威 = `references/policies/git.policy.md`

### P4 — Exit

- [x] 台账无 must-ship `gap`（protocol-only / 干净目标 defer 已书面标注）
- [x] CI + skill-release 路径对 must-ship set fail-closed
- [x] roadmap ×3：Phase 8 Implemented / EXITED
- [x] PLAN-0037 仍 Design 冻结；未宣称 2.0 已发布
- [x] Ledger Open=0

## 完成条件（exit）

- [x] P0–P4 完成
- [x] 必装机械控制在 CI/release 有阻断权威（ADR-0024）
- [x] 未把非 must-ship Gen1 全集强制变红
- [x] 未 Active PLAN-0037；未打 2.0 tag
- [x] 2.0 干净目标证据**不**作为本 checkpoint 必达（留给 skill-release）

## Discovery Ledger

| ID | 类型 | 来源 | 摘要 | 域 | 严重度 | 状态 | 处置 | 证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O0 | observation | ADR-0014 CI | Safety Kernel 已 blocking；全量 Gen1 观测 | repo | high | closed | resolved | must-ship-gates.md |
| O1 | observation | ADR-0024 | WRAP 清单 ≠ 可用/可阻断 | both | high | closed | resolved | check:must-ship + CI |
| O2 | observation | skill-release | 仍写 Gen1 full gates | repo | med | closed | resolved | gates.must_ship |
| O3 | observation | FINDING-0003 | 声明–机制差距（必装面） | both | high | closed | resolved | FINDING-0003 + must-ship set |
| O4 | observation | security suite | 沙箱/权限导致本地假红 | repo | high | closed | resolved | 非沙箱 `check:must-ship` exit 0；AGENTS repo-tools 入口；generator Phase 5c 计数对齐 |

## 闭包对账

```text
Total known:  5
Resolved:     5  (O0–O4)
Deferred:     0
Open:         0
Unaccounted:  0
```

## Phase 8 Exit Criteria（checkpoint）

```text
Required:
☑ must-ship 机械控制台账完整且 gap=0（或豁免）
☑ CI / skill-release 对 must-ship set fail-closed
☑ 非 must-ship Gen1 全集未被迫 blocking
☑ PLAN-0037 仍冻结
☑ 未宣称 2.0 skill-release 完成

Deferred by design / 2.0 skill-release:
- 干净目标 tarball INIT/AUDIT/RELEASE 跑通证据
- Migration Mode 正式退出后的 main 合入 / tag（人类批准）
- CONTROL-X / L3 / 全量 oracle / PLAN-0037
```

## Affected Files

- `docs/plans/archive/PLAN-0044-rebuild-mandatory-gates.md`（本文件）
- `docs/research/working/must-ship-gates.md`
- `repo-tools/check-must-ship.sh` · `repo-tools/check-must-ship-carriers.js`
- `.github/workflows/ci.yml` · `package.json`
- `repo-workflows/skill-release.md`
- `AGENTS.md` · `CHANGELOG.md` · `docs/plans/roadmap/{zh-CN,en,zh-TW}.md`
- `docs/product/{en,zh-CN,zh-TW}/architecture.md`
- `docs/findings/FINDING-0003-*.md`
- `tests/suites/generator.test.js`（Phase 5c 计数对齐）
- `docs/plans/skill-release-2.0-checklist.md`（2.0 人类门槛索引；非 Phase 8 完成证据）

## Successor

- **2.0 skill-release**（ADR-0024 可用性门槛；清单：`docs/plans/skill-release-2.0-checklist.md`）
- PLAN-0037 解冻（仅 2.0 发布之后）
- FINDING-0003 / 0007 / 0018 按发布门槛关闭或豁免
