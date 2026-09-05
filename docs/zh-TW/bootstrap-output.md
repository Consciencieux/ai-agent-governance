# Bootstrap 輸出

[English](../en/bootstrap-output.md) · [简体中文](../zh-CN/bootstrap-output.md) · [繁體中文](bootstrap-output.md)

INIT 腳本化生成器（`scripts/generate-governance.js`）為被治理專案產出**確定性**的引導檔案樹。機器可讀的單一事實源是 `references/init-spec.json`；本頁是給人看的人肉摘要——兩者衝突時以規範為準。

## Phase A — 靜態骨架

| 路徑 | 來源 |
| --- | --- |
| docs/rules/lifecycle.md | references/policies/lifecycle.policy.md |
| docs/rules/git-policy.md | references/policies/git.policy.md |
| docs/rules/security.md | references/policies/security.policy.md |
| docs/rules/coding.md | references/policies/coding.policy.md |
| docs/rules/testing.md | references/policies/testing.policy.md |
| docs/rules/governance-files.md | references/policies/governance-files.policy.md |
| AGENTS.md | references/templates/agents-md.template.md（佔位符已解析） |
| CHANGELOG.md | 靜態（Keep a Changelog，含 Unreleased 段） |
| README.md | 靜態引導 + 文件索引 |
| docs/features/ | 目錄佔位 + _TEMPLATE.md（功能範本，含反虛構規則） |
| docs/plans/ + docs/plans/archive/ | 目錄（歸檔按生命週期 Phase 5） |
| docs/plans/DEVELOPMENT_PLAN.md | 靜態里程碑計劃 |
| docs/ARCHITECTURE.md | 靜態骨架（元件登記表 + ADR） |

## Phase B — 設定、狀態與腳本

| 路徑 | 來源 |
| --- | --- |
| .gitignore | 生成（安全基線，確定性） |
| .env.example | references/templates/env-example.template.md |
| .gitmessage.txt | references/templates/gitmessage.template.md |
| .governance/ + .governance/README.md | 目錄 + 靜態說明 |
| .governance/manifest.json | 最後生成——只列出磁碟上實際存在的工件 |
| .governance/state.json / preflight.json | 生成（確定性；preflight 欄位留空至 Phase 0 檢測填寫） |
| .governance/git-policy.json / sync-rules.json | 範本（JSON 從程式碼區塊提取） |
| scripts/verify-governance.js + 4 個門禁腳本 | 從本 skill 原樣複製 |

## Phase C — 結構適配與可選鉤子

| 路徑 | 來源 |
| --- | --- |
| .github/workflows/ci.yml（或 .gitlab-ci.yml） | 從 references/workflows/ci.md 按輸入選擇 |
| scripts/check-doc-freshness.js + check-doc-consistency.js | 從本 skill 原樣複製 |
| .governance/generated/skills/ | 從 references/templates/sub-skills.md 生成 |
| .githooks/pre-commit + .githooks/commit-msg | references/templates/githooks-template.md；可執行、可選啟用，INIT 不自動啟用 |

## 確定性與驗證

- 相同輸入產出位元組級一致的輸出（無時間戳、無隨機）。
- 已存在的檔案跳過、絕不覆蓋（合併而不覆蓋留到 Phase C）。
- Phase B 輸出通過 `scripts/verify-governance.js`（manifest 模式）——由 `tests/run-tests.js` 的端到端測試覆蓋。

CI 工作流程選擇、按工具偵測的入口檔案、README 語言佈局與結構適配模式（既有文件根）仍由 Agent 根據輸入決定；選擇後，Phase C 列出的工件由生成器產出。
