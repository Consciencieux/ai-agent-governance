# 貢獻指南

[English](CONTRIBUTING.md) · [简体中文](CONTRIBUTING.zh-CN.md) · [繁體中文](CONTRIBUTING.zh-TW.md)

感謝你對 AI Agent Governance 的關注！我們歡迎各種形式的貢獻——Bug 報告、功能建議、文件修正和程式碼變更。

## 報告問題

- **Bug** — 在 [GitHub Issues](https://github.com/Consciencieux/ai-agent-governance/issues) 提交，附上重現步驟、預期與實際行為、Agent / 工具版本。
- **功能建議** — 提交 Issue，描述使用場景和建議的行為。
- **安全問題** — 請勿在公開 Issue 中發佈機密或利用細節。可透過郵件聯繫維護者或使用 GitHub 的私密弱點報告。

## 開發環境

```bash
git clone https://github.com/Consciencieux/ai-agent-governance.git
cd ai-agent-governance
npm test                 # 執行測試套件
npm run check:must-ship  # CI 阻斷閘門——合入前必須通過
```

無需額外依賴——所有檢查都是零依賴的 Node.js 腳本。

## 提交變更

1. 從 `main` 拉出分支——一個分支只做一個邏輯變更
2. 實施變更
3. 執行 `npm test`；文件變更還需 `npm run check:docs`
4. 用 [Conventional Commits](https://www.conventionalcommits.org/) 英文提交：`feat(scope): subject` / `fix(scope): subject`
5. 推送並開 PR

CI 在每個 PR 上執行 `npm run check:must-ship`。綠了就行。

## 語言政策

本專案有三語文件（English、简体中文、繁體中文）：

- **簡體中文（zh-CN）是源語言** —— 修改從簡體發起，再同步到英文與繁體中文
- 改一種語言必須在同一次變更中同步另兩種
- `repo-tools/check-doc-parity.js` 強制結構一致性（CI 中執行）

Agent 面向的檔案（`SKILL.md`、`references/**`）一律單語，不參與三語拆分。

## 程式碼組織

完整倉庫佈局記錄在 [architecture.md](docs/product/zh-TW/architecture.md)（單一事實源）。關鍵區域：

| 路徑 | 角色 |
| --- | --- |
| `SKILL.md` · `references/` · `scripts/` | 技能載荷（交付給使用者） |
| `docs/product/{en,zh-CN,zh-TW}/` | 使用者面向的產品文件（三語） |
| `docs/plans/` · `docs/findings/` · `docs/research/` · `docs/design-decisions/` | 內部知識（簡體中文單語） |
| `tests/` | 測試套件 |
| `repo-tools/` · `repo-workflows/` | 僅限本倉的工具與工作流 |

**新檔案放哪裡？** 先判斷知識類型（路由表在 [docs/README.md](docs/README.md)），再決定路徑和語言。

## 修改治理框架

`SKILL.md`、`references/`、`scripts/` 定義交付給使用者的治理框架。這些變更影響更大：

1. 更新 `CHANGELOG.md`（純文件 → 不記；修復 → Fixed；新能力 → Added；破壞性 → Changed）
2. 升 `package.json` 版本（SemVer）
3. 保持版本一致：`package.json` · `CHANGELOG` · `SKILL.md` frontmatter · `references/init-spec.json` · tag
4. 發佈遵循 `repo-workflows/skill-release.md`，需人在環審批

## 驗證

按變更範圍匹配最窄的檢查：

| 變更涉及 | 執行 |
| --- | --- |
| `docs/`、`README`、`CONTRIBUTING` | `npm run check:docs` |
| `references/`、`scripts/`、`SKILL.md` | `npm run check:payload` |
| `tests/` | `npm run check:tests` |
| 範圍不確定或範圍較廣 | `npm run check:full` |
| 合入 / 發佈 | `npm run check:must-ship`（CI 閘門） |

所有閘門均為 fail-closed。不確定時升級到更寬範圍。完整閘門說明：[architecture.md](docs/product/zh-TW/architecture.md)。

## AI 輔助貢獻

歡迎 AI 輔助開發。貢獻者對理解、測試、評審與驗證產生的變更負最終責任。AI 輸出不覆蓋倉庫的單一事實源檔案、治理策略或驗證要求。

## License

[MIT](LICENSE) © 2026 Consciencieux
