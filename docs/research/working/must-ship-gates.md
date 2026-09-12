# Must-ship gate inventory（Phase 8 · PLAN-0044）

施工权威。投影 [ADR-0024](../../design-decisions/ADR-0024-gen2-product-freeze.md) 必装**机械**控制 → 当前阻断路径 → Phase 8 目标。  
**不是** 2.0 skill-release 证据；干净目标跑通仍属发布门槛。  
**禁止**把本表未列的 Gen1 observational 集群偷渡成 Phase 8 blocking。

`authority`：`blocking` | `observational` | `none` | `protocol-only`。

## 当前 CI 形态（ADR-0014）

| 路径 | 内容 | 权威 |
| --- | --- | --- |
| Migration Safety Kernel | JS syntax + `--suite security` + `generator` + `payload` | **blocking**（migration 分支） |
| Migration Gen1 probe | `npm run check` | **observational**（`continue-on-error`） |
| main / 1.x | `npm run check` | **blocking**（稳定面，非本 Phase 施工面） |

## 必装机械控制台账

| ID | 能力（ADR-0024） | 载体（可 WRAP） | 当前权威 | Phase 8 目标 | 状态 |
| --- | --- | --- | --- | --- | --- |
| MS-01 | 密钥扫描 | `scripts/check-secrets.js` + security suite | blocking（Kernel） | 保持；纳入 `check:must-ship` | ok |
| MS-02 | Git 工作流安全 | `scripts/check-git-policy.js` + security suite | blocking（Kernel） | 保持；纳入 set | ok |
| MS-03 | Git consent HITL | `references/policies/git.policy.md` | protocol-only | 单一权威 + 指针；机械 evaluator = later | gap→protocol |
| MS-04 | 确定性 INIT / 生成器 | `scripts/generate-governance.js` + generator suite | blocking（Kernel） | 保持；纳入 set | ok |
| MS-05 | AUDIT / drift 入口 | SKILL AUDIT + generated drift-check | none / 弱 | 入口存在性检查进 set；全量 drift later | gap |
| MS-06 | RELEASE + 人类批准 | `references/workflows/release.md` + skill-release | protocol + 部分 | skill-release 前置对齐 must-ship set | gap |
| MS-07 | 治理校验器 | `scripts/verify_governance.js` | 部分（本仓 ADR-0006 例外） | 目标面存在性/结构进 set | gap |
| MS-08 | 治理状态工件 | init-spec + `.governance/*` | 部分（generator/payload） | INIT 契约进 set | gap |
| MS-09 | 证据分层 | INSTALLED policies | protocol-only | 不造新 gate | ok |
| MS-10 | INSTALLED 可移植性 | 内容纪律 + FINDING-0007 | observational | 打包 hygiene 进 set；干净目标 = 2.0 | gap（partial） |
| MS-11 | Rule Capture / 根因 / 卫生 / 克制 | lifecycle / coding policies | protocol-only | 不造新 gate | ok |
| MS-12 | 种子 oracle + 路由完整性 | `oracle-inventory.v0.json` + suites | **未**进 Kernel | `oracle-inventory` + `routing` 纳入 set | gap |
| MS-13 | 八个子技能叶 | `references/templates/sub-skills.md` | 部分 | 八叶存在性进 set | gap |
| MS-14 | Implementation Review | review-manager | protocol + 路由 | 载体 + Impl-only 边界 | ok |

## 明确不进 must-ship set

术语门禁 · roadmap-sync · plan-delivery · System/Research Review（repo-keep）· consistency 剩余 heuristic · CONTROL-X · consent 机械 evaluator · 完整 activity 审计 · score/badge（retire）· Skill INSTALL/UPDATE（out）· Gen1 `npm run check` 全量。

## must-ship set（P2 接线）

```text
npm run check:must-ship
  = JS --check (scripts|repo-tools|tests)
  + --suite security
  + --suite generator
  + --suite payload
  + --suite oracle-inventory
  + --suite routing
```

Migration CI blocking job 应调用该脚本。Gen1 full `npm run check` 可继续 observational。

## Migration Mode 退出对照（ADR-0014 · 草稿）

| 条件 | Phase 8 关系 |
| --- | --- |
| 新架构关键 gates 恢复 blocking | = `check:must-ship` fail-closed |
| critical old regressions migrated | 仅 must-ship 面 |
| release characterization green | skill-release 用 must-ship set |
| 禁 tag 直至退出 | 仍有效；退出属 skill-release 人类批准 |

## 缺口摘要

```text
ok:     MS-01,02,04,09,11,14
protocol (可接受): MS-03
gap (P2+): MS-05,06,07,08,10,12,13
```

P1 完成：本文件无未分类行。消 gap / 接线属 P2。
