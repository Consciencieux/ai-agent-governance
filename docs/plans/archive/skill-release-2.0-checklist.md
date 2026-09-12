# 2.0 skill-release 清单（历史）

REPO-ONLY。产品定义权威：[ADR-0024](../design-decisions/ADR-0024-gen2-product-freeze.md)。  
流程权威：[`repo-workflows/skill-release.md`](../../repo-workflows/skill-release.md)。  
发布后演进：[ADR-0025](../design-decisions/ADR-0025-gen2x-product-path.md)。

## 状态（2026-09-12）

**`v2.0.0` 已发布。** 本文件不再是「下一步」，只作历史执行记录。后续工作走 ADR-0025 / [PLAN-0045](PLAN-0045-post-2.0-doc-truth.md)。

## 已满足

- [x] `npm run check:must-ship` fail-closed
- [x] Mode 退出 + 合入 `main`（merge commit；PR #8）
- [x] 干净目标预检：INIT Phase C + verify 62/62
- [x] FINDING-0003 必装阻断面（Phase 8）；残留判断型 MUST = later
- [x] FINDING-0007 2.0 切片：干净目标预检证据（完整 adapter 矩阵 = later）
- [x] FINDING-0018：冻结面 = 必装可用/稳定；随 2.0 门槛生效关闭成熟度误判 blocker
- [x] 五同步点升至 `2.0.0`
- [x] release commit + annotated tag `v2.0.0` + push
- [x] GitHub Release + tarball asset
- [x] 删除远端/本地迁移分支

## 明确不做（仍成立）

- Gen1 `npm run check` 全绿作为发布前提
- 解冻 PLAN-0037（须另一次人类 Active；见 ADR-0025 H1）
- CONTROL-X / L3 / FINDING-0006 全量 oracle
