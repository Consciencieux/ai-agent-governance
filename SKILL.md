---
name: ai-agent-governance
version: 2.1.1
description: >-
  Initialize, audit, or release AI-agent governance in a repository. Use for
  initialize project governance, initialize governance, setup project for AI agents,
  audit governance, governance health check, fix governance drift, release,
  publish version, check skill update, or update this skill — not ordinary app development.
---

# 治理引导

本 Skill 建立并巡检仓库内的 AI Agent 治理（不写业务代码）。工具中立。

**常驻硬规则在 `references/policies/`（权威正文）**；任务怎么做才进 `references/capabilities/`；编排骨架见 `skill-execution.md`。入口只做路由，不复写政策。方法论 → `references/principles/entry.md`（SKILL-INTERNAL）。

### 政策优先（读哪份常驻规则）

路径为 skill 包内源文件；INIT 后在被治理项目为 `docs/rules/<名>.md`（无 `.policy` 后缀）。

| 主题 | 读（policy） | 跑（若有） |
| --- | --- | --- |
| 运行期契约（SSOT / 优先级 / 权限 / 三态 / 反虚构 / 熔断…） | `runtime-invariants.policy.md` | — |
| 密钥 / secret、勿回显 | `security.policy.md` | `scripts/check-secrets.js` |
| Git 写确认 / 分支保护 / 凭证卫生 | `git.policy.md` | `scripts/check-git-policy.js` |
| 生命周期 / 根因修复 / 发现台账 / 文档报告层 | `lifecycle.policy.md` | `check-doc-consistency.js` · `check-doc-freshness.js` |
| 编码 / 变更归位 / 工程克制 | `coding.policy.md` | `scripts/check-file-size-budget.js`（顾问） |
| 测试 / 证据分层 / 可移植性 / 引用闭合 | `testing.policy.md` | — |
| 治理文件保护清单 | `governance-files.policy.md` | — |
| 发布工作流 | `workflows/release.md` | `scripts/release-manager.js` |

兑现分类库存：`capabilities/enforcement.v0.json`（可指向 policy 或能力叶）。

### 任务怎么做（能力叶 / 子技能）

有独立步骤时再读；**不是**功能总目录，也不替代上表政策。

| 任务信号 | 读 | 跑 |
| --- | --- | --- |
| Skill 编排（INIT / AUDIT / RELEASE） | `skill-execution.md` | — |
| INIT / 生成治理 | `deterministic-init.md` | `scripts/generate-governance.js` |
| AUDIT / drift | `audit-drift.md` | （卡内命令） |
| RELEASE 风险/编排叶 | `release-orchestration.md` · `release-risk-tiering.md` | （见上表 release） |
| manifest/state 工件 | `governance-state.md` + `init-spec.json` | — |
| 计划同步 | `plan-sync.md` | `scripts/check-plan-sync.js` |
| 同步组 | `sync-groups.md` | `scripts/check-sync.js` |
| 治理校验 | （看校验器输出） | `scripts/verify_governance.js` |
| Implementation Review | `review-mechanism.md` · `subskills/subskill-review-manager.md` | — |
| 生成子技能 | `generated-subskill-lifecycle.md` · `subskills/subskill-*.md` | （各子技能命令） |

## 进入模式

| 模式 | 触发 | 读 |
| --- | --- | --- |
| INIT | 无 manifest / L0–L1 / 明确初始化 | `skill-execution.md` → `deterministic-init.md` |
| AUDIT | 巡检 / drift | `skill-execution.md` → `audit-drift.md` |
| RELEASE | release / publish | `skill-execution.md` → `workflows/release.md` |

判定与阶段骨架 → `skill-execution.md`。每次任务仍受上表**政策**约束。
