# Skill Discovery

[English](../en/skill-discovery.md) · [简体中文](skill-discovery.md) · [繁體中文](../zh-TW/skill-discovery.md)

本项目以 AI Agent skill 形式实现。不同 Agent 通过各自的 skill/rule discovery 机制加载 —— 机制不同，契约一致。

### 安装载荷

安装到技能目录时，只从发布 tarball（`ai-agent-governance-skill.tar.gz`）解出 **`SKILL.md` + `references/` + `scripts/` + `LICENSE`**。**不要**把本仓库 `git clone` 进 skills 目录——`docs/`、`tests/`、`package.json`、`.github/`、README、CONTRIBUTING、CHANGELOG、AGENTS.md 是仓库基础设施，不属于安装载荷。

解压前建议对照 Release Notes 中的 SHA-256。

### 工作原理

```
安装目录（按 Agent —— 见下表）
        |
        v
Agent 扫描 skill 元数据（frontmatter：name + description）
        |
        v
用户意图 → description 匹配（如 "initialize project governance"）
        |
        v
加载 SKILL.md → 执行工作流（INIT / AUDIT / RELEASE）
```

安装完成后，打开**你要治理的那个项目**，在对话里发送提示词（不是 shell 命令）：

```text
initialize project governance
```

其他常用提示词：`audit governance`、`release`。完整列表：[commands.md](commands.md)。

### 各 Agent 安装路径

| 位置 | 自动发现方 | 适合 |
| --- | --- | --- |
| `.cursor/skills/<name>/`（项目）或个人 Agent Store 的 `skills/` | Cursor | Cursor 用户 |
| `.agents/skills/<name>/`（项目或 `~/`） | opencode 及 Claude 兼容 Agent | 跨 Agent 共享 |
| `.claude/skills/<name>/` | opencode、Claude Code | Claude Code 生态 |
| `.opencode/skills/<name>/` | opencode | 仅 opencode |
| `~/.config/opencode/skills/<name>/` | opencode（全局） | 全机器 opencode |

- **Cursor** — 项目技能在 `.cursor/skills/`；个人技能在用户 Agent Store 的 `skills/`（不要用 `~/.cursor/skills-cursor/`，那是内置保留目录）。
- **Claude Code** — 读取 `.claude/skills/<name>/SKILL.md`，按 description 匹配。
- **opencode** — 自动扫描 `.opencode/skills`、`.claude/skills`、`.agents/skills`（项目级与全局）。
- **Codex / 其他** — 取决于各自加载实现；基于 AGENTS.md 的 Agent 仍遵循生成的运行时契约。

根目录 README 的「快速开始」与本表对齐；路径变更时两边一起改。
