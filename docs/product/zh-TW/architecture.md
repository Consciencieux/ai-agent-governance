# Architecture

[English](../en/architecture.md) · [简体中文](../zh-CN/architecture.md) · [繁體中文](architecture.md)

本頁是倉庫佈局——本 skill 倉庫各目錄用途的開發者地圖。

skill 的行為（執行模式 INIT/AUDIT/RELEASE、生命週期管線、設計原則）定義在 skill 本體裡，不在本頁：見 [SKILL.md](../../../SKILL.md) 與 `references/`。本頁只記錄檔案都放在哪裡。

### 三種分發角色

每個檔案只屬於一個角色。`references/init-spec.json` 是機器可讀權威；`repo-tools/check-role-completeness.js --gate` 負責抓漏。

| 角色 | 定義 | 例子 |
| --- | --- | --- |
| **INSTALLED** | INIT 把它寫進被治理專案。該專案的 Agent 在執行期讀它。 | `references/policies/coding.policy.md` → `docs/rules/coding.md`；`scripts/check-secrets.js`；`agents-md.template.md` → `AGENTS.md` |
| **SKILL-INTERNAL** | 隨 tarball 分發，由 skill 執行器讀取——但 INIT 從不安裝，被治理專案裡沒有此檔案。 | `references/init-spec.json`、`references/workflows/release.md`、`scripts/generate-governance.js`、`references/principles/*` |
| **REPO-ONLY** | 完全不進 tarball。僅約束本倉庫。 | `repo-tools/**`、`repo-workflows/**`、`AGENTS.md`、`docs/**`、`tests/**`、`package.json`、`.github/**` |

硬規則：

1. **SKILL-INTERNAL 檔案不得被當作被治理專案的規則來源引用**——那裡沒有。子技能與生成的 AGENTS.md 只能指向 INSTALLED 路徑（`docs/rules/*`、`scripts/*`）。
2. **SKILL-INTERNAL 腳本在本倉庫形態之外必須 no-op**（缺少預期佈局時報告 `applicable: false`）。

### 可移植性（檔案「去哪裡」與內容「在那裡是否成立」）

| 受眾 | 在哪裡讀 | 內容要求 |
| --- | --- | --- |
| skill 執行器 | 技能套件內 | skill 可移植——可命名 `references/…`，不可命名 repo-only 路徑 |
| 被治理專案 agent | 目標專案內 | 專案可移植——命名的路徑、命令、腳本必須在**那裡**存在 |
| 本倉庫貢獻者 | 本倉庫內 | 倉庫專屬——可命名任何內容 |
| 生成器 | 讀範本、寫目標 | 輸出在寫入階段必須專案可移植 |

硬規則：

1. **INSTALLED 內容必須專案可移植。** 引用兄弟檔案用目標專案路徑（`docs/rules/*.md`）；倉庫專屬命令不進安裝規則。
2. **在執行環境驗證，不在創作環境。** 生成真實專案並在那裡解析。
3. **階段可移植性也算。** Phase A 工件不得呼叫 Phase B 腳本。生成的 `AGENTS.md` 按階段裁剪（`<!-- phase:A/B+/C -->`）。

### 施工出處（倉庫知識 vs skill 合同）

| 歸屬 | 可引用 | 不得出現在 skill 載荷 |
| --- | --- | --- |
| **本倉庫（生產者）** | `PLAN-*`、`ADR-*`、`FINDING-*`、`RESEARCH-*`、本倉路徑、npm scripts | — |
| **Skill 產品** | 產品語言（`judgment`/`mechanical`、`CTRL-*` 控制、安裝路徑） | `PLAN-*`、`ADR-*`、`FINDING-*`、`RESEARCH-*`、指向本倉 `docs/` 的指標 |

邊界決策記錄：[ADR-0020](../../design-decisions/ADR-0020-producer-product-governance-separation.md) 不變量 I5。

### 目錄職責

| 路徑 | 職責 | 讀者 | 語言 |
| --- | --- | --- | --- |
| `SKILL.md` | 薄 always-on 入口（身分 · 模式 · 不變量 · 能力路由） | agent（skill 使用者） | 單語 |
| `references/` | **Skill 主體——行為唯一存放處。** INSTALLED 與 SKILL-INTERNAL 混裝。 | agent（skill 使用者） | 單語 |
| `scripts/` | Skill 執行時腳本。INSTALLED 與 SKILL-INTERNAL 混裝。 | agent/CI | 程式碼 |
| `LICENSE` | MIT 授權條款——隨 tarball 分發 | 安裝者 | — |
| `docs/` | **專案知識。REPO-ONLY。** | 開發者 + Agent | 依知識類型 |
| `tests/`、`package.json`、`.github/`、`CHANGELOG.md`、`README*.md`、`CONTRIBUTING*.md`、`AGENTS.md`、`.gitattributes` | REPO-ONLY 基礎設施 | 倉庫維護者 | 按檔案 |

### 倉庫佈局

```
ai-agent-governance/
├── SKILL.md                    # 薄 always-on 入口 + 能力路由
├── references/                 # skill 本體——行為唯一所在地
│   ├── init-spec.json          # 機器可讀 INIT 規範（generate-governance.js 的單一事實源）
│   ├── instruction/                # 可執行指令源（不是 templates）
│   │   ├── agents-md.template.md   # AGENTS.md 運行時合同源
│   │   └── sub-skills.md           # 生成 skill 的來源
│   ├── templates/                  # 只收留物化範本（bootstrap / machine-state）
│   │   ├── feature-doc.template.md / env-example.template.md / gitmessage.template.md
│   │   ├── git-policy.template.md / githooks-template.md / sync-rules.template.md
│   ├── policies/
│   │   ├── lifecycle.policy.md / git.policy.md / security.policy.md / coding.policy.md / testing.policy.md
│   │   └── governance-files.policy.md
│   ├── capabilities/               # Capability 葉權威（INIT → docs/rules/capabilities/）
│   │   ├── enforcement.v0.json     # 義務分類庫存
│   │   ├── audit-drift.md / change-hygiene.md / confirmation-hygiene.md / content-consistency.md
│   │   ├── deterministic-init.md / discovery-ledger.md / doc-freshness.md / engineering-restraint.md
│   │   ├── evidence-tiers.md / generated-subskill-lifecycle.md / git-workflow-safety.md
│   │   ├── git-write-consent.md / governance-state.md / governance-validator.md
│   │   ├── installed-portability.md / plan-sync.md / release-orchestration.md
│   │   ├── release-risk-tiering.md / review-mechanism.md / root-cause-repair.md
│   │   ├── rule-capture.md / secret-scanning.md / seed-oracles.md / ssot-repair.md / sync-groups.md
│   │   └── subskills/
│   │       ├── subskill-ci-generator.md / subskill-drift-check.md / subskill-governance-validator.md / subskill-plan-manager.md
│   │       └── subskill-release-manager.md / subskill-repository-inspection.md / subskill-review-manager.md / subskill-state-manager.md
│   ├── principles/                 # 可重用方法論（SKILL-INTERNAL — INIT 不安裝）
│   │   ├── entry.md / instruction-architecture.md / document-model.md / metadata-policy.md
│   │   └── capability-model.md / decision-records.md / migration-method.md / control-shape.md / enforcement-semantics.md
│   ├── contracts/
│   │   └── sibling-closure.example.json
│   └── workflows/
│       ├── ci.md               # CI 範本（能力偵測 + 降級）
│       └── release.md          # 發佈前置檢查 + 版本一致性（被治理項目）
├── scripts/                    # skill 執行時腳本——安裝進被治理專案 + 生成器
│   ├── verify_governance.js    # 校驗引擎（manifest 驅動路徑 + governance_version）
│   ├── check-lock.js / check-git-consent.js / check-sibling-closure.js / check-file-size-budget.js
│   ├── migrate-governance.js / check-git-policy.js / check-secrets.js / check-sync.js
│   ├── lib/
│   │   ├── git-facts.js / md-link-facts.js / plan-status.js / secret-scan-facts.js
│   │   ├── doc-consistency/
│   │   │   ├── run.js / shared.js
│   │   │   ├── changelog-coverage.js / version-examples.js / protected-files.js
│   │   │   ├── principles-index.js / plan-status.js
│   │   │   └── broken-links.js / prompt-sync.js
│   │   └── generate/
│   │       └── run.js              # INIT 生成器本體（SKILL-INTERNAL）
│   ├── evaluators/
│   │   ├── ctrl-0001-secret-protection.js / ctrl-0002-git-write-consent.js
│   │   ├── ctrl-0003-doc-freshness.js / ctrl-0004-translation-freshness.js
│   │   └── ctrl-0006-broken-links.js
│   ├── check-doc-freshness.js / check-doc-consistency.js / check-plan-sync.js
│   ├── generate-governance.js      # 薄 INIT CLI（SKILL-INTERNAL）
│   └── release-manager.js          # plan（唯讀）+ execute（審批閘門）發佈工具
├── LICENSE                     # MIT
│
│  ▼ 安裝載荷到此為止——以下全是倉庫基礎設施。
│    package-skill.sh 只複製 SKILL.md + references/ + scripts/ + LICENSE。
│
├── repo-tools/                 # 本倉庫自己的閘門與打包——絕不分發
│   ├── check-doc-parity.js / check-layout-sync.js / check-plan-delivery.js
│   ├── check-role-completeness.js / check-coding-hygiene.js / check-file-size-budget.js
│   ├── check-daily-check-surface.js / daily-check-surface.v0.json
│   ├── check-secrets.js
│   ├── check-must-ship.js / check-must-ship-carriers.js
│   ├── lib/
│   │   └── routing.js
│   ├── routing-graph.v0.json
│   ├── script-inventory.v0.json / oracle-inventory.v0.json / route-task.js
│   └── package-skill.sh        # 發佈載荷 tarball 打包
├── repo-workflows/             # 本倉庫自己的流程文件——絕不分發
│   ├── changelog-policy.md
│   └── skill-release.md
│
├── docs/                       # 專案知識——開發者維護
│   ├── glossary.md             # 三語術語對照表
│   ├── product/                # 使用者向文件——三語（en / zh-CN / zh-TW）
│   ├── plans/                  # 執行計劃（簡中 canonical）
│   │   ├── roadmap/            # 三語
│   │   └── archive/
│   ├── findings/               # Issue/Finding 檔案（簡中）
│   ├── research/               # 研究知識庫（簡中）
│   └── design-decisions/       # 架構決策記錄（簡中）
├── README.md / README.zh-CN.md / README.zh-TW.md
├── CONTRIBUTING.md / CONTRIBUTING.zh-CN.md / CONTRIBUTING.zh-TW.md
├── AGENTS.md / CHANGELOG.md / package.json
├── .github/                    # CI：must-ship 閘門 + 版本 tag 時 skill-payload-release
└── tests/
    ├── run-tests.js            # 單一發現入口
    ├── support/helpers.js
    └── suites/                 # 領域套件（validator、security、consistency、docs 等）
```

發佈草稿 `repo-tools/.release/proposal.json` 已 gitignore，故意不列在上方佈局樹中。

安裝載荷 = `SKILL.md` + `references/` + `scripts/` + `LICENSE` 四項。分割線以下是倉庫基礎設施——不得複製進 skill 安裝目錄。
