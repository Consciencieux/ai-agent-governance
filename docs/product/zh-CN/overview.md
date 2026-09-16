# 治理能力总览

[English](../en/overview.md) · [简体中文](overview.md) · [繁體中文](../zh-TW/overview.md)

## 这是什么

`ai-agent-governance` 是一个可安装的 AI Agent Skill。它把治理框架写进目标仓库——规则、校验器、漂移检测、发布管控——使约束在 Agent 会话间存续，而非随上下文丢失。

与具体 AI 工具无关：Claude Code、Cursor、opencode、Codex 均可使用。

## 治理了哪些事

| 治理关切 | 规则在哪（读） | 机械兑现（跑） |
| --- | --- | --- |
| 密钥扫描 / 勿回显 | `docs/rules/security.md` | `scripts/check-secrets.js`（CTRL-0001） |
| Git 写确认 / 分支保护 | `docs/rules/git-policy.md` | `scripts/check-git-policy.js`（CTRL-0002） |
| 治理文件保护 | `docs/rules/governance-files.md` | 手动流程（reason → CHANGELOG → bump → verify） |
| 治理校验 | `AGENTS.md` 校验序列 | `scripts/verify-governance.js` |
| 文档新鲜度 / 翻译新鲜度 | `docs/rules/lifecycle.md` § Phase 4 报告层 | `scripts/check-doc-freshness.js`（CTRL-0003/0004） |
| 文档一致性 | `docs/rules/lifecycle.md` § Phase 4 报告层 | `scripts/check-doc-consistency.js`（CTRL-0006） |
| 同步组 | `docs/rules/capabilities/sync-groups.md` | `scripts/check-sync.js` |
| 计划同步 | `docs/rules/capabilities/plan-sync.md` | `scripts/check-plan-sync.js` |
| 发布管控 | `docs/rules/capabilities/release-orchestration.md` | `scripts/release-manager.js` |
| 漂移巡检 | 生成子技能 `drift-check` | 按模式调各脚本 |
| 代码变更归位 / 残留清理 | `docs/rules/coding.md` | Agent 判断 |
| 证据分层 / 测试保护 | `docs/rules/testing.md` | Agent 判断 |
| 工程克制 / 文件行数 | `docs/rules/coding.md` | `scripts/check-file-size-budget.js` |
| 生命周期（6 阶段） | `docs/rules/lifecycle.md` | Agent 流程 |
| 确定性初始化 | `docs/rules/capabilities/deterministic-init.md` | `scripts/generate-governance.js` |

上表列出的路径均为**被治理项目**视角（INSTALLED 路径）。完整义务分类见 `docs/rules/capability-enforcement.json`。

## 落地方式

治理不靠单一文件。每个关切有三层，按需加载：

```
政策（读）          脚本（跑）          任务卡（做）
docs/rules/*.md  →  scripts/*.js     →  docs/rules/capabilities/*.md
常驻规则正文          机械门禁 / 报告       有独立步骤才有叶
```

- **政策**（`docs/rules/*.md`）：Agent 和人都读的常驻规则。由 INIT 从 skill 的 `references/policies/` 复制。
- **脚本**（`scripts/*.js`）：零依赖 Node 门禁，CI 或 Agent 跑，退出码即证据。由 INIT 从 skill 的 `scripts/` 复制。
- **能力叶**（`docs/rules/capabilities/*.md`）：只在任务有独立步骤时存在（如确定性初始化、发布编排、审计漂移）。不是功能总目录——政策和脚本覆盖的关切不一定有同名叶。
- **生成子技能**（`.governance/generated/skills/`）：INIT 生成的 Agent 模块，接管日常任务（巡检、校验、发布、状态记录等）。

### 功能入口优先级

| 谁 | 从哪进 |
| --- | --- |
| 被治理项目的 Agent | `AGENTS.md`（自动加载）→ `docs/rules/` → 生成子技能 |
| 开发者 | `scripts/` 命令行 · `docs/rules/` 规则 · `.governance/` 状态文件 |
| Skill 执行器 | `SKILL.md` 路由表（读/跑两列） |

## 下一步

- **安装** → [skill-discovery.md](skill-discovery.md)
- **提示词 / 子技能** → [commands.md](commands.md)
- **INIT 产出** → [bootstrap-output.md](bootstrap-output.md)
- **状态模型** → [governance-model.md](governance-model.md)
- **防回归** → [anti-regression.md](anti-regression.md)
- **本仓布局** → [architecture.md](architecture.md)

---
