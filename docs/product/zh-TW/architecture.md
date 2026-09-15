# Architecture

[English](../en/architecture.md) · [简体中文](../zh-CN/architecture.md) · [繁體中文](architecture.md)

本頁是倉庫佈局——本 skill 倉庫各目錄用途的開發者地圖。

skill 的行為（執行模式 INIT/AUDIT/RELEASE、生命週期管線、設計原則）定義在 skill 本體裡，不在本頁：見 [SKILL.md](../../../SKILL.md) 與 `references/`。本頁只記錄檔案都放在哪裡。

### 三種分發角色（給任何檔案歸類前先讀這裡）

「載荷（payload）」過去同時指三件不同的事——這正是一個倉庫專用工具被標成「NOT payload」卻放在 `scripts/` 裡、以及一個子技能引用了被治理專案根本收不到的工作流程檔案的原因。改用下面三個互斥角色名；`references/init-spec.json` 是判定角色的機器可讀權威：

| 角色 | 定義 | 如何核驗 | 例子 |
| --- | --- | --- | --- |
| **INSTALLED（安裝到被治理專案）** | INIT 把它寫進被治理專案（copy / template / generated）。該專案的 Agent 在執行期讀它。 | 在 `init-spec.json` 中作為 `source` 出現（當前數量見 `check-role-completeness.js --gate` 輸出） | `references/policies/coding.policy.md` → `docs/rules/coding.md`；`scripts/check-secrets.js`；`agents-md.template.md` → `AGENTS.md` |
| **SKILL-INTERNAL（隨 tarball 但不安裝）** | 隨 tarball 分發（打包整目錄複製 `references/` + `scripts/`）且由 **skill 執行器**讀取——但 INIT 從不安裝它，所以被治理專案裡沒有這個檔案。 | 在 `init-spec.json` 的 `distribution.skillInternal` 中列出 | `references/init-spec.json`、`references/workflows/release.md`、`scripts/generate-governance.js`，以及 `references/principles/*`（可重用方法論；PLAN-0037） |
| **REPO-ONLY（僅本倉庫）** | 完全不進 tarball。約束在本倉庫上的工作。 | 在 `references/`/`scripts/`/`SKILL.md`/`LICENSE` 之外 | `repo-tools/**`、`repo-workflows/**`、`AGENTS.md`、`docs/**`、`tests/**`、`package.json`、`.github/**`、`.gitattributes` |

角色是**人的決定，絕不推斷**：`copy`/`template`/`generated`、重命名（`lifecycle.policy.md` → `docs/rules/lifecycle.md`、`verify_governance.js` → `verify-governance.js`）、一對多輸出（`githooks-template.md` → `pre-commit` + `commit-msg`）以及 內嵌靜態內容工件（`type: "static"`），都編碼了生成器無法從檔案樹恢復的契約決定。**可機械化的只是抓漏**：`repo-tools/check-role-completeness.js --gate` 會在出現未分類檔案、同時屬於兩個集合、聲明路徑已不存在、或角色聲明與 `package-skill.sh` 實際打包不符時失敗。角色確實未決的檔案放進 `distribution.undecided` 並記錄待裁定問題，該閘門保持紅色直到裁定。最初放進去的兩項都已裁定完畢：`governance-files.policy.md` 現作為 `docs/rules/governance-files.md` 安裝（那個 INSTALLED 的檢查器在執行時讀它），`feature-doc.template.md` 現作為 `docs/features/_TEMPLATE.md` 安裝（SKILL.md 讓 Agent 複製它）。當前 `undecided` 為空，各角色的即時數量以 `check-role-completeness.js --gate` 的輸出為準。

由此得出兩條規則，且在本表存在之前兩條都被違反過：

1. **SKILL-INTERNAL 檔案絕不能被當作被治理專案的規則來源引用**（那裡沒有這個檔案）。子技能與生成的 AGENTS.md 文本只能指向 INSTALLED 路徑——`docs/rules/*`、被治理專案自己的 `AGENTS.md`、或複製過去的 `scripts/*`。
2. **SKILL-INTERNAL 腳本在本倉庫形態之外必須 no-op**，因為打包仍會帶上它（角色是 SKILL-INTERNAL 的檔案隨 tarball 走、INIT 不安裝）。`check-coding-hygiene.js`（現為 REPO-ONLY，不再打包）的做法是：缺少套件佈局時報告 `applicable: false`。

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
| `SKILL.md` | 薄 always-on 入口（身分 · 模式 · 不變量 · 能力路由）。完整政策/工作流正文在 `references/`；must-ship 可呼叫葉卡在 `references/capabilities/`（PLAN-0046）。不是百科。 | agent（skill 使用者） | 單語 |
| `references/` | **Skill 主體——skill 行為唯一存放處。** INSTALLED 與 SKILL-INTERNAL 混裝（見角色表）。 | agent（skill 使用者） | 單語 |
| `scripts/` | Skill 執行時腳本。INSTALLED 與 SKILL-INTERNAL 混裝（當前數量見 `check-role-completeness.js --gate`）。INSTALLED 腳本複製進被治理專案。 | agent/CI | 程式碼 |
| `LICENSE` | MIT 授權條款——隨 tarball 分發 | 安裝者 | — |
| `docs/` | **專案知識。REPO-ONLY。** 開發者維護，供開發者與在本倉庫工作的 Agent 讀取：如何使用 skill（`commands.md` 觸發詞）、設計計劃（`plans/`）、findings 檔案（`findings/`）、研究知識庫（`research/`）、路線圖、術語表。 | 開發者 + Agent | 依知識類型：Product/Roadmap 三語；Plan/Finding/Research/ADR 以簡中為 canonical |
| `tests/`、`package.json`、`.github/`、`CHANGELOG.md`、`README*.md`、`CONTRIBUTING*.md`、`AGENTS.md`、`.gitattributes` | REPO-ONLY 基礎設施：CI、發佈流程、變更日誌、貢獻指南 | 倉庫維護者 | 按檔案 |

### 倉庫佈局

```
ai-agent-governance/
├── SKILL.md                    # 薄 always-on 入口 + 能力路由（非政策百科）
├── references/                 # skill 本體——skill 行為唯一所在地
│   ├── init-spec.json          # 機器可讀 INIT 規範（generate-governance.js 的單一事實源）
│   ├── instruction/                # 可執行指令源（ADR-0026；不是 templates）
│   │   ├── agents-md.template.md   # AGENTS.md 運行時合同源
│   │   └── sub-skills.md           # 生成 skill 的來源；每個會變成 .governance/generated/skills/<name>/SKILL.md
│   ├── templates/                  # 只收留物化範本（bootstrap / machine-state）
│   │   ├── feature-doc.template.md # Feature 文件範本（含反虛構規則）
│   │   ├── env-example.template.md # .env.example 範本（佔位符、按依賴裁剪）
│   │   ├── gitmessage.template.md  # .gitmessage.txt 範本（提交約定）
│   │   ├── git-policy.template.md  # .governance/git-policy.json 範本（Git 工作流程策略）
│   │   ├── githooks-template.md     # 可選 .githooks/pre-commit + commit-msg 範本
│   │   └── sync-rules.template.md  # .governance/sync-rules.json 範本（同步組）
│   ├── policies/
│   │   ├── lifecycle.policy.md / git.policy.md / security.policy.md / coding.policy.md / testing.policy.md
│   │   └── governance-files.policy.md   # 受保護檔案 + .governance Git 追蹤策略
│   ├── capabilities/               # Capability 葉權威（Phase 5c；INIT → docs/rules/capabilities/）
│   │   ├── audit-drift.md / change-hygiene.md / confirmation-hygiene.md / content-consistency.md / deterministic-init.md / discovery-ledger.md / doc-freshness.md / engineering-restraint.md / evidence-tiers.md / generated-subskill-lifecycle.md / git-workflow-safety.md / git-write-consent.md / governance-state.md / governance-validator.md / installed-portability.md / plan-sync.md / release-orchestration.md / release-risk-tiering.md / review-mechanism.md / root-cause-repair.md / rule-capture.md / secret-scanning.md / seed-oracles.md / ssot-repair.md / sync-groups.md
│   │   └── subskills/
│   │       ├── subskill-ci-generator.md / subskill-drift-check.md / subskill-governance-validator.md / subskill-plan-manager.md
│   │       └── subskill-release-manager.md / subskill-repository-inspection.md / subskill-review-manager.md / subskill-state-manager.md
│   ├── principles/                 # 可重用方法論（PLAN-0037；SKILL-INTERNAL — INIT 不安裝）
│   │   ├── entry.md
│   │   ├── instruction-architecture.md / document-model.md / metadata-policy.md
│   │   ├── capability-model.md / decision-records.md / migration-method.md
│   │   ├── control-shape.md / enforcement-semantics.md
│   ├── contracts/                  # 可移植合約示例（INIT 可複製進 .governance/）
│   │   └── sibling-closure.example.json
│   └── workflows/
│       ├── ci.md               # CI 範本（能力偵測 + 降級）
│       └── release.md          # 發佈前置檢查 + 版本一致性（被治理項目）
├── scripts/                    # skill 執行時腳本——安裝進被治理專案的腳本 + 生成器
│   ├── verify_governance.js    # 校驗引擎（manifest 驅動路徑 + governance_version）
│   ├── check-lock.js     # lock status + atomic acquire/release (FINDING-0012)
│   ├── check-git-consent.js # CTRL-0002 git argv consent classifier (does not run git)
│   ├── check-sibling-closure.js # sibling-instance 閉包載體（已宣告合約；FINDING-0003）
│   ├── migrate-governance.js # 可發現 MIGRATE 入口（版本對比 + 清單；不自動改樹）
│   ├── check-git-policy.js     # Git 工作流程閘門（受保護分支 + directPush=false → exit 1）
│   ├── check-secrets.js        # skill 側 CTRL-0001 CLI WRAP（暫存區掃描；絕不列印密鑰）
│   ├── check-sync.js           # 同步組閘門（watch/require 對照，exit 1）
│   ├── lib/
│   │   ├── git-facts.js        # 共享 git/path/date 事實 primitive（無 Control 政策）
│   │   ├── md-link-facts.js    # 共享 Markdown 連結事實 primitive（extract/resolve/exists）
│   │   ├── plan-status.js      # ADR-0016 計劃 status frontmatter 分類器（PLAN-0048）
│   │   ├── adr-status.js       # FINDING-0011 ADR Status 欄位啟發（PLAN-0048）
│   │   ├── secret-scan-facts.js # 共享密鑰掃描事實 primitive（模式 / staged / blob）
│   │   ├── doc-consistency/
│   │   │   ├── run.js                 # 薄編排器（PLAN-0055 R10 閘門簇 EXTRACT）
│   │   │   ├── shared.js              # 共享 helper/常量
│   │   │   ├── changelog-coverage.js  # 閘門：changelog 覆蓋
│   │   │   ├── version-examples.js    # 閘門：version-example 同步
│   │   │   ├── protected-files.js     # 閘門：protected-files 同步
│   │   │   ├── consent-cluster.js     # 閘門：consent-cluster 同步
│   │   │   ├── principles-index.js    # 閘門：principles-index 指針
│   │   │   ├── plan-status.js         # 閘門：plan-status / pending-archive
│   │   │   ├── adr-status.js          # 閘門：ADR status 同步
│   │   │   ├── broken-links.js        # 閘門：連結有效性（CTRL-0006）
│   │   │   ├── numeric-claims.js      # 閘門：numeric claims
│   │   │   └── prompt-sync.js         # 閘門：prompt sync
│   │   └── generate/
│       │   └── run.js          # EXTRACT 出的 INIT 生成器本體（PLAN-0055 Stage 3/4S；SKILL-INTERNAL）
│   ├── evaluators/
│   │   ├── ctrl-0001-secret-protection.js   # CTRL-0001 密鑰保護求值器（CLI 綁定 deny）
│   │   ├── ctrl-0002-git-write-consent.js   # CTRL-0002 git argv 寫同意求值器
│   │   ├── ctrl-0003-doc-freshness.js       # CTRL-0003 治理文件新鮮度求值器（建議性）
│   │   ├── ctrl-0004-translation-freshness.js # CTRL-0004 譯文新鮮度求值器（--release-gate 阻斷）
│   │   └── ctrl-0006-broken-links.js        # CTRL-0006 相對 Markdown 連結有效性（consistency #4）
│   ├── check-doc-freshness.js  # 薄 CLI 包裝（CTRL-0003 + CTRL-0004；建議性，--release-gate 阻斷過時/draft 譯文）
│   ├── check-doc-consistency.js # 薄 consistency CLI → lib/doc-consistency/run.js（#4 → CTRL-0006；預設建議性；--gate/--release-gate fail-closed）
│   ├── check-plan-sync.js      # 計劃與里程碑對帳（預設建議性；--release-gate fail-closed；無 DEVELOPMENT_PLAN.md 時 no-op）
│   ├── generate-governance.js  # 薄 INIT CLI → lib/generate/run.js（SKILL-INTERNAL；規範：references/init-spec.json）
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
│   ├── check-daily-check-surface.js # 日常 npm run check 允許名單門禁（PLAN-0055）
│   ├── daily-check-surface.v0.json # check-daily-check-surface.js 允許名單資料
│   ├── check-terminology.js    # repo-owned 術語門禁（從 INSTALLED 一致性檢查器拆出；ADR-0020 首次執行分離）
│   ├── check-changelog-narration.js  # REPO-ONLY：Unreleased 驗證敘事標記；--gate fail-closed（FINDING-0016）
│   ├── check-secrets.js        # repo 側 CTRL-0001 CLI（共享 scripts/ 下 evaluator；不是 skill CLI 路徑）
│   ├── check-must-ship.js      # Phase 8 必裝機械門禁集合（PLAN-0044 / ADR-0024）
│   ├── check-must-ship-carriers.js  # 必裝載體存在性（子技能 / 腳本 / SKILL 入口）
│   ├── lib/routing.js          # Phase 5b 共享 resolve + Context Detector（PLAN-0039）
│   ├── routing-graph.v0.json   # 機讀 Task→Capability 圖（routing.js 消費；不是 Research 對象）
│   ├── script-inventory.v0.json
│   ├── oracle-inventory.v0.json
│   ├── route-task.js           # Phase 5b Dispatcher CLI — Task→Capability RoutingResult
│   ├── package-skill.sh        # 發佈載荷 tarball 打包
│   └── .release/proposal.json  # gitignored 技能發佈草稿（不入庫）
├── repo-workflows/             # 本倉庫自己的流程文件——絕不分發
│   ├── changelog-policy.md      # 本倉 CHANGELOG 政策（REPO-ONLY）
│   └── skill-release.md        # 技能倉庫發佈流程（版本五個同步點 + tag、tarball 建置）
│
├── docs/                       # 專案知識——開發者維護，開發者與 Agent 共享讀取（觸發詞、計劃、路線圖）
│   ├── glossary.md             # 三語術語對照表（共享）
│   ├── product/                # 使用者向文件——三語
│   │   ├── en/                 # 英文樹（architecture.md = 本頁）
│   │   ├── zh-CN/              # 簡體中文樹（源語言；含 README.md、CONTRIBUTING.md）
│   │   └── zh-TW/              # 繁體中文樹（臺灣；含 README.md、CONTRIBUTING.md）
│   ├── plans/                  # 執行計劃（簡體單語 canonical）
│   │   ├── roadmap/            # 路線圖——三語邊界物件（{en,zh-CN,zh-TW}.md）
│   │   ├── PLAN-xxxx-*.md      # 進行中的設計計劃
│   │   └── archive/            # 已完成計劃歸檔（共享，單語）
│   ├── findings/               # Issue/Finding 檔案（共享，簡體單語；狀態就地更新，永不歸檔）
│   ├── research/               # 研究知識庫——系統模型、機制分類、評價框架（共享，簡體單語；版本化/supersede 演進）
│   └── design-decisions/       # 架構決策記錄（共享，簡體單語）
├── README.md                   # 英文首頁
├── README.zh-CN.md             # 簡體中文首頁
├── README.zh-TW.md             # 繁體中文首頁
├── CONTRIBUTING.md             # 英文開發指南
├── CONTRIBUTING.zh-CN.md       # 簡體中文開發指南
├── CONTRIBUTING.zh-TW.md       # 繁體中文開發指南
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

安裝載荷 = `SKILL.md` + `references/` + `scripts/` + `LICENSE` 四項。分割線以下（`docs/`、`tests/`、`package.json`、`.github/`、README、CONTRIBUTING、CHANGELOG、AGENTS.md）是倉庫基礎設施——不得複製進 skill 安裝目錄。`repo-tools/` 與 `repo-workflows/` 按目錄即為 REPO-ONLY：打包步驟只複製以上四項，它們不可能進入 tarball。
