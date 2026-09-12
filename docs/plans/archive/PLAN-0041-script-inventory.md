---
id: PLAN-0041
status: Implemented
generation: gen2
target: repo
---

# PLAN-0041：Script Inventory（FINDING-0028 L0）

> **Status: Implemented**（L0：机读台账 + 表征。不做目录隔离、不删脚本。）

## 目标

```text
FINDING-0028：分发角色清楚，代际/处置靠猜
        ↓
用 v1.0.2 git 证据列 + 人工 disposition
        ↓
docs/research/working/script-inventory.v0.json（施工权威）
        ↓
表征：每个 scripts/|repo-tools/ 入口必须登记且路径存在
        ↓
retire=∅ → 禁止「整夹隔离」捷径
```

## 非目标

- 不按 `v1.0.2` 把旧脚本搬进 attic / legacy 目录。
- 不改 INIT / 打包契约；不改 Task→Capability 边。
- 不关闭 FINDING-0028 的 dogfood 项（repo 仍调用 INSTALLED CLI）——记入 inventory，另开后续。

## 交付

| 项 | 路径 |
| --- | --- |
| 机读台账 | `docs/research/working/script-inventory.v0.json` |
| 人读说明 | `docs/research/working/script-inventory.md` |
| 表征 | `tests/suites/script-inventory.test.js` |
| Finding 回指 | FINDING-0028 |
| Roadmap 延后行更新 | 指向本计划 Implemented，而非「未开」 |

## 发现台账

| ID | 类型 | 问题 | 状态 | 处置 | 证据 |
| --- | --- | --- | --- | --- | --- |
| I0 | observation | 无文件级 disposition | closed | resolved | inventory v0 |
| I1 | observation | wrap CLI 与 evaluator 同树 | closed | deferred | notes in JSON；不搬家 |
| I2 | observation | repo dogfood INSTALLED | closed | deferred | summary.dogfood_*；后续 Plan |
| I3 | observation | 整夹隔离诱惑 | closed | not-applicable | 本计划明确拒绝 |

```text
Total: 4  Resolved: 1  Deferred: 2  N/A: 1  Open: 0  Unaccounted: 0
```

## 验证

```bash
node tests/run-tests.js --suite script-inventory
npm test   # 须包含 script-inventory
```

## Successor

- Dogfood 拆分（repo 不再直接跑 INSTALLED CLI）或 Phase 6 机械 oracle
- 若出现 `disposition: retire`，再开隔离/删除 Plan（仍禁止按日期整夹）
