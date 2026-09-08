# Skill Discovery

[English](skill-discovery.md) · [简体中文](../zh-CN/skill-discovery.md) · [繁體中文](../zh-TW/skill-discovery.md)

This project is implemented as an AI agent skill. Different agents load it through their own skill/rule discovery mechanisms — the mechanics differ per agent, the contract does not.

### Install Payload

When installing into a skill directory, copy **only** `SKILL.md` + `references/` + `scripts/` + `LICENSE`; `docs/`, `tests/`, `package.json`, `.github/`, README, CONTRIBUTING, CHANGELOG, AGENTS.md are repository infrastructure, not part of the skill payload — do not copy them.

### How It Works

```
installation directory (per agent: .agents/skills · .claude/skills · .opencode/skills · ...)
        |
        v
agent scans skill metadata (frontmatter: name + description)
        |
        v
user intent → description match (e.g. "initialize project governance")
        |
        v
SKILL.md loaded → workflow executes (INIT / AUDIT / RELEASE)
```

The frontmatter `description` is the matching key — it declares the trigger phrases the agent matches against. Users just type the prompt they want:

```text
initialize project governance
audit governance
release
```

Full prompt list and what each one does: [commands.md](commands.md)

### Per-Agent Notes

Install paths by agent:

| Location | Auto-discovered by | Best for |
| --- | --- | --- |
| `.agents/skills` | opencode + Claude-compatible agents | cross-agent sharing |
| `.claude/skills` | opencode, Claude Code | Claude Code ecosystem |
| `.opencode/skills` | opencode | opencode-only |
| `~/.config/opencode/skills` | opencode (global) | machine-wide for opencode |

- **Claude Code** — reads `.claude/skills/<name>/SKILL.md` and matches by metadata description.
- **opencode** — auto-scans `.opencode/skills`, `.claude/skills`, `.agents/skills` (project and global).
- **Cursor** — leans on `.cursor/rules` and agent rules; skill loading follows its own mechanism.
- **Codex / others** — depend on their skill-loading implementation; AGENTS.md-based agents apply the generated runtime contract regardless.

---
