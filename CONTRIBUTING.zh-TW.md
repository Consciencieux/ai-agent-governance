# 貢獻指南

[English](CONTRIBUTING.md) · [简体中文](CONTRIBUTING.zh-CN.md) · [繁體中文](CONTRIBUTING.zh-TW.md)

## 開發

```bash
npm test                 # 或 node tests/run-tests.js
npm run check:must-ship  # CI 阻斷閘門（必裝機械集合）
```

CI（ADR-0014 Migration Mode **已退出**；PLAN-0052）：所有分支 / PR 的阻斷權威是 `npm run check:must-ship`。本地仍可跑 `npm run check`，**不是** CI 作業。發佈另走 `repo-workflows/skill-release.md`。

## 各目錄用途

完整倉庫佈局——每個目錄及其角色、直到單一腳本——記錄在 [docs/product/zh-TW/architecture.md](docs/product/zh-TW/architecture.md)（Repository Layout，單一事實源）。此處僅保留指標：

| 路徑 | 記錄於 |
| --- | --- |
| `SKILL.md` · `references/` · `scripts/` | `docs/product/zh-TW/architecture.md` § Repository Layout |
| `tests/run-tests.js` | 測試入口——`npm test` 運行 |
| `docs/` 樹 · `docs/glossary.md` · `docs/design-decisions/` · `docs/plans/archive/` | 各語言文件、術語表、ADR、歸檔 |

**新檔案放哪裡？** 先判斷知識類型，再決定路徑和語言（不要先按語言選目錄）：

- 倉庫知識物件（產品 / 研究 / 發現 / 決策 / 路線圖 / 計畫 / 術語）→ `docs/README.md` 的路由表
- 技能安裝產物與物化源 → `SKILL.md`、`references/`、`scripts/`，按 `docs/product/zh-TW/architecture.md` 的分發角色放置。目錄按語義責任分類（ADR-0026）：指令源在 `references/instruction/`；`references/templates/` 只收留物化範本。
- 測試、CI 等開發基礎設施 → `tests/`、`.github/` 等

## 語言政策（按受眾）

- **Agent 面向的檔案一律單語** —— `SKILL.md`、`AGENTS.md`、`references/**` 以及產生產物的正文（AGENTS.md、rules、子技能）絕不攜帶第二語言段落。慣例：本 skill 自身的執行文件（`SKILL.md`、`references/policies`、`references/workflows`）用中文；自動載入的 Agent 指引（`AGENTS.md`、範本正文）用英文。
- **`docs/` 內語言跟知識類型走，不是整棵樹一種語言。** **使用者面向的產品文件**三語且拆分——六個 README / CONTRIBUTING 入口檔案在倉庫根目錄；其餘產品文件在 `docs/product/{en,zh-CN,zh-TW}/`。**簡體中文（zh-CN）是源語言**——修改從簡體發起，再同步到英文與繁體中文（台灣用語）。改一種語言必須**在同一次改動裡同步另兩種**（穩定文件）；活躍草稿可延遲翻譯至內容穩定，但 push/release 前必須補齊（parity 閘門兜底）。結構一致性由 `repo-tools/check-doc-parity.js` 強制（CI + 發佈前置 `docs.parity_passed`）。**路線圖**（`docs/plans/roadmap/`）三語。**計畫 / 發現 / 研究 / ADR** 是簡體中文規範單語，不參與三語 parity。
- **術語** —— 引入新術語前先查 `docs/glossary.md`，缺失則補三語條目；所有檔案保持同一譯法。

## 修改治理工件

`SKILL.md`、`references/`、`scripts/` 定義治理框架本身。本 skill 倉庫的發佈遵循其自身流程（見 `repo-workflows/skill-release.md`）：

1. 更新 `CHANGELOG.md`（分類：純文件 → 不記；修復 → Fixed；新能力 → Added；破壞性 → Changed）
2. 升 `package.json` 版本（SemVer：破壞性 → MAJOR，新能力 → MINOR，修復 → PATCH）
3. 保持版本一致：package.json · CHANGELOG · SKILL.md frontmatter · `references/init-spec.json` 預設值 · `scripts/lib/generate/run.js` 哨兵值 · tag
4. push 前必須 `npm test`；合入 `main` 前 `npm run check:must-ship` 必須綠
5. 僅透過 `release-manager` 流程發佈（前置檢查含 `gates.must_ship` → 版本同步 → 校驗 → tag → 推送已批准分支與 tag → GitHub Release 說明；技能 tarball 優先由 tag CI 上傳）

## 開發工作流

1. 從 `main` 拉出短生命週期分支（一個分支只做一個邏輯變更）
2. 檢查受影響面：讀變更觸及的檔案及其引用；分類變更（文件 / 治理機制 / 腳本校驗器 / 測試 / CI-發佈）——分類決定驗證範圍
3. 實施變更，遵循上文語言與 parity 規則
4. 運行與變更範圍匹配的檢查（見下方驗證要求）；合入前 `npm run check:must-ship` 必須綠
5. 提交前自查 diff：暫存檔案、無產生產物、無無關編輯
6. 用 Conventional Commit 提交（見提交約定）、推送分支、開 PR

## 驗證要求

宣告完成前跑與變更範圍匹配的閘門組；巡檢前跑 `npm run check:all`；發佈前跑 `npm run check:skill-release`（含 `--release-gate` 失敗即阻斷簇），見 `repo-workflows/skill-release.md`。記錄真實輸出，禁止聲稱「應該能過」。**CI 阻斷權威 = `npm run check:must-ship`**（ADR-0014 已退出；ADR-0024；PLAN-0052 已移除 Gen1 CI 觀測作業）。

### 範圍分級

按 `git diff --name-only` 前綴匹配最窄一列。範圍不確定時升級，絕不縮小驗證。各閘門同為 fail-closed 退出語意，僅執行集合不同。

| 範圍 | 何時使用 | 執行內容 |
| --- | --- | --- |
| `npm run check:docs` | 變更 `docs/`、`README.md`、`CONTRIBUTING.md`、`architecture.md` | test + parity + consistency + layout |
| `npm run check:payload` | 變更 `references/`、`scripts/`、`SKILL.md`、`LICENSE` | test + layout + consistency + role-completeness + hygiene |
| `npm run check:tests` | 變更 `tests/`、`.gitattributes` | test + hygiene |
| `npm run check:full` | 預設、範圍不定、或顯式全量 | test + parity + layout + consistency + hygiene + role-completeness |
| `npm run check:all` | 巡檢或顯式全量巡檢 | check + freshness + plan delivery |
| `npm run check:file-size` | 檔案肥胖訊號 / 巡檢 | 顧問級行數預算（`--gate` 僅 review 檔失敗）；不在日常 `check` |
| `npm run check:must-ship` | 合入 / 發佈 CI | 僅 must-ship 機械集合 |

### 各閘門證明什麼（證據分層）

| 閘門 | 檢查內容 | 證據分層 | 通過含義 |
| --- | --- | --- | --- |
| `npm test` | `tests/suites/*.test.js` | mechanical | 變更範圍條件滿足 |
| `check-doc-parity.js` | 三語樹結構 | mechanical | 結構平行（≠語義等價） |
| `check-layout-sync.js` | architecture.md ×3 與掃描目錄 | mechanical | 新檔有文件歸屬 |
| `check-doc-consistency.js --gate` | 跨文件事實簇（凍結；新檢查優先獨立腳本） | mechanical | 聲明與源一致 |
| `check-coding-hygiene.js --gate` | 套件歸屬、殘留標記 | mechanical | 測試架構完整 |
| `check-role-completeness.js --gate` | 角色分類 / 打包 | mechanical | 分發契約完整 |
| `check-doc-freshness.js` | 陳舊文件 / 譯文落後 | mechanical（報告；`--release-gate` 阻斷） | 未檢出機械陳舊 |
| `check-plan-delivery.js` | 計劃聲明 vs 交付路徑 | mechanical | 聲明檔案/識別存在 |
| `check-file-size-budget.js` | soft/review 行數預算（依物件類） | advisory（機械計數；是否拆分由人定） | 列出超 soft/review；不是拆分裁決 |
| `verify_governance.js` | 治理產物存在性 | mechanical | 本倉預設模式按設計失敗（ADR-0006） |

證據分層：**mechanical** = 標記/路徑/結構/存在（通過 ≠「行為正確」）；**human-attested** = 需人工（目前無自動閘門產出）；**unverified claim** = 僅聲明、無獨立核驗。

### 影響面檢查

觸及公共介面/模組/檔案前，先 `rg "<name>"`；命中列入 Affected Files。收尾用 `git diff --name-only` 對照：已列未改 → 補做或說明；已改未列 → 解釋或回退。並對照計劃 `Target`：域外改動必須說明或回退。

### 引用閉包檢查

載荷工作，以及「架構是否健全 / 規則是否混雜 / skill 是否可用」類問題：影響面只解決**本倉內**引用，對裝機物不夠。INSTALLED 檔寫在有 `references/workflows/release.md` 處、讀在沒有它的處。綠閘門 ≠ 目標閉包。按路由走：

1. **引用閉包** — 每個 INSTALLED 檔引用的路徑/命令/腳本須在**被治理專案**中存在。
2. **階段閉包** — 每階段自有輸出須滿足該輸出宣告的契約。
3. **乾淨目標核驗** — 打包 → INIT 臨時專案 → 在**那裡**跑規則/腳本/子技能。
4. **反向依賴** — 禁止：被治理規則 → 本倉 `docs/`；生成子技能 → SKILL-INTERNAL 腳本；INSTALLED → 本倉 `package.json`；Phase A → Phase B/C 檔。

按可解析性枚舉，禁止抽樣「看起來像本倉」的行。姿態參考：`scripts/check-doc-consistency.js`。Agent always-on 指標：`AGENTS.md` § Reference-closure check。

## 提交約定

英文 Conventional Commits：`feat(scope): subject` / `fix(scope): subject`。絕不提交產生的運行時輸出（`.governance/validation.json`、`.governance/drift-report.json`；被治理專案另有 `.governance/release-proposal.json`；本倉使用 `repo-tools/.release/proposal.json`——均已被 git 忽略）。

## AI 輔助貢獻

歡迎 AI 輔助開發。貢獻者對理解、測試、評審與驗證產生的變更負最終責任。AI 輸出不覆蓋倉庫的單一事實源檔案、治理策略或驗證要求。

對可能敏感的資訊安全問題，請勿在公開 issue 中發佈機密或利用細節。

## License

[MIT](LICENSE) © 2026 Consciencieux
