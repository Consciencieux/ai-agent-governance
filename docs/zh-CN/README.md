# AI Agent Governance

> 将 AI Agent 行为作为仓库基础设施进行版本控制和生命周期管理。

[![CI](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml/badge.svg)](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Consciencieux/ai-agent-governance)](https://github.com/Consciencieux/ai-agent-governance/releases)

[English](../../README.md) · [简体中文](README.md) · [繁體中文](../zh-TW/README.md)

**一条命令为你的仓库搭建完整的 AI 编码 Agent 工程环境 —— AGENTS.md、规则、Feature 登记、CI 与校验器 —— 并在整个项目生命周期中持续校验与维护。**

### 为什么需要

AI 编码 Agent 能快速生成和修改代码，但它不会自动拥有项目的工程上下文、架构约束和长期维护机制。

每个新项目开始时，开发者仍然需要手动建立：

- AGENTS.md
- CHANGELOG.md
- 架构文档
- Feature 登记
- 编码规范
- Git 工作流
- CI 检查
- 安全基线

这些规则通常只存在于文档或聊天上下文中，容易随着时间、人员和 Agent 更替而失效。

本 Skill 将这些治理能力转化为仓库级基础设施：第一天自动搭建治理体系，并在项目整个生命周期中持续验证、维护和防止漂移。

### 解决方案

生成的产物是仓库基础设施，而非静态模板 —— 像代码一样被跟踪（`manifest.json` 期望态 · `state.json` 当前态 · `validation.json` 观测态），并由漂移检测、验证门禁、防乱改与发布生命周期持续校验。

**先初始化，再持续治理（Initialize first, govern continuously）。**

| 现有方案 | 局限 |
| --- | --- |
| Prompt 包（CLAUDE.md） | 仅指令 —— 无校验、无生命周期 |
| AGENTS.md 模板 | 一次性静态引导 —— 无人维护 |
| CI 规则 | 只管代码 |
| 企业级 AI 治理 | 在仓库之外 |
| **AI Agent Governance** | **一键引导 + 生命周期校验 + 漂移防护，作为仓库基础设施** |

### 安装

这是 AI Agent skill，不是 CLI —— 把它放到你的编码 Agent 能发现 skill 的位置：

```
.agents/skills/ai-agent-governance/SKILL.md
```

**推荐——从发布载荷 tarball 安装**（只含 `SKILL.md` + `references/` + `scripts/` + `LICENSE`，无任何多余文件）：

```bash
mkdir -p ~/.agents/skills/ai-agent-governance
curl -L https://github.com/Consciencieux/ai-agent-governance/releases/latest/download/ai-agent-governance-skill.tar.gz \
  | tar -xz -C ~/.agents/skills/ai-agent-governance
```

若下载超时（GitHub release 重定向可能较慢），改用下面的备选方案。

**备选——clone 后只复制载荷。** skill 只包含 `SKILL.md` + `references/` + `scripts/` + `LICENSE`；其余内容（`docs/`、`tests/`、`package.json`、`.github/`、`README`、`CONTRIBUTING`、`CHANGELOG`、`AGENTS.md`）是仓库基础设施，**不要**复制进 skill 安装目录。

```bash
git clone https://github.com/Consciencieux/ai-agent-governance
mkdir -p ~/.agents/skills/ai-agent-governance
cp -R SKILL.md references scripts LICENSE ~/.agents/skills/ai-agent-governance/
```

skill 通过各 Agent 原生的 skill/rule discovery 机制被发现。按 Agent 的安装路径（`.claude/skills`、`.opencode/skills` 等）：[docs/zh-CN/skill-discovery.md](skill-discovery.md)

### 快速开始

**这是聊天提示语（chat prompt），不是 shell 命令。** 在你的 AI 编码 Agent 聊天窗口里说：

```text
initialize project governance
```

**之前：**

```
my-project/
├── src/
└── package.json
```

**之后：**

```
my-project/
├── AGENTS.md
├── CLAUDE.md
├── CHANGELOG.md
├── README.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── plans/
│   ├── features/
│   └── rules/
├── .env.example
├── .governance/
├── scripts/
└── .github/workflows/
```

一句话 —— 你的项目就拥有完整治理环境，任何兼容 AGENTS.md 的 Agent 都能直接使用。完整生成文件集见 [docs/zh-CN/bootstrap-output.md](bootstrap-output.md)。

全部可用提示词（巡检、发布、漂移检查等）及其行为：[docs/zh-CN/commands.md](commands.md)。

### 常用提示词

| 场景 | 提示词 |
| --- | --- |
| 首次接入 | `initialize project governance` |
| 开发任务写计划 | `plan this task` |
| 已治理仓库健康检查 | `audit governance` |
| 治理漂移报告 | `check governance drift` |
| 检测技术栈 | `inspect the repo` |
| 生成 CI | `setup CI` |
| 治理校验 | `governance check` |
| 记录任务状态 | `update state` |
| 发布版本 | `release` |


### 核心能力（Core Capabilities）

#### 引导与运行期治理（Bootstrap & Runtime Governance）

- **治理引导（Governance bootstrap）** — 一次 INIT 搭好骨架：仓库检测 → 规则 → AGENTS.md → Feature 登记 → CI → 校验器 → 状态
- **运行期治理（Runtime governance）** — 生成的 AGENTS.md + 按工具生成的适配层约束每个会话；多语言 CI + 格式基线（Node/TS、Python、Rust、Go、Java、C++）
- **结构适配（Structural adaptivity）** — 成熟度自适应策略（L0 空仓库 → L3 生产），只合并不迁移

#### 漂移检测与验证（Drift Detection & Validation）

- **漂移检测（Drift detection）** — `drift-check` 将 manifest 与现实比对，报告治理腐化
- **验证门禁（Validation gates）** — 零依赖校验器在治理工件缺失时让 CI 失败
- **行为审计（Activity audit）** — 追加式 `.governance/activity.jsonl` 逐任务轨迹（"哪个 Agent 何时、做了什么、结果如何"），可由 drift-check 报告消费
- **密钥扫描门禁（Secret scanning gate）** — `scripts/check-secrets.js` 阻止含密钥材料的提交（只读，绝不打印密钥）

#### 防乱改（Anti-Regression）

与静态规则文件不同，AI Agent Governance 持续保护项目知识不漂移，让后续使用的 Agent 或开发者不会破坏已有治理成果：

- **生命周期强制** — 每次变更都遵循 Understand → Plan → Implement → Validate → Synchronize → Report
- **受保护治理** — 治理文件无法被静默削弱（说明原因 → CHANGELOG → 升版本 → 跑校验器）
- **基于证据的报告** — 状态基于真实校验输出，绝不伪造

完整机制（权限矩阵、删除保护、规则优先级、多 Agent 锁）：[docs/zh-CN/anti-regression.md](anti-regression.md)

#### Git 工作流治理（Git Workflow Governance）

守卫 Agent 最易造成不可逆损害的地方 —— Git 操作：

- **受保护分支** —— `.governance/git-policy.json` 阻止直推 `main`/`master`（`directPush: false`、`allowForcePush: false`）
- **分支开发** —— Agent 检查策略、创建 `feature/agent-<日期>-<摘要>`、经 PR 人工批准后合入
- **受控回滚** —— revert/reset/restore 仍是工具，由确认门禁治理

#### 发布生命周期（Release Lifecycle）

发布走 Human-in-the-loop 流程 —— **AI 提议，人确认**：

```
分析变更 → 生成 SemVer Proposal → 开发者批准 → 创建 tag → GitHub Release
```

- **分析** — `release-manager` 检查 git 历史与变更分类（SemVer 2.0.0），产出 Release Proposal（当前版本 / 推荐版本 / 发布类型 / 理由 / 风险等级 / 审核建议 / Release Notes）—— 只读
- **批准** — 任何写操作前开发者必须明确确认；不确定性（Potential Breaking Change）暂停流程并请求澄清
- **执行** — 批准后执行：annotated tag → push → GitHub Release，版本一致（synchronized versions）。规范：[references/workflows/release.md](../../references/workflows/release.md)

### 支持的 Agent

Claude Code · Cursor · Codex · opencode —— 以及其他基于 AGENTS.md 的 Agent。内核与工具无关；兼容性来自按工具生成的适配层（CLAUDE.md、.cursor/rules、copilot-instructions.md、opencode.json）。

### 文档

- [docs/zh-CN/skill-discovery.md](skill-discovery.md) — Agent 如何发现并触发 skill
- [docs/zh-CN/commands.md](commands.md) — 用户提示词 + 运行时组件
- [docs/zh-CN/bootstrap-output.md](bootstrap-output.md) — 完整带注释的初始化产物
- [docs/zh-CN/governance-model.md](governance-model.md) — Spec / Status / Health 状态模型
- [docs/zh-CN/architecture.md](architecture.md) — 仓库布局（各目录用途）
- [docs/zh-CN/anti-regression.md](anti-regression.md) — 防乱改机制完整明细
- [docs/zh-CN/lifecycle.md](lifecycle.md) — Agent 六阶段操作生命周期
- [docs/zh-CN/validator.md](validator.md) — 校验器用法与检查项
- [docs/design-decisions/](../design-decisions/) — 架构决策记录（ADR，简体中文）
- [docs/zh-CN/roadmap.md](roadmap.md) — 待开发功能与状态
- [docs/glossary.md](../glossary.md) — 三语术语对照表
- [CONTRIBUTING.md](CONTRIBUTING.md) — 开发指南
- [CHANGELOG.md](../../CHANGELOG.md) — 发布历史

### Roadmap

接下来：多 Agent 协调协议 · Skill 生命周期管理 · 远程治理看板 · monorepo 多治理域。

完整路线图与设计文档：[docs/zh-CN/roadmap.md](roadmap.md)


### License

[MIT](../../LICENSE) © 2026 Consciencieux
