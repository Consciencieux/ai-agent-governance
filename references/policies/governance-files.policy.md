# 治理文件清单（单一事实源）

本文件是「治理文件保护」与 `.governance/` Git 跟踪策略的**唯一清单来源**。SKILL.md 的「治理文件保护」节、生成的 AGENTS.md（`references/templates/agents-md.template.md`）、`docs/rules/git-policy.md` 中的清单均以本文件为准；生成物必须内嵌同一份清单（目标项目不引用本仓库文件）。

## 受保护文件（修改需走「治理文件保护」流程）

防止 Agent 自我解除限制，修改以下文件必须：**说明原因 → 更新 CHANGELOG → 更新 `.governance/manifest.json` 的 `governance_version` → 运行 `scripts/verify-governance.js`**。涉及**权限/安全/删除保护/校验步骤**的修改必须用户**明确确认**；未经用户明确同意不得删除权限限制、不得放宽 Git Policy、不得移除校验步骤。

| 路径 | 性质 |
| --- | --- |
| `AGENTS.md` / `CLAUDE.md` | 行为规范入口 |
| `docs/rules/**` | 规则文件 |
| `.governance/manifest.json` | 治理工件清单（期望态） |
| `.governance/preflight.json` | 回滚快照 |
| `.governance/git-policy.json` | Git 工作流策略 |
| `.governance/sync-rules.json` | 项目同步组声明（Phase 5 对照执行） |
| `scripts/verify-governance.js` | 校验门禁 |
| `scripts/check-lock.js` | 锁检查 |
| `scripts/check-git-policy.js` | Git 策略门禁 |
| `scripts/check-secrets.js` | 密钥扫描门禁 |
| `scripts/check-sync.js` | 同步组门禁 |
| `scripts/check-doc-consistency.js` | 文档一致性门禁 |
| `scripts/check-doc-freshness.js` | 文档新鲜度 + 译文新鲜度检查（默认建议性；`--release-gate` fail-closed） |
| `.githooks/pre-commit` | 暂存内容一致性门禁（默认不启用） |
| `.githooks/commit-msg` | 已确认提交消息门禁（默认不启用） |
| `opencode.json` | Agent 配置 |
| `.github/workflows/**` | CI 配置 |
| `.gitlab-ci.yml` | CI 配置（GitLab 平台） |

## .governance/ Git 跟踪策略

**Tracked governance state（validator required artifacts）**：

| 文件 | 性质 | Git |
| --- | --- | --- |
| `manifest.json` | 期望态（唯一索引） | 提交 |
| `state.json` | 治理状态（当前态） | 提交 |
| `preflight.json` | 回滚快照 | 提交 |
| `git-policy.json` | Git 工作流策略 | 提交 |
| `sync-rules.json` | 同步组声明（Phase 5 对照执行） | 提交 |
| `generated/skills/` | 治理产物 | 提交 |
| `docs/plans/archive/` | 归档的已完成 TASK 计划（治理历史；非 validator 必查，但必须提交） | 提交 |

**Runtime outputs（validator 不要求，git 忽略）**：

| 文件 | 性质 | Git |
| --- | --- | --- |
| `validation.json` | 临时观测结果 | 忽略 |
| `drift-report.json` | 运行报告 | 忽略 |
| `release-proposal.json` | Release Proposal 审批证据 | 忽略 |
| `activity.jsonl` | Agent 行为审计轨迹（追加式） | 忽略 |
| `consent.json` | 钩子确认凭证（运行时输出） | 忽略 |

`validation.json` / `drift-report.json` / `release-proposal.json` / `activity.jsonl` / `consent.json` 由 AUDIT/RELEASE/任务运行产生，**不作为 required artifact**——fresh-checkout CI 必须无它们也通过。

## .governance/README.md 生成模板

INIT 生成 `.governance/` 目录时应同时生成 README.md：

```
# .governance

This directory stores AI Agent Governance state.

Tracked:
- manifest.json
- state.json
- preflight.json
- git-policy.json
- sync-rules.json
- generated/

Ignored:
- validation.json
- drift-report.json
- release-proposal.json
- activity.jsonl
- consent.json

Do not delete manually.
```
