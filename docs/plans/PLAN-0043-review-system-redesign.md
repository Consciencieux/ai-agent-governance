---
id: PLAN-0043
status: Implemented
generation: gen2
target: both
---

# PLAN-0043：Phase 7 Review System redesign

> **Status: Implemented**（P0–P4 完成。**Phase 7 checkpoint EXITED**。前置：Phase 6 EXITED · ADR-0024 Accepted。Architecture checkpoint ≠ Release；PLAN-0037 仍冻结。）

把「一个 review-manager 扛全部审查」拆成三类，并让每类有可加载权威与验收面。动机权威：ADR-0018 决策 5 · FINDING-0014。产品边界权威：**必须消费** ADR-0024。

## 目标

```text
Phase 6 EXITED + ADR-0024 产品冻结
        ↓
三类 Review 边界成文（Impl / System / Research）
        ↓
Implementation Review = must-ship（保留现有 review-manager 定位；可换载体不可删能力）
        ↓
System Review + Research Review = repo-keep（仓内可运行；不进 skill 默认子技能）
        ↓
路由可命中三类；表征证明边界；FINDING-0014 按关闭条件推进
        ↓
Phase 7 checkpoint EXITED → Phase 8（只重建必装机械控制阻断权威）
```

## 现状（Exit 时）

| 观察 | 含义 |
| --- | --- |
| `review-implementation` | map / graph 指向 `references/templates/sub-skills.md` § review-manager；边界句 = Impl only |
| System / Research 叶 | `docs/research/working/review/{system,research}-review.md` + 路由 Capability |
| FINDING-0014 | 分层落地；L0–L4 工具化仍 later；Finding 保持 Confirmed |
| ADR-0024 §9 | Phase 7 验收面满足 |

## 范围（In）

- **三类定义**（施工权威，简体中文）：`docs/research/working/review/review-kinds.md`
- **System Review 剧本**（repo-keep）：问题清单 = 架构 / control topology / producer–product 耦合 / 过度工程；输出 = Finding 分类优先，默认只读至分类完成
- **Research Review 剧本**（repo-keep）：问题清单 = 我们如何理解/评价系统；不得伪装成 PR 缺陷扫描
- **Implementation Review**：声明现有 review-manager 仅为 Impl；更新触发词与边界指针；**不**重写其全文 checklist
- **路由**：新增 `review-system` / `review-research` Capability；`task_class` 区分 `audit`（Impl）与显式 system/research 审查；AuthorityRef 指向上述权威
- **表征**：三类权威文件存在；Impl 不得宣称覆盖 System/Research；路由命中边界
- **FINDING-0014**：按关闭条件 1/4 推进（分类先于修复 + Review 分层落地）；L0–L4 全量枚举可 `later` 记入 Finding，不挡 Phase 7 Exit

## 非目标（Out）

```text
Phase 8 阻断权威重建 / 把观测化 Gen1 gate 全变红
Active PLAN-0037
把 System/Research 打进 INSTALLED 默认子技能（违反 ADR-0024 repo-keep）
重写 review-manager 全文或再堆第五个「全面审查」域
CONTROL-X runner / 机器可读 Control 文件
FINDING-0006 全量 oracle
给 consistency 剩余集群批量发 CTRL 号
5c leftover / FINDING-0028 / FINDING-0029
Migration 分支上把 Gen1 npm run check 改成 blocking
```

## 设计裁决（本计划冻结）

| # | 裁决 |
| --- | --- |
| D1 | **消费 ADR-0024**：Impl = `must-ship`；System/Research = `repo-keep`；不得把未冻结产品面当验收 |
| D2 | **分层 ≠ 三个同样的 checklist**：System/Research 问不同问题，禁止复制 Impl 五域再贴标签 |
| D3 | **默认只读至分类**：System/Research 默认 Find → 分类 → 再决定是否修；禁止边审边修掩盖架构问题（FINDING-0014） |
| D4 | **Target: both**：Impl 边界指针可触及 INSTALLED 生成面；System/Research 权威与路由 = repo-infra |
| D5 | **切片可停**：P1 权威成文可单独合入；P2 路由；P3 表征 + Finding 推进；P4 才标 Phase 7 EXITED |
| D6 | **PLAN-0037 仍冻结**；Phase 7 EXIT 不解冻 |

## 交付阶段

### P0 — Design 批准 → Active

- [x] 批准本 Design → `status: Active`
- [x] In/Out / D1–D6 与 ADR-0024 对齐
- [x] roadmap ×3 + AGENTS：Phase 7 = PLAN-0043 Active

### P1 — 三类权威成文

- [x] `docs/research/working/review/review-kinds.md`（边界 + 触发 + 输出物）
- [x] `docs/research/working/review/system-review.md`
- [x] `docs/research/working/review/research-review.md`
- [x] Impl：map / 投影表声明「仅 Implementation」；`references/templates/sub-skills.md` §8 边界句

### P2 — 路由投影

- [x] `graph.v0.json` + `task-capability-map.md` + `projection-table.md`：`review-system` / `review-research`
- [x] task_class：`system_review` / `research_review`；默认 `audit` 仍只带 `review-implementation`
- [x] 负向：`audit` 不得静默加载 System/Research（表征 N4）

### P3 — 表征 + Finding

- [x] `tests/suites/routing.test.js`：N4 / F7 / F8（routing suite 19/19）
- [x] FINDING-0014：分层已落地；L0–L4 全量工具化标 later，Finding 仍 Confirmed

### P4 — Exit

- [x] ADR-0024 §9 Phase 7 验收面满足（人工确认）
- [x] roadmap ×3：Phase 7 Implemented / EXITED
- [x] PLAN-0037 仍 Design 冻结；无 Phase 8 偷跑（Phase 8 = 后继 PLAN-0044）
- [x] Ledger Open=0（本计划范围内）

## 完成条件（exit）

- [x] P0–P4 完成
- [x] Implementation Review 能力仍可指出载体（must-ship；**Phase 7 checkpoint**，不是 2.0 干净目标验收）— `references/templates/sub-skills.md` § review-manager
- [x] System / Research 在本仓有可加载剧本且路由可命中（repo-keep）
- [x] 无「一个 review 扛三类」的权威表述残留于 Phase 7 新权威文件
- [x] 未 Active PLAN-0037；未改 Migration Gen1 check 为 blocking

## Discovery Ledger

| ID | 类型 | 来源 | 摘要 | 域 | 严重度 | 状态 | 处置 | 证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O0 | observation | FINDING-0014 | Impl/System 层级混用 | both | high | closed | resolved | review-kinds + Sys/Res 剧本 + N4 |
| O1 | observation | ADR-0024 §4/§5 | Impl must-ship；Sys/Res repo-keep | both | high | closed | resolved | 权威路径与档位 |
| O2 | observation | graph.v0 | 仅有 review-implementation | repo | med | closed | resolved | P2 增补 |
| O3 | observation | ADR-0024 | System/Research 进 INSTALLED 默认面 | payload | high | closed | deferred | Out；D1 |

## 闭包对账

```text
Total known:  4
Resolved:     3  (O0, O1, O2)
Deferred:     1  (O3)
Open:         0
Unaccounted:  0
```

## Phase 7 Exit Criteria（checkpoint）

```text
Required:
✓ 三类 Review 权威成文且边界互斥
✓ Impl must-ship 载体仍在
✓ System/Research repo 可运行（剧本 + 路由）
✓ 表征覆盖存在性与「audit 不静默加载 Sys/Res」
✓ PLAN-0037 仍冻结

Deferred by design:
- L0–L4 Finding Level 全量机械枚举
- System/Research 作为 INSTALLED 子技能
- Phase 8 gate 重建
- review-manager 正文大改
```

## Phase 7 exit review（2026-09-12）

| 检查项 | 状态 |
| --- | --- |
| Exit Criteria Required 全项 | ✓ |
| Deferred by design 已显式记录 | ✓ |
| Phase 8 / Active PLAN-0037 / Gen1 check→blocking | **未偷跑** |
| Open blocker | **无** |
| 表征证据 | `node tests/run-tests.js --suite routing` → 19/19 |

**Completion marker：** Phase 7 checkpoint = **EXITED**（PLAN-0043 `status: Implemented`）。

**Successor：** Phase 8 Rebuild mandatory gates（[PLAN-0044](PLAN-0044-rebuild-mandatory-gates.md) Active）。

## Affected Files（预期）

- `docs/plans/PLAN-0043-review-system-redesign.md`（本文件）
- `docs/research/working/review/**`
- `docs/research/working/routing/graph.v0.json`
- `docs/research/working/routing/task-capability-map.md`
- `docs/research/working/routing/projection-table.md`
- `docs/research/working/routing/call-topology.md`（指针）
- `repo-tools/lib/routing.js` / Detector 触发（若需）
- `tests/suites/routing.test.js`
- `docs/findings/FINDING-0014-review-manager-layer-mismatch.md`
- `docs/plans/roadmap/{zh-CN,en,zh-TW}.md` · `AGENTS.md` · `CHANGELOG.md`
- 可选薄编辑：`references/templates/sub-skills.md`（仅边界句）

## Successor

- Phase **8** Rebuild mandatory gates — [PLAN-0044](PLAN-0044-rebuild-mandatory-gates.md)
- FINDING-0014：分层落地后按关闭条件评估是否 Resolved（仍 Confirmed；L0–L4 later）
- PLAN-0037 仍冻结至 2.0 后
