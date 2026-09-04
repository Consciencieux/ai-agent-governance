# Architecture

[English](../en/architecture.md) · [简体中文](../zh-CN/architecture.md) · [繁體中文](architecture.md)

本頁是倉庫佈局——本 skill 倉庫各目錄用途的開發者地圖。

skill 的行為（執行模式 INIT/AUDIT/RELEASE、生命週期管線、設計原則）定義在 skill 本體裡，不在本頁：見 [SKILL.md](../../SKILL.md) 與 `references/`。本頁只記錄檔案都放在哪裡。

### 目錄職責

| 路徑 | 職責 | 讀者 | 語言 |
| --- | --- | --- | --- |
| `SKILL.md` | Skill 入口 / 產品規範 | agent（skill 使用者） | 單語 |
| `references/` | **Skill 主體——skill 行為唯一存放處。** 複製進被治理專案、或定義 skill 如何行動的策略、範本、工作流程。 | agent（skill 使用者） | 單語 |
| `scripts/` | Skill 執行時腳本（校驗器、檢查、生成器、發佈工具）——屬於安裝載荷 | agent/CI | 程式碼 |
| `LICENSE` | MIT 授權條款——屬於安裝載荷 | 安裝者 | — |
| `docs/` | **專案知識。不屬於 skill 載荷。** 開發者維護，供開發者與在本倉庫工作的 Agent 讀取：如何使用 skill（`commands.md` 觸發詞）、設計計劃（`plans/`）、路線圖、術語表。 | 開發者 + Agent | 三語 |
| `tests/`、`package.json`、`.github/`、`CHANGELOG.md`、`CONTRIBUTING.md`、`README.md`、`AGENTS.md` | 倉庫基礎設施：CI、發佈流程、變更日誌、貢獻指南 | 倉庫維護者 | 按檔案 |

### 倉庫佈局

```
ai-agent-governance/
├── SKILL.md                    # skill 入口 / 產品規格
├── references/                 # skill 本體——skill 行為唯一所在地
│   ├── init-spec.json          # 機器可讀 INIT 規範（generate-governance.js 的單一事實源）
│   ├── templates/
│   │   ├── agents-md.template.md   # AGENTS.md 範本
│   │   ├── feature-doc.template.md # Feature 文件範本（含反虛構規則）
│   │   ├── sub-skills.md           # 生成 skill 的來源；每個會變成 .governance/generated/skills/<name>/SKILL.md，不是腳本
│   │   ├── env-example.template.md # .env.example 範本（佔位符、按依賴裁剪）
│   │   ├── gitmessage.template.md  # .gitmessage.txt 範本（提交約定）
│   │   ├── git-policy.template.md  # .governance/git-policy.json 範本（Git 工作流程策略）
│   │   ├── githooks-template.md     # 可選 .githooks/pre-commit + commit-msg 範本
│   │   └── sync-rules.template.md  # .governance/sync-rules.json 範本（同步組）
│   ├── policies/
│   │   ├── lifecycle.policy.md / git.policy.md / security.policy.md / coding.policy.md / testing.policy.md
│   │   └── governance-files.policy.md   # 受保護檔案 + .governance Git 追蹤策略
│   └── workflows/
│       ├── ci.md               # CI 範本（能力偵測 + 降級）
│       └── release.md          # 發佈前置檢查 + 版本一致性
├── scripts/                    # skill 執行時腳本
│   ├── verify_governance.js    # 校驗引擎（manifest 驅動路徑 + governance_version）
│   ├── check-lock.js           # 多 Agent 鎖檢查（唯讀，exit 1 = 持鎖）
│   ├── check-git-policy.js     # Git 工作流程閘門（受保護分支 + directPush=false → exit 1）
│   ├── check-secrets.js        # 密鑰掃描閘門（暫存區掃描，絕不列印密鑰）
│   ├── check-sync.js           # 同步組閘門（watch/require 對照，exit 1）
│   ├── check-doc-freshness.js  # 文件過時度 + 譯文新鮮度（git log 日期；建議性，--release-gate 阻斷過時/draft 譯文）
│   ├── check-doc-consistency.js # 文件一致性 + consent/受保護清單/原則索引/計劃狀態/術語簇（預設建議性；--gate/--release-gate fail-closed；changelog 覆蓋僅 --release-gate fail-closed）
│   ├── check-doc-parity.js     # trilingual tree parity (CI + release precondition)
│   ├── check-layout-sync.js    # architecture.md 倉庫佈局 vs references/ + scripts/（fail-closed 閘門）
│   ├── check-plan-delivery.js  # 計劃宣告 vs 實際交付（歸檔前閘門）
│   ├── generate-governance.js  # INIT 腳本化生成器（確定性引導，規範：references/init-spec.json）
│   ├── package-skill.sh        # 發佈載荷 tarball 打包
│   └── release-manager.js      # plan（唯讀）+ execute（審批閘門）發佈工具
├── LICENSE                     # MIT
│
│  ▼ 安裝載荷到此為止——以下全是倉庫基礎設施，
│    不隨 skill 複製進安裝目錄（與 README Install 一節同規則）
│
├── docs/                       # 專案知識——開發者維護，開發者與 Agent 共享讀取（觸發詞、計劃、路線圖）
│   ├── glossary.md             # 三語術語對照表（共享）
│   ├── design-decisions/       # 架構決策記錄（共享，簡體單語）
│   ├── archive/                # 已完成計劃歸檔（共享，單語）
│   ├── en/                     # 英文樹
│   │   ├── architecture.md     # 本頁
│   │   ├── governance-model.md # Spec / Status / Health 概念摘要
│   │   ├── anti-regression.md  # 防亂改機制開發者地圖
│   │   ├── lifecycle.md        # 六階段生命週期開發者摘要
│   │   ├── validator.md        # 校驗器用法手冊
│   │   ├── skill-discovery.md  # Agent 如何發現並觸發 skill
│   │   ├── commands.md         # 完整提示詞參考（使用者入口命令）
│   │   ├── bootstrap-output.md # 完整帶註解的初始化產物
│   │   ├── roadmap.md          # 待開發功能與狀態
│   │   └── plans/              # 設計計劃（TASK 格式）
│   ├── zh-CN/                  # 簡體中文樹（源語言）
│   └── zh-TW/                  # 繁體中文樹（臺灣）
├── README.md                   # 英文首頁（翻譯：docs/zh-CN/README.md、docs/zh-TW/README.md）
├── CONTRIBUTING.md             # 開發指南（翻譯：docs/zh-CN/CONTRIBUTING.md、docs/zh-TW/CONTRIBUTING.md）
├── AGENTS.md                   # 本倉庫的 Agent 工作指南
├── CHANGELOG.md                # 發佈歷史
├── package.json                # npm 腳本（test、check）
├── .github/                    # CI 工作流程
└── tests/
    └── run-tests.js            # 測試套件
```

安裝載荷 = `SKILL.md` + `references/` + `scripts/` + `LICENSE` 四項。分割線以下（`docs/`、`tests/`、`package.json`、`.github/`、README、CONTRIBUTING、CHANGELOG、AGENTS.md）是倉庫基礎設施——不得複製進 skill 安裝目錄。
