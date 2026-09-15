---
id: PLAN-0057
status: Archived
generation: gen2
target: both
---

# PLAN-0057：能力兑现分类库存（INSTALLED JSON）

**状态：** Archived（2026-09-15；同批交付。Plan archive ≠ Release）。权威：[ADR-0026](../design-decisions/ADR-0026-references-taxonomy.md) 2026-09-15 窄修正。

**问题：** FINDING-0003 把「没脚本 / 要人批 / 天生不能判」捆成 `judgment`；Markdown `## Enforcement` 仍是软约束。

**不是：** 为 unmechanized 新写 checker；为 inherent_judgment 写 deny；搬 `capabilities/`↔`policies/`；H3；拆 `sub-skills.md`。

## 一句话目标

INSTALLED JSON 作为兑现分类唯一事实源；义务四类；门禁对账叶集合与 mechanical carrier。

## 验收

- [x] ADR-0026 Q3 = JSON 四类；叶卡无 `## Enforcement` 清单
- [x] `references/capabilities/enforcement.v0.json` → INIT `docs/rules/capability-enforcement.json`
- [x] 每张 capabilities 叶至少一行；mechanical 路径存在
- [x] 表征测试替换「标题存在」；`check:must-ship`

## Discovery Ledger

| ID | 类型 | 问题 | 状态 | 处置 |
| --- | --- | --- | --- | --- |
| R0 | constraint | 不 dual-write 叶卡 | resolved | 剥 Enforcement 节 |
| R1 | scope | 不把 unmechanized 当本带新门禁 | resolved | JSON 标 mechanizable |

```text
Total known:  2
Resolved:     2
Open:         0
Unaccounted:  0
```
