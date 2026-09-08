# AI Agent Governance

> 面向 AI 編碼 Agent 的倉庫原生治理系統。
> 將 AI Agent 行為視為倉庫基礎設施。

[![CI](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml/badge.svg)](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Consciencieux/ai-agent-governance)](https://github.com/Consciencieux/ai-agent-governance/releases)

[English](../../README.md) · [简体中文](../zh-CN/README.md) · [繁體中文](README.md)

## 它是什麼

AI Agent Governance 不是單純的提示詞包（prompt pack），也不是 `AGENTS.md` 產生器。它將 Agent 行為、倉庫約束與驗證機制轉化為受追蹤、持續校驗的倉庫基礎設施——治理存在於倉庫中，而非只存在於對話上下文或文件中。

## 為什麼存在

AI 編碼 Agent 在倉庫中行動很快，但不會自動繼承工程上下文、架構約束或維護機制。失敗鏈是真實的：

```
agent 修改程式碼
→ 忘記同步相關檔案
→ 繞過規則
→ 破壞倉庫狀態
→ 下一個 Agent 從被破壞的狀態繼續
→ 問題持續擴大
```

本專案源自一個真實的多 Agent GitHub 協作工作流，在那裡僅靠 prompt 的協調反覆無法保全倉庫約束與狀態一致性。它已從一份小型 Agent 指令演化為倉庫級治理系統。

## 如何運作

治理生命週期在倉庫內部運行，跨越五個階段：

| 階段 | 會發生什麼 |
| --- | --- |
| INIT | 檢查環境，產生規則、`AGENTS.md`、功能登錄、CI 與校驗器，然後記錄初始狀態。 |
| OPERATE | 產生的 `AGENTS.md` 與子技能治理每一次 Agent 會話；按專案鎖序列化多 Agent 工作。 |
| VALIDATE | 零依賴校驗器檢查倉庫健康；漂移偵測對比清單（期望態）與現實（觀測態）。 |
| AUDIT | 巡檢彙總活動記錄並驗證全部治理事實——從文件一致性到規則捕獲。 |
| RELEASE | 人在環流程分析變更歷史、提出 SemVer 版本並發佈——基於證據，而非虛構。 |

這些階段背後的 Spec / Status / Health 狀態模型記錄在 [docs/zh-TW/governance-model.md](governance-model.md)。

這是倉庫級治理生命週期。Agent 單次任務的六階段操作生命週期單獨記錄在 [docs/zh-TW/lifecycle.md](lifecycle.md)。

```
   AI Agent
      │
      ▼
 治理規則               規則 · 策略 · Agent 指引
      │
      ▼
 倉庫狀態               期望態 · 當前態 · 倉庫知識
      │
      ▼
 驗證                   校驗 · 漂移偵測 · 測試 · 巡檢
      │
      ▼
 人工受控發佈            評審 · 批准 · 版本化
      │
      └──────────────► 回到倉庫
```

## 它治理什麼

| 領域 | 範例 |
| --- | --- |
| Agent 行為 | 權限矩陣、多 Agent 鎖、規則優先序 |
| 倉庫狀態 | 清單（期望態）· 狀態（當前態）· 校驗（觀測態） |
| 文件與知識 | 功能登錄、計劃、規則、翻譯新鮮度 |
| Git 操作 | 保護分支、基於分支的開發、受控回滾 |
| 發佈 | SemVer 提案、人工審批、標籤版本一致性 |

## 它有何不同

| 維度 | 含義 |
| --- | --- |
| 倉庫原生 | 治理存在倉庫中，而非對話上下文或外部平台 |
| 生命週期驅動 | 規則在整個專案生命週期中被維護與被巡檢 |
| 失敗時預設阻斷 | 當承諾的機制實際未運行時，閘門中止流程 |
| 工具中立 | 核心說 `AGENTS.md`；按工具轉接器服務特定 Agent |

透過一次初始化建立治理環境，並透過持續驗證維持其完整性與一致性：

```
initialize project governance
```

完整可用提示詞清單見 [docs/zh-TW/commands.md](commands.md)。

## 快速開始

將 skill 安裝到你的編碼 Agent 發現 skill 的位置——使用發布載荷 tarball：

```bash
mkdir -p ~/.agents/skills/ai-agent-governance
curl -L https://github.com/Consciencieux/ai-agent-governance/releases/latest/download/ai-agent-governance-skill.tar.gz \
  | tar -xz -C ~/.agents/skills/ai-agent-governance
```

這是聊天提示詞，不是 shell 命令。在你的 AI 編碼 Agent 聊天中提問：

```text
initialize project governance
```

**之前** —— 一個普通專案：

```text
my-project/
├── src/
└── package.json
```

**之後** —— 治理環境被建立（代表性結構）：

```text
my-project/
├── AGENTS.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── plans/
│   └── rules/
├── .governance/
├── scripts/
└── .github/workflows/
```

完整帶註解的初始化輸出：[docs/zh-TW/bootstrap-output.md](bootstrap-output.md)。

## 產生的環境

INIT 產生一個治理骨架，其具體契約（輸入、工件、安裝的腳本、規則檔案與產生的子技能）由 [references/init-spec.json](../../references/init-spec.json) 與 [references/templates/sub-skills.md](../../references/templates/sub-skills.md) 定義。

## 文件

- [docs/zh-TW/skill-discovery.md](skill-discovery.md) — Agent 如何發現並觸發 skill
- [docs/zh-TW/commands.md](commands.md) — 完整提示詞清單與運行時元件
- [docs/zh-TW/bootstrap-output.md](bootstrap-output.md) — 完整帶註解的初始化輸出
- [docs/zh-TW/governance-model.md](governance-model.md) — Spec / Status / Health 狀態模型
- [docs/zh-TW/architecture.md](architecture.md) — 倉庫佈局與三種分發角色
- [docs/zh-TW/anti-regression.md](anti-regression.md) — 防亂改機制完整明細
- [docs/zh-TW/lifecycle.md](lifecycle.md) — Agent 六階段操作生命週期
- [docs/zh-TW/validator.md](validator.md) — 校驗器用法與檢查項
- [docs/zh-TW/roadmap.md](roadmap.md) — 帶狀態與設計文件的 roadmap
- [docs/design-decisions/](../design-decisions/) — 架構決策記錄（ADR，簡體中文）
- [docs/glossary.md](../glossary.md) — 三語術語對照表
- [CONTRIBUTING.md](CONTRIBUTING.md) — 開發指南
- [CHANGELOG.md](../../CHANGELOG.md) — 發佈歷史

## 1.0 之後的方向

v1.0 凍結了核心治理契約。後續工作將在此基礎上繼續擴展系統能力。

## License

[MIT](../../LICENSE) © 2026 Consciencieux
