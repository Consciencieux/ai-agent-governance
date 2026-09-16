# AI Agent Governance

> 面向 AI 编码 Agent 的仓库原生治理系统——规则、校验与发布控制存在于仓库中，而非对话上下文。

[![CI](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml/badge.svg)](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Consciencieux/ai-agent-governance)](https://github.com/Consciencieux/ai-agent-governance/releases)

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

## 快速开始

**1. 安装发布载荷**到你的 Agent 技能目录（不要 git clone 本仓库）：

| Agent | 安装路径 |
| --- | --- |
| Cursor | `.cursor/skills/ai-agent-governance/` 或个人 Agent Store 的 `skills/` |
| Claude Code / opencode（共享） | `~/.agents/skills/ai-agent-governance/` 或项目 `.agents/skills/…` |
| 仅 Claude Code | `.claude/skills/ai-agent-governance/` |
| 仅 opencode | `.opencode/skills/ai-agent-governance/` |

```bash
# 示例：共享 ~/.agents 路径——按上表换成你的目录
DEST=~/.agents/skills/ai-agent-governance
mkdir -p "$DEST"
curl -fsSL -o /tmp/ai-agent-governance-skill.tar.gz \
  https://github.com/Consciencieux/ai-agent-governance/releases/latest/download/ai-agent-governance-skill.tar.gz
# 校验（SHA-256 在 Release Notes 中）：
# shasum -a 256 /tmp/ai-agent-governance-skill.tar.gz
tar -xzf /tmp/ai-agent-governance-skill.tar.gz -C "$DEST"
```

**不要**把本仓库整仓 clone 进技能目录——安装载荷只包含 `SKILL.md` + `references/` + `scripts/` + `LICENSE`。完整发现说明：[skill-discovery.md](docs/product/zh-CN/skill-discovery.md)。

**2. 打开你要治理的那个项目**，在编码 Agent 对话里发送：

```text
initialize project governance
```

**3. 初始化之后**，常用后续操作：

| 提示词 | 功能 |
| --- | --- |
| `audit governance` | 对已治理项目做健康检查，检测漂移 |
| `release` | 人在环版本发布，附带证据 |
| `governance check` | 快速校验 |

完整提示词清单 → [commands.md](docs/product/zh-CN/commands.md)。

## 它做什么

AI 编码 Agent 行动很快，但不会自动继承架构约束、同步规则或维护流程。修改悄悄退化；下一个 Agent 从退化状态继续。

本项目在你的仓库内部生成一套治理环境——受跟踪的规则、自动校验、漂移检测与人工受控的发布流程——让约束在 Agent 会话之间持续有效。

## INIT 生成什么

一个治理骨架（代表性路径——[完整带注释清单](docs/product/zh-CN/bootstrap-output.md)）：

```text
my-project/
├── AGENTS.md                      # Agent 规则（从模板生成）
├── CHANGELOG.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── features/                  # 功能注册表
│   ├── plans/                     # 开发计划
│   └── rules/                     # 治理规则（生命周期、Git、安全……）
├── .governance/
│   ├── manifest.json              # 期望态
│   ├── state.json                 # 当前态
│   └── generated/skills/          # 持续工作的子技能
├── scripts/                       # 校验器、密钥扫描、发布管理
└── .github/workflows/ci.yml       # CI 门禁
```

具体契约（输入、工件、脚本、规则）由 [init-spec.json](references/init-spec.json) 与 [sub-skills.md](references/instruction/sub-skills.md) 定义。

## 治理生命周期

| 阶段 | 发生什么 |
| --- | --- |
| **INIT** | 检查环境 → 生成规则、AGENTS.md、功能注册表、CI、校验器 → 记录初始状态 |
| **OPERATE** | 生成的规则与子技能治理每一次 Agent 会话；按项目锁串行化多 Agent 工作 |
| **VALIDATE** | 零依赖校验器检查仓库健康；漂移检测对比期望态与现实 |
| **AUDIT** | 汇总活动记录，验证全部治理事实 |
| **RELEASE** | 人在环：分析变更 → SemVer 提案 → 审批 → 带证据发布 |

状态模型：[governance-model.md](docs/product/zh-CN/governance-model.md)。Agent 六阶段操作生命周期：[lifecycle.md](docs/product/zh-CN/lifecycle.md)。

## 核心特性

- **仓库原生** —— 治理存在于仓库中，与代码一起版本化
- **生命周期驱动** —— 规则在整个项目生命周期中被维护与审计
- **失败时默认阻断** —— 承诺的机制未运行时，门禁中止流程
- **工具中立** —— 核心说 `AGENTS.md`；按工具适配器服务 Cursor、Claude Code、opencode、Codex

## 文档

- [overview.md](docs/product/zh-CN/overview.md) — 治理能力总览：治理了什么、怎么落地
- [commands.md](docs/product/zh-CN/commands.md) — 完整提示词清单
- [bootstrap-output.md](docs/product/zh-CN/bootstrap-output.md) — 带注释的 INIT 输出
- [governance-model.md](docs/product/zh-CN/governance-model.md) — Spec / Status / Health 状态模型
- [architecture.md](docs/product/zh-CN/architecture.md) — 仓库布局与分发角色
- [lifecycle.md](docs/product/zh-CN/lifecycle.md) — Agent 操作生命周期
- [validator.md](docs/product/zh-CN/validator.md) — 校验器用法与检查项
- [anti-regression.md](docs/product/zh-CN/anti-regression.md) — 防乱改机制
- [skill-discovery.md](docs/product/zh-CN/skill-discovery.md) — Agent 如何发现 skill
- [docs/README.md](docs/README.md) — 文档知识体系
- [glossary.md](docs/glossary.md) — 三语术语对照表
- [路线图](docs/plans/roadmap/zh-CN.md) · [设计决策](docs/design-decisions/) · [CHANGELOG](CHANGELOG.md)

## 贡献

参见 [CONTRIBUTING.zh-CN.md](CONTRIBUTING.zh-CN.md)。本仓 CI 阻断权威：`npm run check:must-ship`。

## License

[MIT](LICENSE) © 2026 Consciencieux
