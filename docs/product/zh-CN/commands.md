# Commands

[English](../en/commands.md) · [简体中文](commands.md) · [繁體中文](../zh-TW/commands.md)

以下全部是**给 AI 编码 Agent 的聊天提示语——不是 shell 命令**。它们遵循治理生命周期：**初始化 → 开发 → 持续维护 → 发布**。

### 可用提示词

| 使用场景 | 提示词 | 别名 |
| --- | --- | --- |
| 新仓库 / 首次接入 | `initialize project governance` | `initialize governance` · `setup project for AI agents` · `create AGENTS.md framework` |
| 开发任务写计划 | `plan this task` | `create task plan` · `update development plan` · `check off milestone` · `mark task completed` |
| 已有治理仓库的持续维护 | `audit governance` | `governance health check` · `fix governance drift` |
| 治理漂移报告 | `check governance drift` | `governance health report` · `is governance intact` |
| 仓库检测 | `inspect the repo` | `what is the stack` · `check environment` |
| CI 搭建 | `setup CI` | `add CI` · `create workflow` |
| 治理校验 | `governance check` | `verify governance` · `validate AGENTS` |
| 状态记录 | `update state` | `record progress` |
| 审查改动或项目 | `review this` | `review the changes` · `audit recent changes` · `review my changes` · `审核一下` · `review the whole project` · `deep review` |
| 准备发布版本 | `release` | `publish version` · `create release` · `/release vX.Y.Z` |

Git 工作流治理没有独立提示词——它作为运行期规则自动生效：任务开始前自动运行 `scripts/check-git-policy.js`，在 `.governance/git-policy.json` 设定 `directPush: false` 时门控受保护分支的直接推送。Git 写操作（`commit` / `push` / `tag`）需用户明确授权——写指令或 IDE 的暂存-提交-推送确认即为同意；Agent 执行后汇报（见 `docs/rules/git-policy.md`）。

### 关键提示词

#### initialize project governance

为仓库引导治理地基：AGENTS.md、规则、Feature 登记、治理状态、校验系统、CI。

```
仓库检测 → 生成地基 → 创建状态 → 配置规则 → 配置校验 → 配置 CI → 报告
```

详细输出：[bootstrap-output.md](bootstrap-output.md)。

#### audit governance

对已治理项目做健康检查：检测漂移、校验工件、应用最小补丁。

#### release

人在环版本发布。Proposal 含风险分级（低 / 中 / 高）。

```
分析变更 → SemVer Proposal + 风险分级 → 批准 → tag → 推送已批准分支与 tag（GitHub Release 按项目约定）
```

#### review this

深度 × 范围二维审查：轻量（`review this`）或全量（`deep review`）；默认本次变更集，加路径或 `review the whole project` 改变范围。

### 生成的 Skills

INIT 在 `.governance/generated/skills/<name>/SKILL.md` 下生成子技能；项目的 `AGENTS.md` 包含运行时索引。用户通过上面的提示词交互。

| 组件 | 触发词 | 职责 |
| --- | --- | --- |
| drift-check | `check governance drift` · `governance health report` · `is governance intact` | 将 manifest 与现实比对；模式：activity-report、freshness、consistency |
| governance-validator | `governance check` · `verify governance` · `validate AGENTS` | 运行校验器，记录 `validation.json` |
| ci-generator | `setup CI` · `add CI` · `create workflow` | 为检测到的技术栈生成 CI 管线 |
| repository-inspection | `inspect the repo` · `what is the stack` · `check environment` | 检测环境，返回技术栈报告 |
| state-manager | `update state` · `record progress` | 把进度持久化到 `.governance/state.json` |
| plan-manager | `plan this task` · `create task plan` · `update development plan` · `check off milestone` · `mark task completed` · `archive completed plan` | 创建 TASK 计划、勾选里程碑、发布时归档 |
| review-manager | `review this` · `review the changes` · `audit recent changes` · `review my changes` · `审核一下` · `deep review` · `full review` · `全面审查` · `彻底审查` · `逐行审查` · `review the whole project` · `全项目审核` · `audit everything` · `全项目彻查` | 深度 × 范围审查（轻量/全量 × 变更集/指定路径/全项目） |
| release-manager | `release` · `publish version` · `create release` · `/release vX.Y.Z` | 执行带审批门禁的发布流程 |

### 执行规则

任何结果不确定的提示词都会暂停并请求澄清——绝不静默猜测。

---
