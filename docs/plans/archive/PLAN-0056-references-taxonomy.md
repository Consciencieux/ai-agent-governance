---
id: PLAN-0056
status: Archived
generation: gen2
target: both
---

# PLAN-0056：`references/` 分类标准与指令源拆分

**状态：** Archived（2026-09-15；人类「按这个来执行工程」。Plan archive ≠ Release）。权威：[ADR-0026](../design-decisions/ADR-0026-references-taxonomy.md)。

**问题：** `templates/` 按生成器输入混装指令源与 boilerplate；`capabilities/` 平铺 subskill 叶卡；兑现方式被误当成目录轴。

**不是：** 按 mechanical/judgment 分夹；拆 `sub-skills.md` 八份正文；H3；恢复 `check-template-responsibility.js`。

## 一句话目标

冻结四问分类标准；指令源进 `references/instruction/`；八张 subskill 叶卡进 `capabilities/subskills/`。

## 验收

- [x] ADR-0026 Accepted；ADR-0022 窄修正指向它
- [x] `instruction/agents-md.template.md` · `instruction/sub-skills.md`
- [x] `capabilities/subskills/subskill-*.md`（8）；INIT `path` 仍为 `docs/rules/capabilities/subskill-*.md`
- [x] init-spec / generator / must-ship / plan-delivery reloc / 三语 architecture / SKILL 路由
- [x] FINDING-0026 现在时；layout + role-completeness + payload 门禁

## Discovery Ledger

| ID | 类型 | 问题 | 状态 | 处置 |
| --- | --- | --- | --- | --- |
| R0 | constraint | 不按 enforcement 分夹 | resolved | ADR-0026 决策 3 |
| R1 | scope | 不拆 sub-skills 聚合正文 | resolved | 只搬家 |

```text
Total known:  2
Resolved:     2
Open:         0
Unaccounted:  0
```
