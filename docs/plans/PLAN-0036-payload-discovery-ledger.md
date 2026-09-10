---
id: PLAN-0036
status: Implemented
generation: gen2
target: payload
---

# PLAN-0036：Payload TASK Discovery Ledger 集成

> （**L1 Implemented** · Phase 4 EXITED。2026-09-10：lifecycle Discovery Ledger 契约落地；L2 deferred。Architecture checkpoint ≠ Release。）

将 ADR-0021 Known-Issue Closure 的 Discovery Ledger 从 **repo prototype**（PLAN-0033）推进到 **INSTALLED skill TASK lifecycle**（`references/policies/lifecycle.policy.md`）。属 Phase 4，与 checker/primitive 分解正交。

## 背景

- ADR-0021：第一代载体 = TASK Plan 内 append-only 台账；payload 集成原未一次性铺开。
- PLAN-0032 R24 → 本计划（PLAN-0035 P0 successor）。
- L1 边界：contract + storage + workflow + characterization；**无**自动发现 JS / dashboard / Dispatcher。

## 已交付（L1）

1. **Contract** — `lifecycle.policy.md` § 发现台账（Discovery Ledger）：列、类型/来源枚举、status×disposition 两轴、successor/revisit、append-only、Unaccounted=0。
2. **Storage boundary** — 条目家 = Active TASK 计划台账表（execution state + provenance）；明确排除 `state.json` / findings / `docs/state/` / 机器 registry。
3. **Workflow** — Phase 2 必含台账；Phase 3 发现先登记；Phase 6 闭包对账。
4. **ADR-0021** — 2026-09-10 Narrow amendment 授权 payload L1。
5. **Characterization** — `docs.test.js` source markers；`payload.test.js` clean-target `docs/rules/lifecycle.md` 可达。

## 明确未做（正确延后）

```text
自动发现 / 自动分类 / AI 生成台账
fail-closed Unaccounted 门禁 JS
docs/state/ 或 .governance discovery registry
Dispatcher / Phase 5 routing / 文档 topology
每个发现都强制建 Plan
```

## 完成条件（本 L1）

- [x] R24 successor = 本计划
- [x] lifecycle.policy 含 TASK Discovery Ledger 约定
- [x] reference-closure：INIT 后 governed project 可读契约
- [x] 本计划 Ledger：Open=0；Unaccounted=0
- [x] 未越权改 checker monolith / Dispatcher

## 受影响文件

- `references/policies/lifecycle.policy.md`
- `docs/design-decisions/ADR-0021-known-issue-closure.md`
- `AGENTS.md`（原则索引指针）
- `docs/glossary.md` · `docs/product/{en,zh-CN,zh-TW}/lifecycle.md`
- `tests/suites/docs.test.js` · `tests/suites/payload.test.js`
- `docs/plans/PLAN-0035-…` · `CHANGELOG.md`

## 发现台账（Discovery Ledger）

| 标识（ID） | 类型 | 来源 | 问题 | 影响面 | 严重度 | 状态 | 处置 | 责任人 | 验证/证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L0 | migration_gap | audit | 须建立 payload successor Plan | skill | med | closed | resolved | — | 本计划 |
| L1 | missing_capability | task | lifecycle.policy 尚未内嵌 Ledger | skill | high | closed | resolved | — | lifecycle § 发现台账 + tests |
| L2 | observation | review | L1 无 fail-closed Unaccounted 门禁 | skill | low | closed | deferred | — | revisit: Phase 6 / 后续 mechanization；不阻塞 L1 |

## 闭包对账

```text
Total known:  3
Resolved:     2  (L0, L1)
Deferred:     1  (L2 — revisit 已写)
Open:         0
Unaccounted:  0
```

## 参考

- ADR-0021 · RESEARCH-0008 · FINDING-0022
- PLAN-0033 · PLAN-0032 R24 · PLAN-0035
