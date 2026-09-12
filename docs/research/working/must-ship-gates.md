# Must-ship gate inventory（Phase 8 · PLAN-0044）

施工权威。投影 [ADR-0024](../../design-decisions/ADR-0024-gen2-product-freeze.md) 必装**机械**控制 → 当前阻断路径 → Phase 8 目标。  
**不是** 2.0 skill-release 证据；干净目标跑通仍属发布门槛。  
**禁止**把本表未列的 Gen1 observational 集群偷渡成 Phase 8 blocking。

`authority`：`blocking` | `observational` | `none` | `protocol-only`。

## 当前 CI 形态（ADR-0014）

| 路径 | 内容 | 权威 |
| --- | --- | --- |
| Migration must-ship | `npm run check:must-ship`（见下方 set） | **blocking**（migration 分支） |
| Migration Gen1 probe | `npm run check` | **observational**（`continue-on-error`） |
| main / 1.x | `npm run check` | **blocking**（稳定面，非本 Phase 施工面） |

## 必装机械控制台账

| ID | 能力（ADR-0024） | 载体（可 WRAP） | 当前权威 | Phase 8 目标 | 状态 |
| --- | --- | --- | --- | --- | --- |
| MS-01 | 密钥扫描 | `scripts/check-secrets.js` + security suite | blocking | 保持；纳入 `check:must-ship` | ok |
| MS-02 | Git 工作流安全 | `scripts/check-git-policy.js` + security suite | blocking | 保持；纳入 set | ok |
| MS-03 | Git consent HITL | `references/policies/git.policy.md` | protocol-only | 单一权威 + 指针；机械 evaluator = later | ok（protocol） |
| MS-04 | 确定性 INIT / 生成器 | `scripts/generate-governance.js` + generator suite | blocking | 保持；纳入 set | ok |
| MS-05 | AUDIT / drift 入口 | SKILL AUDIT + `drift-check` 叶 | blocking（carriers） | 入口存在性进 set；全量 drift later | ok |
| MS-06 | RELEASE + 人类批准 | `release.md` + skill-release `gates.must_ship` | protocol + blocking set | skill-release 前置对齐 must-ship | ok |
| MS-07 | 治理校验器 | `scripts/verify_governance.js` | blocking（carriers） | 目标面存在性进 set | ok |
| MS-08 | 治理状态工件 | `init-spec.json` + generator/payload | blocking | INIT 契约进 set | ok |
| MS-09 | 证据分层 | INSTALLED policies | protocol-only | 不造新 gate | ok |
| MS-10 | INSTALLED 可移植性 | payload suite + FINDING-0007 | blocking（hygiene） | 打包 hygiene 进 set；干净目标 dogfood = 2.0 | ok（partial→2.0） |
| MS-11 | Rule Capture / 根因 / 卫生 / 克制 | lifecycle / coding policies | protocol-only | 不造新 gate | ok |
| MS-12 | 种子 oracle + 路由完整性 | oracle-inventory + routing suites | blocking | 纳入 set | ok |
| MS-13 | 八个子技能叶 | `sub-skills.md` + carriers | blocking | 八叶存在性进 set | ok |
| MS-14 | Implementation Review | review-manager | protocol + 路由 | 载体 + Impl-only 边界 | ok |

## 明确不进 must-ship set

术语门禁 · roadmap-sync · plan-delivery · System/Research Review（repo-keep）· consistency 剩余 heuristic · CONTROL-X · consent 机械 evaluator · 完整 activity 审计 · score/badge（retire）· Skill INSTALL/UPDATE（out）· Gen1 `npm run check` 全量 · 干净目标全量 dogfood（2.0 skill-release）。

## must-ship set（P2 接线 · 已落地）

```text
npm run check:must-ship
  = JS --check (scripts|repo-tools|tests)
  + --suite security
  + --suite generator
  + --suite payload
  + --suite oracle-inventory
  + --suite routing
  + repo-tools/check-must-ship-carriers.js
```

Migration CI blocking job 调用该脚本。Gen1 full `npm run check` 继续 observational。

### O4 表征（破坏变红）

- 故意改坏 `sub-skills.md` 中 `name: drift-check` → `check-must-ship-carriers` exit 1（本地负向记录 2026-09-12）。
- security suite 依赖真实 git / 暂存区；须在非沙箱环境跑通（CI 与本机 `required all` 一致绿）。

## Migration Mode 退出对照（ADR-0014）

| 条件 | Phase 8 关系 | 2.0 skill-release |
| --- | --- | --- |
| 新架构关键 gates 恢复 blocking | = `check:must-ship` fail-closed | 保持 |
| critical old regressions migrated | 仅 must-ship 面 | 同左 |
| release characterization green | skill-release 用 must-ship set | 同左 |
| 禁 tag 直至退出 | Phase 8 成文清单 | **人类批准后**才退出 Mode / 打 tag |

## 缺口摘要

```text
ok:     MS-01–14（含 protocol / partial→2.0）
gap:    0
waiver: 无（MS-03/09/11 为设计上的 protocol-only；MS-10 干净目标显式 defer 到 2.0）
```

P4 Exit 条件：本文件 gap=0；接线已落地。
