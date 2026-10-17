# 安装与首次使用

## 安装整个套件

解压 `ai-agent-governance-skills.zip`，得到三个并列目录：

```text
ai-agent-governance/
agent-review/
agent-project/
```

三个目录放在同一 Skills 根目录，各自直接包含 SKILL.md。角色间的相对链接依赖这个布局。已有同名 Skill 时，整体替换该 Skill 目录；其余技能保持原样。

| 客户端 | 本项目使用的安装位置 |
| --- | --- |
| Codex CLI/IDE | 用户 `~/.agents/skills/` 或项目 `.agents/skills/` |
| Claude Code | 用户 `~/.claude/skills/` 或项目 `.claude/skills/` |
| OpenCode | 用户 `~/.agents/skills/` 或项目 `.agents/skills/`；也支持自身技能目录 |
| Cursor | 项目 `.cursor/skills/` |

位置依据下方官方文档核对于 2026-10-17。客户端在远程环境运行时，应把文件放到该环境或随项目提交的技能目录。

## 确认可发现与读取

打开目标项目，查看客户端可用技能列表，确认出现这三个名称。可先明确点名 `ai-agent-governance`，要求只读说明当前项目的相关命令及一项代码行为；再在临时副本中完成小修复。

检查工具记录中是否实际打开入口、核心与该动作需要的标准。缺少技能时先核对目录层级和客户端加载范围，再重新加载客户端。路径、规则、方法和完整正文都已随包提供。

需要自动保持项目工作方式时，把 assets/project-instructions.md 的四行内容合并到项目实际读取的入口。Codex 可使用 AGENTS.md，Claude Code 可使用 CLAUDE.md；已有入口先保留项目约定，再加入技能名称和用途。

## 官方文档

- [Agent Skills 文件格式](https://agentskills.io/specification)
- [Codex Skills](https://developers.openai.com/codex/skills)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)
- [OpenCode Skills](https://opencode.ai/docs/skills/)
- [Cursor Skills](https://cursor.com/help/customization/skills)
