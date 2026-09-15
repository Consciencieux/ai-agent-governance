# Skill Discovery

[English](skill-discovery.md) · [简体中文](../zh-CN/skill-discovery.md) · [繁體中文](../zh-TW/skill-discovery.md)

This project is implemented as an AI agent skill. Different agents load it through their own skill/rule discovery mechanisms — the mechanics differ per agent, the contract does not.

### Install Payload

When installing into a skill directory, copy **only** `SKILL.md` + `references/` + `scripts/` + `LICENSE` from the release tarball (`ai-agent-governance-skill.tar.gz`). Do **not** `git clone` this repository into a skills folder — `docs/`, `tests/`, `package.json`, `.github/`, README, CONTRIBUTING, CHANGELOG, and AGENTS.md are repository infrastructure, not the install payload.

Prefer verifying the Release Notes SHA-256 before unpacking.

### How It Works

```
installation directory (per agent — see table)
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

After install, open the **project you want to govern** and send the chat prompt (not a shell command):

```text
initialize project governance
```

Other prompts: `audit governance`, `release`. Full list: [commands.md](commands.md).

### Per-Agent install paths

| Location | Auto-discovered by | Best for |
| --- | --- | --- |
| `.cursor/skills/<name>/` (project) or personal Agent Store `skills/` | Cursor | Cursor users |
| `.agents/skills/<name>/` (project or `~/`) | opencode + Claude-compatible agents | cross-agent sharing |
| `.claude/skills/<name>/` | opencode, Claude Code | Claude Code ecosystem |
| `.opencode/skills/<name>/` | opencode | opencode-only |
| `~/.config/opencode/skills/<name>/` | opencode (global) | machine-wide for opencode |

- **Cursor** — project skills under `.cursor/skills/`; personal skills live in the user Agent Store `skills/` (not `~/.cursor/skills-cursor/`, which is reserved for built-ins).
- **Claude Code** — reads `.claude/skills/<name>/SKILL.md` and matches by metadata description.
- **opencode** — auto-scans `.opencode/skills`, `.claude/skills`, `.agents/skills` (project and global).
- **Codex / others** — depend on their skill-loading implementation; AGENTS.md-based agents apply the generated runtime contract regardless.

Quick Start in the root README mirrors this table; keep them aligned when paths change.
