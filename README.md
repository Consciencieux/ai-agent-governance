# AI Agent Governance

面向日常软件开发的 Skills。帮助 Agent 完成功能、修复、重构、删除、测试与项目知识维护。

## 使用

安装后，直接在目标项目提出开发任务：

> 修复这个过期边界错误，检查单条处理和批量处理中的同类问题，并补充测试。

> 把这段重复逻辑归到正确的模块，移除旧实现和相关残留。

> 只读审查这次改动，重点看行为正确性、过度工程和测试有效性。

三个入口各自负责实际产物：

| Skill | 用途 |
| --- | --- |
| `ai-agent-governance` | 日常实现、诊断、重构和修订 |
| `agent-review` | 独立只读审查，给出具体问题和处理决定 |
| `agent-project` | 明确请求的项目接入、治理巡检、CI 和发布 |

日常任务可直接开始。需要项目长期约定时，将[项目指令片段](assets/project-instructions.md)并入实际入口。

## 安装

下载构建出的 `ai-agent-governance-skills.zip`，将其中三个完整目录放到同一个客户端 Skills 目录。Codex/OpenCode 可使用 `~/.agents/skills/`；Claude Code 使用 `~/.claude/skills/`；Cursor 项目技能使用 `.cursor/skills/`。详细步骤及官方来源见[安装说明](docs/install.md)。

## 从源码构建

Python 3.11 或更新版本：

```bash
python -m pip install -r requirements-dev.txt
python -m unittest discover -s tests -v
python scripts/package_skills.py --check-only
python scripts/package_skills.py --output-dir dist
```

`dist/` 生成安装 ZIP 和 `SHA256SUMS`。构建使用 PyYAML 与 markdown-it-py；安装后的 Skills 依托目标项目和宿主的现有工具工作。

[架构](docs/architecture.md) · [行为评估](evals/README.md) · [MIT License](LICENSE)
