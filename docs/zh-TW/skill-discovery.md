# Skill Discovery

[English](../en/skill-discovery.md) · [简体中文](../zh-CN/skill-discovery.md) · [繁體中文](skill-discovery.md)

本專案以 AI Agent skill 形式實作。不同 Agent 透過各自的 skill/rule discovery 機制載入它 —— 各 Agent 的機制不同，契約一致。

### 安裝載荷

安裝到技能目錄時**只複製** `SKILL.md` + `references/` + `scripts/` + `LICENSE`；`docs/`、`tests/`、`package.json`、`.github/`、README、CONTRIBUTING、CHANGELOG、AGENTS.md 是倉庫基礎設施，不屬於技能載荷，不要複製。

### 工作原理

```
安裝目錄（按 Agent：.agents/skills · .claude/skills · .opencode/skills · ...）
        |
        v
Agent 掃描 skill 元資料（frontmatter：name + description）
        |
        v
使用者意圖 → description 匹配（如 "initialize project governance"）
        |
        v
加載 SKILL.md → 執行工作流程（INIT / AUDIT / RELEASE）
```

frontmatter 的 `description` 是匹配的關鍵 —— 它聲明了 Agent 用來匹配的觸發短語。使用者只需要輸入想要的提示詞：

```text
initialize project governance
audit governance
release
```

完整提示詞列表及各自行為：[commands.md](commands.md)

### 各 Agent 差異

各 Agent 的安裝路徑：

| 位置 | 自動發現方 | 適合 |
| --- | --- | --- |
| `.agents/skills` | opencode 及 Claude 相容 Agent | 跨 Agent 共享 |
| `.claude/skills` | opencode、Claude Code | Claude Code 生態 |
| `.opencode/skills` | opencode | 僅 opencode |
| `~/.config/opencode/skills` | opencode（全域） | 全機器 opencode 使用 |

- **Claude Code** — 讀取 `.claude/skills/<name>/SKILL.md`，按元資料 description 匹配。
- **opencode** — 自動掃描 `.opencode/skills`、`.claude/skills`、`.agents/skills`（專案級與全域級）。
- **Cursor** — 依賴 `.cursor/rules` 與 Agent Rules；skill 載入遵循自身機制。
- **Codex / 其他** — 取決於各自 skill 載入實作；基於 AGENTS.md 的 Agent 無論機制如何都遵循生成的執行期契約。
