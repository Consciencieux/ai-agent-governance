# Architecture

[English](../en/architecture.md) · [简体中文](../zh-CN/architecture.md) · [繁體中文](architecture.md)

本頁是倉庫佈局——本 skill 倉庫各目錄用途的開發者地圖。

skill 的行為（執行模式 INIT/AUDIT/RELEASE、生命週期管線、設計原則）定義在 skill 本體裡，不在本頁：見 [SKILL.md](../../SKILL.md) 與 `references/`。本頁只記錄檔案都放在哪裡。

### 三種分發角色（給任何檔案歸類前先讀這裡）

「載荷（payload）」過去同時指三件不同的事——這正是一個倉庫專用工具被標成「NOT payload」卻放在 `scripts/` 裡、以及一個子技能引用了被治理專案根本收不到的工作流程檔案的原因。改用下面三個互斥角色名；`references/init-spec.json` 是判定角色的機器可讀權威：

| 角色 | 定義 | 如何核驗 | 例子 |
| --- | --- | --- | --- |
| **INSTALLED（安裝到被治理專案）** | INIT 把它寫進被治理專案（copy / template / generated）。該專案的 Agent 在執行期讀它。 | 在 `init-spec.json` 中作為 `source` 出現（當前數量見 `check-role-completeness.js --gate` 輸出） | `references/policies/coding.policy.md` → `docs/rules/coding.md`；`scripts/check-secrets.js`；`agents-md.template.md` → `AGENTS.md` |
| **SKILL-INTERNAL（隨 tarball 但不安裝）** | 隨 tarball 分發（打包整目錄複製 `references/` + `scripts/`）且由 **skill 執行器**讀取——但 INIT 從不安裝它，所以被治理專案裡沒有這個檔案。 | 在 `init-spec.json` 的 `distribution.skillInternal` 中列出 | 恰好三個：`references/init-spec.json`、`references/workflows/release.md`、`scripts/generate-governance.js` |
| **REPO-ONLY（僅本倉庫）** | 完全不進 tarball。約束在本倉庫上的工作。 | 在 `references/`/`scripts/`/`SKILL.md`/`LICENSE` 之外 | `repo-tools/**`、`repo-workflows/**`、`AGENTS.md`、`docs/**`、`tests/**`、`package.json`、`.github/**`、`.gitattributes` |

角色是**人的決定，絕不推斷**：`copy`/`template`/`generated`、重命名（`lifecycle.policy.md` → `docs/rules/lifecycle.md`、`verify_governance.js` → `verify-governance.js`）、一對多輸出（`githooks-template.md` → `pre-commit` + `commit-msg`）以及 內嵌靜態內容工件（`type: "static"`），都編碼了生成器無法從檔案樹恢復的契約決定。**可機械化的只是抓漏**：`repo-tools/check-role-completeness.js --gate` 會在出現未分類檔案、同時屬於兩個集合、聲明路徑已不存在、或角色聲明與 `package-skill.sh` 實際打包不符時失敗。角色確實未決的檔案放進 `distribution.undecided` 並記錄待裁定問題，該閘門保持紅色直到裁定。最初放進去的兩項都已裁定完畢：`governance-files.policy.md` 現作為 `docs/rules/governance-files.md` 安裝（那個 INSTALLED 的檢查器在執行時讀它），`feature-doc.template.md` 現作為 `docs/features/_TEMPLATE.md` 安裝（SKILL.md 讓 Agent 複製它）。當前 `undecided` 為空，各角色的即時數量以 `check-role-completeness.js --gate` 的輸出為準。

由此得出兩條規則，且在本表存在之前兩條都被違反過：

1. **SKILL-INTERNAL 檔案絕不能被當作被治理專案的規則來源引用**（那裡沒有這個檔案）。子技能與生成的 AGENTS.md 文本只能指向 INSTALLED 路徑——`docs/rules/*`、被治理專案自己的 `AGENTS.md`、或複製過去的 `scripts/*`。
2. **SKILL-INTERNAL 腳本在本倉庫形態之外必須 no-op**，因為打包仍會帶上它。`check-coding-hygiene.js` 的做法是：缺少套件佈局時報告 `applicable: false`。

### 第二條軸：可移植性（檔案"去哪裡"與其內容"在那裡是否成立"）

分發角色回答的是*檔案被投遞到哪裡*，它不回答*誰來讀*、也不回答*其陳述在被讀到的地方是否為真*。
這是另一條軸；把兩者混為一談已經產生了一類真實缺陷：角色分類正確的 INSTALLED 檔案，其正文卻讓
被治理專案執行 `npm run check`（那裡沒有 package.json）、指向 `references/…` 兄弟檔案（INIT
會改名或根本不安裝），或假定專案維護三語文件樹。

| 受眾 | 在哪裡讀到 | 內容必須具備的可移植性 |
| --- | --- | --- |
| skill 執行器 | 在技能套件內 | skill 可移植——可命名載荷路徑（`references/…`），絕不可命名 repo-only 路徑（`docs/`、`package.json`） |
| 被治理專案的 agent | 在目標專案內 | 專案可移植——所命名的每個路徑、命令、腳本都必須在**那裡**存在 |
| 本倉庫貢獻者 | 在本倉庫內 | 倉庫專屬——可命名本倉庫任何內容 |
| 生成器 | 讀範本、寫目標檔案 | 其輸出在寫入的那個階段必須是專案可移植的 |

逐檔案範例：`SKILL.md` = skill 可移植 · `lifecycle.policy.md` = 專案可移植（安裝為
`docs/rules/lifecycle.md`）· `release.md` = 被治理專案可移植 · `skill-release.md` = 技能倉庫專屬 ·
`check-doc-parity.js` 等 repo-only 門禁 = 倉庫專屬 · 本倉庫的 `AGENTS.md` = 倉庫專屬。

由此得出三條規則：

1. **INSTALLED 內容必須專案可移植。** INSTALLED 檔案引用兄弟檔案時，使用**目標專案擁有的**路徑
   （`docs/rules/*.md`），或不帶路徑地陳述該事實。倉庫專屬的命令與路徑事實屬於倉庫檔案，絕不進入
   已安裝的規則正文。
2. **在執行環境驗證，而不是在創作環境。** 創作倉庫能解析目標專案解析不了的引用；正確性要靠生成一個
   真實專案並在那裡解析來判定。"看起來像倉庫專屬"是錯誤的篩子——它能抓到 `本倉庫`，卻漏掉每一個
   讀起來完全正常、只是沒被安裝的引用。**缺陷按可解析性分佈，不按可疑措辭分佈。**
3. **階段可移植性也屬於這一軸。** Phase A 工件不得命令 Phase B 才安裝的腳本。生成的 `AGENTS.md`
   按階段裁剪其條款（`<!-- phase:A -->` / `<!-- phase:B+ -->` / `<!-- phase:C -->`），後續階段
   原地升級該檔案，使專案持有的規則始終與其擁有的腳本相匹配。

### 目錄職責

| 路徑 | 職責 | 讀者 | 語言 |
| --- | --- | --- | --- |
| `SKILL.md` | Skill 入口 / 產品規範 | agent（skill 使用者） | 單語 |
| `references/` | **Skill 主體——skill 行為唯一存放處。** INSTALLED 與 SKILL-INTERNAL 混裝（見角色表）。 | agent（skill 使用者） | 單語 |
| `scripts/` | Skill 執行時腳本。同樣混裝：7 個是 INSTALLED（複製進被治理專案），其餘是只在本倉庫執行的 SKILL-INTERNAL 工具。 | agent/CI | 程式碼 |
| `LICENSE` | MIT 授權條款——隨 tarball 分發 | 安裝者 | — |
| `docs/` | **專案知識。REPO-ONLY。** 開發者維護，供開發者與在本倉庫工作的 Agent 讀取：如何使用 skill（`commands.md` 觸發詞）、設計計劃（`plans/`）、路線圖、術語表。 | 開發者 + Agent | 三語 |
| `tests/`、`package.json`、`.github/`、`CHANGELOG.md`、`CONTRIBUTING.md`、`README.md`、`AGENTS.md`、`.gitattributes` | REPO-ONLY 基礎設施：CI、發佈流程、變更日誌、貢獻指南 | 倉庫維護者 | 按檔案 |

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
│       └── release.md          # 發佈前置檢查 + 版本一致性（被治理項目）
├── scripts/                    # skill 執行時腳本——安裝進被治理專案的腳本 + 生成器
│   ├── verify_governance.js    # 校驗引擎（manifest 驅動路徑 + governance_version）
│   ├── check-lock.js           # 多 Agent 鎖檢查（唯讀，exit 1 = 持鎖）
│   ├── check-git-policy.js     # Git 工作流程閘門（受保護分支 + directPush=false → exit 1）
│   ├── check-secrets.js        # 密鑰掃描閘門（暫存區掃描，絕不列印密鑰）
│   ├── check-sync.js           # 同步組閘門（watch/require 對照，exit 1）
│   ├── check-doc-freshness.js  # 文件過時度 + 譯文新鮮度（git log 日期；建議性，--release-gate 阻斷過時/draft 譯文）
│   ├── check-doc-consistency.js # 文件一致性 + consent/受保護清單/原則索引/計劃狀態/術語簇（預設建議性；--gate/--release-gate fail-closed；changelog 覆蓋僅 --release-gate fail-closed）
│   ├── generate-governance.js  # INIT 腳本化生成器（SKILL-INTERNAL；規範：references/init-spec.json）
│   └── release-manager.js      # plan（唯讀）+ execute（審批閘門）發佈工具
├── LICENSE                     # MIT
│
│  ▼ 安裝載荷到此為止——以下全是倉庫基礎設施，
│    不隨 skill 複製進安裝目錄。該邊界是**物理的**：package-skill.sh 只複製
│    SKILL.md + references/ + scripts/ + LICENSE，因此本行以下的檔案無論宣告
│    什麼角色都進不了 tarball。
│
├── repo-tools/                 # 本倉庫自己的閘門與打包——絕不分發
│   ├── check-doc-parity.js     # 三語文件樹平行度（CI + 發佈前置）
│   ├── check-layout-sync.js    # architecture.md 倉庫佈局 vs 四個受掃描目錄（fail-closed 閘門）
│   ├── check-plan-delivery.js  # 計劃宣告 vs 實際交付（歸檔前閘門）
│   ├── check-role-completeness.js # 分發角色完整性（未分類/重疊/失效路徑/打包邊界 + repo-only 反向檢查）
│   ├── check-coding-hygiene.js # 編碼衛生（測試歸屬 + 殘留標記）
│   └── package-skill.sh        # 發佈載荷 tarball 打包
├── repo-workflows/             # 本倉庫自己的流程文件——絕不分發
│   └── skill-release.md        # 技能倉庫發佈流程（版本三處 + tag、tarball 建置）
│
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
    ├── run-tests.js            # 單一發現入口：僅 runner + 彙總
    ├── support/helpers.js      # 共享 fixture、git 輔助、腳本路徑常數、暫存根生命週期
    └── suites/                 # 領域套件（validator、security、consistency、docs、
                                # release、generator、payload、hygiene）——見反補丁計劃 §3
```

安裝載荷 = `SKILL.md` + `references/` + `scripts/` + `LICENSE` 四項。分割線以下（`docs/`、`tests/`、`package.json`、`.github/`、README、CONTRIBUTING、CHANGELOG、AGENTS.md）是倉庫基礎設施——不得複製進 skill 安裝目錄。一處例外說明：`repo-tools/check-coding-hygiene.js` 會隨 tarball 分發（打包整目錄複製 `scripts/`），但**未**在 `references/init-spec.json` 宣告，INIT 從不安裝或執行它；在本倉庫佈局之外執行時它報告 not applicable 並 exit 0。
