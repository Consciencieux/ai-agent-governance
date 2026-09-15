# AI Agent Governance

> 面向 AI 編碼 Agent 的倉庫原生治理系統——規則、校驗與發佈控制存在於倉庫中，而非對話上下文。

[![CI](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml/badge.svg)](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Consciencieux/ai-agent-governance)](https://github.com/Consciencieux/ai-agent-governance/releases)

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

## 快速開始

**1. 安裝發佈載荷**到你的 Agent 技能目錄（不要 git clone 本倉庫）：

| Agent | 安裝路徑 |
| --- | --- |
| Cursor | `.cursor/skills/ai-agent-governance/` 或個人 Agent Store 的 `skills/` |
| Claude Code / opencode（共用） | `~/.agents/skills/ai-agent-governance/` 或專案 `.agents/skills/…` |
| 僅 Claude Code | `.claude/skills/ai-agent-governance/` |
| 僅 opencode | `.opencode/skills/ai-agent-governance/` |

```bash
# 範例：共用 ~/.agents 路徑——按上表換成你的目錄
DEST=~/.agents/skills/ai-agent-governance
mkdir -p "$DEST"
curl -fsSL -o /tmp/ai-agent-governance-skill.tar.gz \
  https://github.com/Consciencieux/ai-agent-governance/releases/latest/download/ai-agent-governance-skill.tar.gz
# 校驗（SHA-256 在 Release Notes 中）：
# shasum -a 256 /tmp/ai-agent-governance-skill.tar.gz
tar -xzf /tmp/ai-agent-governance-skill.tar.gz -C "$DEST"
```

**不要**把本倉庫整倉 clone 進技能目錄——安裝載荷只包含 `SKILL.md` + `references/` + `scripts/` + `LICENSE`。完整發現說明：[skill-discovery.md](docs/product/zh-TW/skill-discovery.md)。

**2. 打開你要治理的那個專案**，在編碼 Agent 對話裡發送：

```text
initialize project governance
```

**3. 初始化之後**，常用後續操作：

| 提示詞 | 功能 |
| --- | --- |
| `audit governance` | 對已治理專案做健康檢查，偵測漂移 |
| `release` | 人在環版本發佈，附帶證據 |
| `governance check` | 快速校驗 |

完整提示詞清單 → [commands.md](docs/product/zh-TW/commands.md)。

## 它做什麼

AI 編碼 Agent 行動很快，但不會自動繼承架構約束、同步規則或維護流程。修改悄悄退化；下一個 Agent 從退化狀態繼續。

本專案在你的倉庫內部生成一套治理環境——受追蹤的規則、自動校驗、漂移偵測與人工受控的發佈流程——讓約束在 Agent 會話之間持續有效。

## INIT 生成什麼

一個治理骨架（代表性路徑——[完整帶註解清單](docs/product/zh-TW/bootstrap-output.md)）：

```text
my-project/
├── AGENTS.md                      # Agent 規則（從範本生成）
├── CHANGELOG.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── features/                  # 功能登錄
│   ├── plans/                     # 開發計劃
│   └── rules/                     # 治理規則（生命週期、Git、安全……）
├── .governance/
│   ├── manifest.json              # 期望態
│   ├── state.json                 # 當前態
│   └── generated/skills/          # 持續工作的子技能
├── scripts/                       # 校驗器、密鑰掃描、發佈管理
└── .github/workflows/ci.yml       # CI 閘門
```

具體契約（輸入、工件、腳本、規則）由 [init-spec.json](references/init-spec.json) 與 [sub-skills.md](references/instruction/sub-skills.md) 定義。

## 治理生命週期

| 階段 | 會發生什麼 |
| --- | --- |
| **INIT** | 檢查環境 → 產生規則、AGENTS.md、功能登錄、CI、校驗器 → 記錄初始狀態 |
| **OPERATE** | 產生的規則與子技能治理每一次 Agent 會話；按專案鎖序列化多 Agent 工作 |
| **VALIDATE** | 零依賴校驗器檢查倉庫健康；漂移偵測對比期望態與現實 |
| **AUDIT** | 彙總活動記錄，驗證全部治理事實 |
| **RELEASE** | 人在環：分析變更 → SemVer 提案 → 審批 → 帶證據發佈 |

狀態模型：[governance-model.md](docs/product/zh-TW/governance-model.md)。Agent 六階段操作生命週期：[lifecycle.md](docs/product/zh-TW/lifecycle.md)。

## 核心特性

- **倉庫原生** —— 治理存在於倉庫中，與程式碼一起版本化
- **生命週期驅動** —— 規則在整個專案生命週期中被維護與審計
- **失敗時預設阻斷** —— 承諾的機制未運行時，閘門中止流程
- **工具中立** —— 核心說 `AGENTS.md`；按工具轉接器服務 Cursor、Claude Code、opencode、Codex

## 文件

- [commands.md](docs/product/zh-TW/commands.md) — 完整提示詞清單
- [bootstrap-output.md](docs/product/zh-TW/bootstrap-output.md) — 帶註解的 INIT 輸出
- [governance-model.md](docs/product/zh-TW/governance-model.md) — Spec / Status / Health 狀態模型
- [architecture.md](docs/product/zh-TW/architecture.md) — 倉庫佈局與分發角色
- [lifecycle.md](docs/product/zh-TW/lifecycle.md) — Agent 操作生命週期
- [validator.md](docs/product/zh-TW/validator.md) — 校驗器用法與檢查項
- [anti-regression.md](docs/product/zh-TW/anti-regression.md) — 防亂改機制
- [skill-discovery.md](docs/product/zh-TW/skill-discovery.md) — Agent 如何發現 skill
- [docs/README.md](docs/README.md) — 文件知識體系
- [glossary.md](docs/glossary.md) — 三語術語對照表
- [路線圖](docs/plans/roadmap/zh-TW.md) · [設計決策](docs/design-decisions/) · [CHANGELOG](CHANGELOG.md)

## 貢獻

參見 [CONTRIBUTING.zh-TW.md](CONTRIBUTING.zh-TW.md)。本倉 CI 阻斷權威：`npm run check:must-ship`。

## License

[MIT](LICENSE) © 2026 Consciencieux
