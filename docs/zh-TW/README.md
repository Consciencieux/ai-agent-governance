# AI Agent Governance

> 將 AI Agent 行為視為倉庫基礎設施，進行版本控制與生命週期管理。

[![CI](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml/badge.svg)](https://github.com/Consciencieux/ai-agent-governance/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Consciencieux/ai-agent-governance)](https://github.com/Consciencieux/ai-agent-governance/releases)

[English](../../README.md) · [简体中文](../zh-CN/README.md) · [繁體中文](README.md)

**一條命令為你的倉庫搭建完整的 AI 編碼 Agent 工程環境 —— AGENTS.md、規則、Feature 登記、CI 與校驗器 —— 並在整個專案生命週期中持續校驗與維護。**

### 為什麼需要

AI 編碼 Agent 能快速生成和修改程式碼，但它不會自動擁有專案的工程脈絡、架構約束和長期維護機制。

每個新專案開始時，開發者仍然需要手動建立：

- AGENTS.md
- CHANGELOG.md
- 架構文件
- Feature 登記
- 編碼規範
- Git 工作流程
- CI 檢查
- 安全基線

這些規則通常只存在於文件或聊天脈絡中，容易隨著時間、人員和 Agent 更替而失效。

本 Skill 將這些治理能力轉化為倉庫級基礎設施：第一天自動搭建治理體系，並在專案整個生命週期中持續驗證、維護和防止漂移。

### 解決方案

生成的產物是倉庫基礎設施，而非靜態範本 —— 像程式碼一樣被追蹤（`manifest.json` 期望態 · `state.json` 當前態 · `validation.json` 觀測態），並由漂移偵測、驗證閘門、防亂改與發佈生命週期持續校驗。

**先初始化，再持續治理（Initialize first, govern continuously）。**

| 現有方案 | 侷限 |
| --- | --- |
| Prompt 包（CLAUDE.md） | 僅指令 —— 無校驗、無生命週期 |
| AGENTS.md 範本 | 一次性靜態引導 —— 無人維護 |
| CI 規則 | 只管程式碼 |
| 企業級 AI 治理 | 在倉庫之外 |
| **AI Agent Governance** | **一鍵引導 + 生命週期校驗 + 漂移防護，作為倉庫基礎設施** |

### 安裝

這是 AI Agent skill，不是 CLI —— 把它放到你的編碼 Agent 能發現 skill 的位置：

```
.agents/skills/ai-agent-governance/SKILL.md
```

**推薦——從發佈載荷 tarball 安裝**（只含 `SKILL.md` + `references/` + `scripts/` + `LICENSE`，無任何多餘檔案）：

```bash
mkdir -p ~/.agents/skills/ai-agent-governance
curl -L https://github.com/Consciencieux/ai-agent-governance/releases/latest/download/ai-agent-governance-skill.tar.gz \
  | tar -xz -C ~/.agents/skills/ai-agent-governance
```

若下載逾時（GitHub release 重新導向可能較慢），改用下面的備選方案。

**備選——clone 後只複製載荷。** skill 只包含 `SKILL.md` + `references/` + `scripts/` + `LICENSE`；其餘內容（`docs/`、`tests/`、`package.json`、`.github/`、`README`、`CONTRIBUTING`、`CHANGELOG`、`AGENTS.md`）是倉庫基礎設施，**不要**複製進 skill 安裝目錄。

```bash
git clone https://github.com/Consciencieux/ai-agent-governance
mkdir -p ~/.agents/skills/ai-agent-governance
cp -R SKILL.md references scripts LICENSE ~/.agents/skills/ai-agent-governance/
```

skill 透過各 Agent 原生的 skill/rule discovery 機制被發現。按 Agent 的安裝路徑（`.claude/skills`、`.opencode/skills` 等）：[docs/zh-TW/skill-discovery.md](skill-discovery.md)

### 快速開始

**這是聊天提示語（chat prompt），不是 shell 命令。** 在你的 AI 編碼 Agent 聊天視窗裡說：

```text
initialize project governance
```

**之前：**

```
my-project/
├── src/
└── package.json
```

**之後：**

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

一句話 —— 你的專案就擁有完整治理環境，任何相容 AGENTS.md 的 Agent 都能直接使用。完整生成檔案集見 [docs/zh-TW/bootstrap-output.md](bootstrap-output.md)。

全部可用提示詞（巡檢、發佈、漂移檢查等）及其行為：[docs/zh-TW/commands.md](commands.md)。

### 常用提示詞

| 場景 | 提示詞 |
| --- | --- |
| 首次接入 | `initialize project governance` |
| 開發任務寫計劃 | `plan this task` |
| 已治理倉庫健康檢查 | `audit governance` |
| 治理漂移報告 | `check governance drift` |
| 偵測技術棧 | `inspect the repo` |
| 生成 CI | `setup CI` |
| 治理校驗 | `governance check` |
| 記錄任務狀態 | `update state` |
| 發佈版本 | `release` |


### 核心能力（Core Capabilities）

#### 引導與執行期治理（Bootstrap & Runtime Governance）

- **治理引導（Governance bootstrap）** — 一次 INIT 搭好骨架：倉庫偵測 → 規則 → AGENTS.md → Feature 登記 → CI → 校驗器 → 狀態
- **執行期治理（Runtime governance）** — 生成的 AGENTS.md + 按工具生成的適配層約束每個會話；多語言 CI + 格式基線（Node/TS、Python、Rust、Go、Java、C++）
- **結構適配（Structural adaptivity）** — 成熟度自適應策略（L0 空倉庫 → L3 生產），只合併不遷移

#### 漂移偵測與驗證（Drift Detection & Validation）

- **漂移偵測（Drift detection）** — `drift-check` 將 manifest 與現實比對，報告治理腐化
- **驗證閘門（Validation gates）** — 零依賴校驗器在治理工件缺失時讓 CI 失敗
- **行為稽核（Activity audit）** — 追加式 `.governance/activity.jsonl` 逐任務軌跡（"哪個 Agent 何時、做了什麼、結果如何"），可由 drift-check 報告消費
- **密鑰掃描閘門（Secret scanning gate）** — `scripts/check-secrets.js` 阻止含密鑰材料的提交（唯讀，絕不印出密鑰）

#### 防亂改（Anti-Regression）

與靜態規則檔案不同，AI Agent Governance 持續保護專案知識不漂移，讓後續使用的 Agent 或開發者不會破壞已有治理成果：

- **生命週期強制** — 每次變更都遵循 Understand → Plan → Implement → Validate → Synchronize → Report
- **受保護治理** — 治理檔案無法被靜默削弱（說明原因 → CHANGELOG → 升版本 → 跑校驗器）
- **基於證據的報告** — 狀態基於真實校驗輸出，絕不偽造

完整機制（權限矩陣、刪除保護、規則優先序、多 Agent 鎖）：[docs/zh-TW/anti-regression.md](anti-regression.md)

#### Git 工作流程治理（Git Workflow Governance）

守衛 Agent 最易造成不可逆損害的地方 —— Git 操作：

- **受保護分支** —— `.governance/git-policy.json` 阻止直推 `main`/`master`（`directPush: false`、`allowForcePush: false`）
- **分支開發** —— Agent 檢查策略、建立 `feature/agent-<日期>-<摘要>`、經 PR 人工批准後合入
- **受控回滾** —— revert/reset/restore 仍是工具，由確認閘門治理

#### 發佈生命週期（Release Lifecycle）

發佈走 Human-in-the-loop 流程 —— **AI 提議，人確認**：

```
分析變更 → 生成 SemVer Proposal → 開發者批准 → 建立 tag → GitHub Release
```

- **分析** — `release-manager` 檢查 git 歷史與變更分類（SemVer 2.0.0），產出 Release Proposal（當前版本 / 建議版本 / 發佈類型 / 理由 / 風險等級 / 審核建議 / Release Notes）—— 唯讀
- **批准** — 任何寫操作前開發者必須明確確認；不確定性（Potential Breaking Change）暫停流程並請求澄清
- **執行** — 批准後執行：annotated tag → push → GitHub Release，版本一致（synchronized versions）。規範：[references/workflows/release.md](../../references/workflows/release.md)

### 支援的 Agent

Claude Code · Cursor · Codex · opencode —— 以及其他基於 AGENTS.md 的 Agent。核心與工具無關；相容性來自按工具生成的適配層（CLAUDE.md、.cursor/rules、copilot-instructions.md、opencode.json）。

### 文件

- [docs/zh-TW/skill-discovery.md](skill-discovery.md) — Agent 如何發現並觸發 skill
- [docs/zh-TW/commands.md](commands.md) — 使用者提示詞 + 執行時元件
- [docs/zh-TW/bootstrap-output.md](bootstrap-output.md) — 完整帶註解的初始化產物
- [docs/zh-TW/governance-model.md](governance-model.md) — Spec / Status / Health 狀態模型
- [docs/zh-TW/architecture.md](architecture.md) — 倉庫佈局（各目錄用途）
- [docs/zh-TW/anti-regression.md](anti-regression.md) — 防亂改機制完整明細
- [docs/zh-TW/lifecycle.md](lifecycle.md) — Agent 六階段操作生命週期
- [docs/zh-TW/validator.md](validator.md) — 校驗器用法與檢查項
- [docs/design-decisions/](../design-decisions/) — 架構決策記錄（ADR，簡體中文）
- [docs/zh-TW/roadmap.md](roadmap.md) — 待開發功能與狀態
- [docs/glossary.md](../glossary.md) — 三語術語對照表
- [CONTRIBUTING.md](CONTRIBUTING.md) — 開發指南
- [CHANGELOG.md](../../CHANGELOG.md) — 發佈歷史

### Roadmap

接下來：多 Agent 協調協定 · Skill 生命週期管理 · 遠端治理看板 · monorepo 多治理域。

完整路線圖與設計文件：[docs/zh-TW/roadmap.md](roadmap.md)


### License

[MIT](../../LICENSE) © 2026 Consciencieux
