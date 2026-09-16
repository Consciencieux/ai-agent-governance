# Skill Repository Release（技能仓库发布流程）

仅适用于**本技能分发仓库**发布。被治理项目 → `references/workflows/release.md`（本文件不分发、不 INIT）。

事故与防踩坑证据 → [FINDING-0041](../docs/findings/FINDING-0041-skill-release-operational-traps.md)。按需读；不要把 Finding 正文当 runbook。

## release_requirements

| 检查 | 要求 | 失败 |
| --- | --- | --- |
| `git.require_clean_status` | 工作区干净 | ⚠️ Blocked |
| `gates.must_ship` | `npm run check:must-ship` = 0 | ❌ 停止 |
| `tests.required` | `npm test` = 0 | ❌ 停止 |
| `changelog.required` | CHANGELOG 已记录本次应交付变更 | ⚠️ Blocked |
| `version.manifest_match_tag` | 五同步点 + tag 一致（见下；`version_examples` 簇） | ❌ 停止 |
| `release.tag_required` | 目标 tag 尚不存在 | ⚠️ Blocked |
| `release.proposal_approved` | Proposal 已生成且开发者明确批准 | ⚠️ Blocked |
| `release.review_satisfied` | 高风险：`reviewStatus` = `completed` \| `explicitly-approved` | ❌ 停止 |
| `docs.parity_passed` | `check-doc-parity.js` = 0 | ⚠️ Blocked |
| `sync.passed` | `check-sync.js` = 0 | ❌ 停止 |
| `plan.delivery_verified` | `check-plan-delivery.js` = 0 | ❌ 停止 |

本仓无 `.governance/manifest.json`；`verify_governance.js` 在本仓**预期失败**（ADR-0006）——以 `tests.required` 替代，**禁止**为通过而伪造 `.governance/`。暂存：`repo-tools/.release/proposal.json`（gitignored）。

Gen2 阻断权威：`check:must-ship`（ADR-0024），不是「Migration Mode 下 Gen1 `check` 观测红必须先绿」。

## 版本同步点（五处 + tag，无 manifest）

1. `package.json` `version`  
2. `CHANGELOG.md` 顶部版本节 `[X.Y.Z]`  
3. `SKILL.md` frontmatter `version`  
4. `references/init-spec.json` `inputs.governance_version.default`  
5. `scripts/lib/generate/run.js` 兜底哨兵  

+ Git tag `v<version>`（与 version 配对）。文档里的 `"version": "…"` 示例亦由 `version_examples` 簇 fail-closed。

## Phase 1：Analyze

只读：当前 tag/版本、`git log`/`diff` 自上次发布、用户可见变化；查阅仍 Confirmed 且触及「门禁未覆盖之证明义务」的 Findings，以及 ADR-0024 `later` 中与本 tag 相关项（不阻断；触发条件已成立则另开任务）。

```bash
node scripts/release-manager.js plan --json '{"current":"X.Y.Z","changes":[{"type":"breaking|feature|fix|docs|refactor|test|ci|chore","description":"...","uncertain":false}]}'
```

`plan` 只读；退出码 2 = 需澄清。

## Phase 2：Version Decision

SemVer 权威：`references/workflows/release.md` § Phase 2（shared）。本仓同样适用：Breaking 只看对外用户/开发者；不得用 diff 行数/commit 数启发式；`0.x` Breaking 不自动升 `1.0.0`。

## Phase 3：Approval Gate

| 风险 | 类型 | 要求 |
| --- | --- | --- |
| 低 | docs/typo/版本/链接/格式 | 轻量门禁通过即可 |
| 中 | 功能/脚本/政策/模板 | 轻量门禁 + Proposal；开发者决定是否先 review-manager |
| 高 | 安全/权限/删除保护/治理文件行为 | 必须先 review-manager（范围 = git diff）或逐项明确确认 |

轻量门禁总是跑；边界模糊取更高档。Proposal 须含 `riskLevel` / `reviewRecommendation` / `reviewStatus`。批准后写入 `repo-tools/.release/proposal.json`（先 `mkdir -p repo-tools/.release`）。

## Phase 4：Release Execution

开发者确认后按序执行（细节陷阱见 FINDING-0041）：

1. 再查 `git status` / `HEAD`；须干净且与 Proposal `headSha` 一致，否则重 plan。  
2. **版本同步**（五同步点）：`[Unreleased]` → `[X.Y.Z]` **只改名**；**不在本步**重建空 `[Unreleased]`。同步文档中的版本示例。  
3. **门禁（release commit 之前）：** `check-plan-delivery.js --gate` + `npm run check:skill-release`。  
4. **归档残留** Completed/Implemented 计划 → `docs/plans/archive/`（保留原文；以 zh-CN 为准；权威触发是 Plan lifecycle / ADR-0016，本步兜底）。  
5. **更新 roadmap**（索引对账；计划链接随归档改写；CHANGELOG 引计划只写名称不写路径）。  
6. **release commit**（版本同步 + 归档 + roadmap 同提交）：`release: vX.Y.Z - <summary>`。  
7. **复跑** `npm run check`（commit 后、tag 前）。  
8. **重新** `release-manager plan`（用新 HEAD；**禁止**手改 proposal 的 `headSha`）。  
9. **tag：** `node scripts/release-manager.js execute --proposal repo-tools/.release/proposal.json --yes`  
10. **push** 当前已批准分支 + `vX.Y.Z`（勿写死 `main`；禁 force-push 受保护分支）。  
11. **GitHub Release 说明：** `gh release create …`（未登录 → ⚠️）。  
12. **载荷 tarball：** 默认等 CI `skill-payload-release.yml`；回退：`bash repo-tools/package-skill.sh vX.Y.Z` + `gh release upload`。校验：白名单仅 `SKILL.md`+`references/`+`scripts/`+`LICENSE`；记录 SHA-256。

**空 `[Unreleased]` 重建：** 仅在第 3 步门禁通过之后（通常随 release commit 或紧随其后）。顺序：改名 → 门禁 → 重建。

## 安全与事务

- 无已批准 Proposal → 不得自动 tag / push tag / 建 Release。  
- 批准后、执行前 HEAD/status 变化 → 取消，重 plan。  
- 前置失败 → 写操作前中止。进入写操作后必须连续完成；任一步失败 → 停止并报告已完成/未完成，**不得改道重试**。  
- tag 已建但 Release/资产失败 → **不删 tag、不强推**；⚠️ 由人决定补救。  
- 恢复：据 `git log` + `proposal.json` 只重做未完成部分。
