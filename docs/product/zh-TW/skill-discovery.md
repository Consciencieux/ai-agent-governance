# Skill Discovery

[English](../en/skill-discovery.md) · [简体中文](../zh-CN/skill-discovery.md) · [繁體中文](skill-discovery.md)

本專案以 AI Agent skill 形式實作。不同 Agent 透過各自的 skill/rule discovery 機制載入 —— 機制不同，契約一致。

### 安裝載荷

安裝到技能目錄時，只從發布 tarball（`ai-agent-governance-skill.tar.gz`）解出 **`SKILL.md` + `references/` + `scripts/` + `LICENSE`**。**不要**把本倉庫 `git clone` 進 skills 目錄——`docs/`、`tests/`、`package.json`、`.github/`、README、CONTRIBUTING、CHANGELOG、AGENTS.md 是倉庫基礎設施，不屬於安裝載荷。

解壓前建議對照 Release Notes 中的 SHA-256。

### 工作原理

```
安裝目錄（依 Agent —— 見下表）
        |
        v
Agent 掃描 skill 元資料（frontmatter：name + description）
        |
        v
使用者意圖 → description 匹配（如 "initialize project governance"）
        |
        v
載入 SKILL.md → 執行工作流程（INIT / AUDIT / RELEASE）
```

安裝完成後，打開**你要治理的那個專案**，在對話裡發送提示詞（不是 shell 命令）：

```text
initialize project governance
```

其他常用提示詞：`audit governance`、`release`。完整清單：[commands.md](commands.md)。

### 各 Agent 安裝路徑

| 位置 | 自動發現方 | 適合 |
| --- | --- | --- |
| `.cursor/skills/<name>/`（專案）或個人 Agent Store 的 `skills/` | Cursor | Cursor 使用者 |
| `.agents/skills/<name>/`（專案或 `~/`） | opencode 及 Claude 相容 Agent | 跨 Agent 共用 |
| `.claude/skills/<name>/` | opencode、Claude Code | Claude Code 生態 |
| `.opencode/skills/<name>/` | opencode | 僅 opencode |
| `~/.config/opencode/skills/<name>/` | opencode（全域） | 全機器 opencode |

- **Cursor** — 專案技能在 `.cursor/skills/`；個人技能在使用者 Agent Store 的 `skills/`（不要用 `~/.cursor/skills-cursor/`，那是內建保留目錄）。
- **Claude Code** — 讀取 `.claude/skills/<name>/SKILL.md`，依 description 匹配。
- **opencode** — 自動掃描 `.opencode/skills`、`.claude/skills`、`.agents/skills`（專案級與全域）。
- **Codex / 其他** — 取決於各自載入實作；基於 AGENTS.md 的 Agent 仍遵循產生的執行時契約。

根目錄 README 的「快速開始」與本表對齊；路徑變更時兩邊一起改。
