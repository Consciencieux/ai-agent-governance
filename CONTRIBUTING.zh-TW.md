# 貢獻指南

[English](CONTRIBUTING.md) · [简体中文](CONTRIBUTING.zh-CN.md) · [繁體中文](CONTRIBUTING.zh-TW.md)

## 開發

```bash
npm test        # 或 node tests/run-tests.js
```

CI 為雙模式（ADR-0014）：在 `main` / 1.x 上完整閘門組（`npm run check`）阻斷；在 `migration/2.0-governance-architecture` 上只有重構安全核心阻斷（JS 語法 + `--suite security/generator/payload`），第一代 `npm run check` 僅作觀測。

## 各目錄用途

完整倉庫佈局——每個目錄及其角色、直到單一腳本——記錄在 [docs/product/zh-TW/architecture.md](docs/product/zh-TW/architecture.md)（Repository Layout，單一事實源）。此處僅保留指標：

| 路徑 | 記錄於 |
| --- | --- |
| `SKILL.md` · `references/` · `scripts/` | `docs/product/zh-TW/architecture.md` § Repository Layout |
| `tests/run-tests.js` | 測試入口——`npm test` 運行 |
| `docs/` 樹 · `docs/glossary.md` · `docs/design-decisions/` · `docs/plans/archive/` | 各語言文件、術語表、ADR、歸檔 |

**新檔案放哪裡？** 先判斷知識類型，再決定路徑和語言（不要先按語言選目錄）：

- 倉庫知識物件（產品 / 研究 / 發現 / 決策 / 路線圖 / 計畫 / 術語）→ `docs/README.md` 的路由表
- 技能安裝產物與物化源 → `SKILL.md`、`references/`、`scripts/`，按 `docs/product/zh-TW/architecture.md` 的分發角色放置。**不要**把「產生機制」當成進入 `references/` 的分類標準；`references/templates/` 只是物化範本的目前位置，可執行指令源與 boilerplate 不是同一類（FINDING-0026）
- 測試、CI 等開發基礎設施 → `tests/`、`.github/` 等

## 語言政策（按受眾）

- **Agent 面向的檔案一律單語** —— `SKILL.md`、`AGENTS.md`、`references/**` 以及產生產物的正文（AGENTS.md、rules、子技能）絕不攜帶第二語言段落。慣例：本 skill 自身的執行文件（`SKILL.md`、`references/policies`、`references/workflows`）用中文；自動載入的 Agent 指引（`AGENTS.md`、範本正文）用英文。
- **`docs/` 內語言跟知識類型走，不是整棵樹一種語言。** **使用者面向的產品文件**三語且拆分——六個 README / CONTRIBUTING 入口檔案在倉庫根目錄；其餘產品文件在 `docs/product/{en,zh-CN,zh-TW}/`。**簡體中文（zh-CN）是源語言**——修改從簡體發起，再同步到英文與繁體中文（台灣用語）。改一種語言必須**在同一次改動裡同步另兩種**（穩定文件）；活躍草稿可延遲翻譯至內容穩定，但 push/release 前必須補齊（parity 閘門兜底；`main` 上阻斷，遷移分支上按遷移模式觀測）。結構一致性由 `repo-tools/check-doc-parity.js` 強制（CI + 發佈前置 `docs.parity_passed`）。**路線圖**（`docs/plans/roadmap/`）三語。**計畫 / 發現 / 研究 / ADR** 是簡體中文規範單語，不參與三語 parity。
- **術語** —— 引入新術語前先查 `docs/glossary.md`，缺失則補三語條目；所有檔案保持同一譯法。

## 修改治理工件

`SKILL.md`、`references/`、`scripts/` 定義治理框架本身。本 skill 倉庫的發佈遵循其自身流程（見 `repo-workflows/skill-release.md`）：

1. 更新 `CHANGELOG.md`（分類：純文件 → 不記；修復 → Fixed；新能力 → Added；破壞性 → Changed）
2. 升 `package.json` 版本（SemVer：破壞性 → MAJOR，新能力 → MINOR，修復 → PATCH）
3. 保持版本一致：package.json · CHANGELOG · SKILL.md frontmatter · `references/init-spec.json` 預設值 · `scripts/generate-governance.js` 哨兵值 · tag
4. push 前必須 `npm test`
5. 僅透過 `release-manager` 流程發佈（前置檢查 → 版本同步 → 校驗 → tag → push → GitHub Release）

## 開發工作流

1. 從目前工作分支拉出短生命週期分支：1.x 穩定工作從 `main`；2.0 遷移從 `migration/2.0-governance-architecture`（一個分支只做一個邏輯變更；遷移模式見 ADR-0014）
2. 檢查受影響面：讀變更觸及的檔案及其引用；分類變更（文件 / 治理機制 / 腳本校驗器 / 測試 / CI-發佈）——分類決定驗證範圍
3. 實施變更，遵循上文語言與 parity 規則
4. 運行與變更範圍匹配的檢查（見下方驗證要求）；遷移分支上安全核心阻斷，第一代閘門僅作觀測
5. 提交前自查 diff：暫存檔案、無產生產物、無無關編輯
6. 用 Conventional Commit 提交（見提交約定）、推送分支、開 PR

## 驗證要求

| 檢查 | 角色 | 何時 |
| --- | --- | --- |
| `npm run check:docs` | Gate | 文件（`docs/`、README、CONTRIBUTING）變更 |
| `npm run check:payload` | Gate | `references/` / `scripts/` / `SKILL.md` / LICENSE 變更 |
| `npm run check:tests` | Gate | `tests/` 變更 |
| `npm run check` | Gate | 預設 / 範圍不確定 |
| `npm run check:all` | 巡檢 | 巡檢前，或顯式全量巡檢 |
| `npm run check:skill-release` | 發佈 | 發佈前，按 `repo-workflows/skill-release.md` |

較窄條目對各自範圍 fail-closed；不確定時**升級到更大範圍**——絕不縮小驗證。**穩定 1.x 與 2.0 遷移：** 在 `main` 上這些閘門阻斷；在 `migration/2.0-governance-architecture` 上只有重構安全核心阻斷，第一代 `npm run check*` 僅作觀測（ADR-0014）。哪些閘門是 advisory 而非 fail-closed、通過各意味著什麼，見 `AGENTS.md` § Validation。

## 提交約定

英文 Conventional Commits：`feat(scope): subject` / `fix(scope): subject`。絕不提交產生的運行時輸出（`.governance/validation.json`、`.governance/drift-report.json`、`.governance/release-proposal.json` 已被 git 忽略）。

## AI 輔助貢獻

歡迎 AI 輔助開發。貢獻者對理解、測試、評審與驗證產生的變更負最終責任。AI 輸出不覆蓋倉庫的單一事實源檔案、治理策略或驗證要求。

對可能敏感的資訊安全問題，請勿在公開 issue 中發佈機密或利用細節。

## License

[MIT](LICENSE) © 2026 Consciencieux
