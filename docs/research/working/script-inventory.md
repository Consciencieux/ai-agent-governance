# Script Inventory v0（施工权威 · FINDING-0028）

机读源：[`script-inventory.v0.json`](script-inventory.v0.json)  
基线戳：`v1.0.2`（证据列，**不是**隔离轴）  
施工计划：[PLAN-0041](../../plans/PLAN-0041-script-inventory.md)

## 为什么不是「1.0.2 以前整夹搬走」

| 误判 | 事实（对本仓 v1.0.2 → HEAD） |
| --- | --- |
| 未改 = 可隔离 | 15 个 JS/SH 自 tag 后 0 commit，仍是 INSTALLED / SKILL-INTERNAL **在用产品**（如 `generate-governance.js`） |
| 已改 = 已是 2.0 | 3 个 WRAP CLI 恰是混层入口；路径要留 |
| 隔离夹 = 安全 | `package-skill.sh` 整棵复制 `scripts/`；夹在 `scripts/` 里照样进包 |

正确顺序：**历史填证据 → disposition 裁决 → 仅 `retire` 才隔离**。v0 **retire = ∅**，故无搬家。

## 字段

| 字段 | 含义 |
| --- | --- |
| `distribution_role` | `INSTALLED` / `SKILL-INTERNAL` / `REPO-ONLY` |
| `generation` | `gen1_carrier` / `gen2_native` / `dual_profile` |
| `disposition` | `keep` / `wrap` / `extract` / `rewrite` / `retire` / `undecided` |
| `baseline.present` / `baseline.commits_after` | 相对 `v1.0.2` |
| `dogfood_from_repo_package_json` | 本仓 `package.json` 是否直接调用 |

## v0 摘要

见 JSON `summary`（30 入口）：**wrap** = `scripts/check-secrets.js` · `check-doc-freshness.js` · `check-doc-consistency.js`；**retire** = ∅；repo 狗粮 INSTALLED = 后两者。

## 维护

- 新增 `scripts/**` 或 `repo-tools/**` 入口 → **同 PR** 登记 JSON。
- 表征：`npm test -- --suite script-inventory`（全量 `npm test` 亦跑）。
- 将某文件标 `retire` 前必须写删除/停用条件，并保证 `package.json` / INIT 不再引用。
