# 发现台账（Discovery Ledger）

> Capability leaf (`discovery-ledger`). Instruction-surface 2.0 card (PLAN-0046) + 5c authority body restored (PLAN-0047 H2a).
> Role: INSTALLED → `docs/rules/capabilities/discovery-ledger.md`.
> Disposition: ADR-0024 `later` for L2 mechanization; L1 INSTALLED contract remains.

## Trigger

TASK 中发现已知问题需闭环时（ADR-0021）。

## Authority

本叶为权威正文（INIT → `docs/rules/capabilities/discovery-ledger.md`）。`docs/rules/lifecycle.md` 仅保留编排指针，不再承载本横切正文。

**语义权威**：ADR-0021（Known-Issue Closure）。本节是 **INSTALLED L1 契约**——规定被治理项目 TASK 如何承载台账；不复述 ADR 全文，不新建 issue tracker / Control / 自动发现脚本。

**对象性质（存储边界）：** Discovery Ledger 是 **execution state + provenance**（本次工作发现了什么、如何处置），**不是**长期规则、不是 Research/ADR 正文、不是 Finding 仓库。

| 表面 | 是否放 Ledger 条目 |
| --- | --- |
| 当前 Active TASK 计划内 `## 发现台账（Discovery Ledger）` 表 | **是** — L1 唯一条目家（append-only membership） |
| `.governance/state.json` | **否** — 仍只承载锁 / blocked 等任务运行态，不存发现 workset |
| `docs/findings/` / ADR / Research | **否** — 仅当 disposition 为 promoted-to-* 时由后继对象承接 |
| 独立 `docs/state/` 或机器 registry 文件 | **否** — L1 未授权 |

**L1 表格式（列）：**

| 标识（ID） | 类型 | 来源 | 问题 | 影响面 | 严重度 | 状态 | 处置 | 责任人 | 验证/证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

- **类型（type）**：`bug` / `missing_capability` / `drift` / `migration_gap` / `observation`
- **来源（source）**：`task` / `review` / `test` / `audit`（可加短备注）
- **状态（status）** 与 **处置（disposition）** 是两轴（ADR-0021）：`open` = 仍跟踪；获得 terminal disposition 后必须 `closed`
- **处置（disposition）权威枚举**：`resolved` / `deferred` / `duplicate` / `not-applicable` / `blocked` / `promoted-to-finding` / `promoted-to-adr` / `promoted-to-research` / `promoted-to-next-plan`。口语别名：`fix_now`→`resolved`；`create_plan`→`promoted-to-next-plan`；`create_finding`→`promoted-to-finding`；`create_adr`→`promoted-to-adr`；`ignore_with_reason`→`not-applicable`（理由写入验证/证据）
- **非 resolved 的 terminal disposition** 必须带 **successor**（后继 ID）或显式 **revisit** 条件（写入验证/证据列）
- **membership append-only**：已登记行不得删除；只更新状态/处置/证据

**工作流（最低）：**

```text
发现新问题
 → 先登记一行（不得只靠对话记忆）
 → 判断是否属于当前任务范围
 是 → 可 fix-now（处置 resolved）
 否 → 仍须登记 + terminal disposition（延期/提升/不适用…）
任务宣称完成前
 → Unaccounted = 0（每个 in-scope 条目有 terminal disposition 且 status=closed）
```

**反模式：** 不是每个发现都建 Plan / Finding——系统性才 `promoted-to-finding`，跨任务交付才 `promoted-to-next-plan`。禁止用「再开一个 Plan」逃避本任务台账闭包。

**机械化（L1）：** 无自动发现、无自动分类、无 dashboard。契约与人工/Agent 遵守 + characterization 测试证明约定可达 INSTALLED 表面；fail-closed 门禁留后续阶段。

## Invoke

在 Active TASK 计划内维护台账表；**append-only** membership；terminal disposition 必填。

## Verify

报告须给出台账对账：Total known / Resolved / Open / **Unaccounted = 0** 方可宣称完成。禁止删行装关闭。

## Non-goals

不承诺 later 的 L2 机械化；不另建平行 issue tracker。
