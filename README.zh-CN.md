# AI Agent Governance

> 面向 AI 编码 Agent 的仓库原生治理系统。
> 将 AI Agent 行为视为仓库基础设施。

[![CI](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml/badge.svg)](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Consciencieux/ai-agent-governance)](https://github.com/Consciencieux/ai-agent-governance/releases)

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

## 它是什么

AI Agent Governance 不是单纯的提示词包（prompt pack），也不是 `AGENTS.md` 生成器。它将 Agent 行为、仓库约束与验证机制转化为受跟踪、持续校验的仓库基础设施——治理存在于仓库中，而非只存在于对话上下文或文档中。

## 为什么存在

AI 编码 Agent 在仓库中行动很快，但不会自动继承工程上下文、架构约束或维护机制。失败链是真实的：

```
agent 修改代码
→ 忘记同步相关文件
→ 绕过规则
→ 破坏仓库状态
→ 下一个 Agent 从被破坏的状态继续
→ 问题持续扩大
```

本项目源自一个真实的多 Agent GitHub 协作工作流，在那里仅靠 prompt 的协调反复无法保全仓库约束与状态一致性。它已从一份小型 Agent 指令演化为仓库级治理系统。

## 如何工作

治理生命周期在仓库内部运行，跨越五个阶段：

| 阶段 | 发生什么 |
| --- | --- |
| INIT | 检查环境，生成规则、`AGENTS.md`、功能注册表、CI 与校验器，然后记录初始状态。 |
| OPERATE | 生成的 `AGENTS.md` 与子技能治理每一次 Agent 会话；按项目锁串行化多 Agent 工作。 |
| VALIDATE | 零依赖校验器检查仓库健康；漂移检测对比清单（期望态）与现实（观测态）。 |
| AUDIT | 巡检汇总活动记录并验证全部治理事实——从文档一致性到规则捕获。 |
| RELEASE | 人在环流程分析变更历史、提出 SemVer 版本并发布——基于证据，而非虚构。 |

这些阶段背后的 Spec / Status / Health 状态模型记录在 [docs/product/zh-CN/governance-model.md](docs/product/zh-CN/governance-model.md)。

这是仓库级治理生命周期。Agent 单次任务的六阶段操作生命周期单独记录在 [docs/product/zh-CN/lifecycle.md](docs/product/zh-CN/lifecycle.md)。

```
   AI Agent
      │
      ▼
 治理规则               规则 · 策略 · Agent 指引
      │
      ▼
 仓库状态               期望态 · 当前态 · 仓库知识
      │
      ▼
 验证                   校验 · 漂移检测 · 测试 · 巡检
      │
      ▼
 人工受控发布            评审 · 批准 · 版本化
      │
      └──────────────► 回到仓库
```

## 它治理什么

| 领域 | 示例 |
| --- | --- |
| Agent 行为 | 权限矩阵、多 Agent 锁、规则优先级 |
| 仓库状态 | 清单（期望态）· 状态（当前态）· 校验（观测态） |
| 文档与知识 | 功能注册表、计划、规则、翻译新鲜度 |
| Git 操作 | 保护分支、基于分支的开发、受控回滚 |
| 发布 | SemVer 提案、人工审批、标签版本一致性 |

## 它有何不同

| 维度 | 含义 |
| --- | --- |
| 仓库原生 | 治理存在仓库中，而非对话上下文或外部平台 |
| 生命周期驱动 | 规则在整个项目生命周期中被维护与被巡检 |
| 失败时默认阻断 | 当承诺的机制实际未运行时，门禁中止流程 |
| 工具中立 | 核心说 `AGENTS.md`；按工具适配器服务特定 Agent |

通过一次初始化建立治理环境，并通过持续验证维持其完整性与一致性：

```
initialize project governance
```

完整可用提示词清单见 [docs/product/zh-CN/commands.md](docs/product/zh-CN/commands.md)。

## 快速开始

**1. 安装发布载荷**（不要 `git clone` 本仓库）到你的 Agent **实际会扫描**的 skill 目录。

| Agent | 常见安装路径 |
| --- | --- |
| Cursor | 项目：`.cursor/skills/ai-agent-governance/` · 或个人 Agent Store 的 `skills/` |
| Claude Code / opencode（共享） | `~/.agents/skills/ai-agent-governance/` 或项目 `.agents/skills/…` |
| Claude Code | `.claude/skills/ai-agent-governance/` |
| 仅 opencode | `.opencode/skills/ai-agent-governance/` |

示例（共享 `.agents` 路径——按上表换成你的目录）：

```bash
DEST=~/.agents/skills/ai-agent-governance
mkdir -p "$DEST"
curl -fsSL -o /tmp/ai-agent-governance-skill.tar.gz \
  https://github.com/Consciencieux/ai-agent-governance/releases/latest/download/ai-agent-governance-skill.tar.gz
# 可选：对照 Release Notes 中的 SHA-256 校验后再解压
tar -xzf /tmp/ai-agent-governance-skill.tar.gz -C "$DEST"
```

**不要**把本仓库整仓 clone 进 skills 目录——会带上不属于安装载荷的 `docs/`、`tests/` 等。完整发现说明：[docs/product/zh-CN/skill-discovery.md](docs/product/zh-CN/skill-discovery.md)。

**2. 打开你要治理的那个项目**，在编码 Agent 对话里发送下面这句提示词（不是 shell 命令）：

```text
initialize project governance
```

**之前** —— 一个普通项目：

```text
my-project/
├── src/
└── package.json
```

**之后** —— 治理环境被建立（代表性结构）：

```text
my-project/
├── AGENTS.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── plans/
│   └── rules/
├── .governance/
├── scripts/
└── .github/workflows/
```

完整带注释的初始化输出：[docs/product/zh-CN/bootstrap-output.md](docs/product/zh-CN/bootstrap-output.md)。

## 生成的环境

INIT 生成一个治理骨架，其具体契约（输入、工件、安装的脚本、规则文件与生成的子技能）由 [references/init-spec.json](references/init-spec.json) 与 [references/instruction/sub-skills.md](references/instruction/sub-skills.md) 定义。

## 文档

- [docs/README.md](docs/README.md) — 文档知识体系：文档类型边界、语言政策、生命周期总览
- [docs/product/zh-CN/skill-discovery.md](docs/product/zh-CN/skill-discovery.md) — Agent 如何发现并触发 skill
- [docs/product/zh-CN/commands.md](docs/product/zh-CN/commands.md) — 完整提示词清单与运行时组件
- [docs/product/zh-CN/bootstrap-output.md](docs/product/zh-CN/bootstrap-output.md) — 完整带注释的初始化输出
- [docs/product/zh-CN/governance-model.md](docs/product/zh-CN/governance-model.md) — Spec / Status / Health 状态模型
- [docs/product/zh-CN/architecture.md](docs/product/zh-CN/architecture.md) — 仓库布局与三种分发角色
- [docs/product/zh-CN/anti-regression.md](docs/product/zh-CN/anti-regression.md) — 防乱改机制完整明细
- [docs/product/zh-CN/lifecycle.md](docs/product/zh-CN/lifecycle.md) — Agent 六阶段操作生命周期
- [docs/product/zh-CN/validator.md](docs/product/zh-CN/validator.md) — 校验器用法与检查项
- [docs/plans/roadmap/zh-CN.md](docs/plans/roadmap/zh-CN.md) — 带状态与设计文档的路线图
- [docs/design-decisions/](docs/design-decisions/) — 架构决策记录（ADR，简体中文）
- [docs/glossary.md](docs/glossary.md) — 三语术语对照表
- [CONTRIBUTING.zh-CN.md](CONTRIBUTING.zh-CN.md) — 开发指南
- [CHANGELOG.md](CHANGELOG.md) — 发布历史

## 当前版本

从 [Releases → latest](https://github.com/Consciencieux/ai-agent-governance/releases/latest) 安装（`ai-agent-governance-skill.tar.gz`）。源码树版本见 `package.json` / `SKILL.md`。必装 INIT / AUDIT / RELEASE 可在干净目标上跑；本仓 CI 阻断权威是 `npm run check:must-ship`。详见 [CHANGELOG.md](CHANGELOG.md) 与 [docs/plans/roadmap/zh-CN.md](docs/plans/roadmap/zh-CN.md)。

## License

[MIT](LICENSE) © 2026 Consciencieux
