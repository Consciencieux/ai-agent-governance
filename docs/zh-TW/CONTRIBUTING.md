# 貢獻指南

[English](../../CONTRIBUTING.md) · [简体中文](../zh-CN/CONTRIBUTING.md) · [繁體中文](CONTRIBUTING.md)

## 開發

```bash
npm test        # 或 node tests/run-tests.js
```

測試套件涵蓋：空專案（exit 1）、完整預設結構（exit 0，21 項檢查）、自訂文件根經 manifest（manifest 模式）、缺 governance_version（exit 1）、`--json` 輸出、`--help`、無 `.agent` 殘留、`validation.json` 可選、CHANGELOG 格式檢查、鎖檢查（無狀態 / 未持鎖 / 持鎖）、Git 策略檢查（非法策略 / 受保護分支阻止 / 特性分支通過）、密鑰掃描（命中 exit 1 且不洩漏 token / 乾淨 exit 0 / 缺閘門使校驗器失敗）、發佈規劃（SemVer 分類：docs/重構 → patch、CLI 命令 → minor、刪除公開 API → major、不確定性 → 澄清、`--file` 輸入）與審批閘門（未批准 → 無 tag，批准 → 建立 annotated tag）、文件一致性（三樹平行 exit 0 / 標題漂移 exit 1 / 缺失檔案 exit 1）、知識新鮮度（git log 日期偵測 stale/very-stale）、內容一致性（乾淨 exit 0 / 版本示例標記 / 壞鏈標記）與 --json score（全過 1.0 / 部分 0.95）。CI 每次 push/PR 執行。

## 各目錄用途

| 路徑 | 用途 |
| --- | --- |
| `SKILL.md` | skill 入口 / 產品規格 —— INIT/AUDIT/RELEASE 編排 |
| `references/` | skill 本體 —— skill 行為唯一所在地：`templates/`（生成範本）· `policies/`（`*.policy.md` 規則，複製進被治理專案的 `docs/rules/`）· `workflows/`（CI + 發佈規範） |
| `scripts/verify_governance.js` | 校驗器原始碼，複製進被治理專案 |
| `scripts/release-manager.js` | 發佈工具：`plan`（唯讀）+ `execute`（審批閘門） |
| `scripts/generate-governance.js` | INIT 產生器：確定性引導鷹架（規範：`references/init-spec.json`） |
| `references/init-spec.json` | 機器可讀 INIT 規範（生成產出的單一事實源） |
| `tests/run-tests.js` | 測試套件 |
| `docs/en/` `docs/zh-CN/` `docs/zh-TW/` | 專案知識 —— 開發者維護，開發者與本倉庫工作的 Agent 共享讀取（怎麼用 skill：觸發詞、計劃、路線圖），每種語言一棵目錄樹；不屬於 skill 載荷 |
| `docs/glossary.md` | 三語術語對照表（術語的單一事實來源） |
| `docs/design-decisions/` | 架構決策記錄（共享，簡體單語） |
| `docs/archive/` | 已完成計劃歸檔（共享，單語，絕不翻譯） |

**新檔案放哪裡？** 如果刪掉該檔案會導致 Agent 無法執行（INIT/AUDIT/RELEASE 需要讀它）→ `references/`；如果是專案知識——開發者與在本倉庫工作的 Agent 共享讀取怎麼用、維護、貢獻 → `docs/<語言>/`。

## 語言政策（按受眾）

- **Agent 面向的檔案一律單語** —— `SKILL.md`、`AGENTS.md`、`references/**` 以及生成產物的正文（AGENTS.md、rules、子技能）絕不攜帶第二語言段落。慣例：本 skill 自身的執行文件（`SKILL.md`、`references/policies`、`references/workflows`）用中文；自動載入的 Agent 指引（`AGENTS.md`、範本文本）用英文。
- **開發者面向的檔案三語且拆分** -- 根目錄只保留英文首頁（`README.md`、`CONTRIBUTING.md`）；簡體/繁體翻譯下沉到各自語言樹（`docs/zh-CN/README.md`、`docs/zh-TW/README.md`…）。**簡體中文（zh-CN）是源語言** -- 修改從簡體發起，再同步到英文與繁體中文（臺灣用語）。改一種語言必須**在同一次改動裡同步另兩種**（穩定文件）；活躍草稿可延遲翻譯至內容穩定，但 push/release 前必須補齊（parity 閘門兜底）。一致性映射：英文入口檔案即根目錄 `README.md`/`CONTRIBUTING.md`（不在 `docs/en/` 下重複）。結構一致性由 `scripts/check-doc-parity.js` 強制（CI + 發佈前置 `docs.parity_passed`）。
- **術語** —— 引入新術語前先查 `docs/glossary.md`，缺漏則補三語條目；所有檔案保持同一譯法。

## 修改治理工件

`SKILL.md`、`references/`、`scripts/` 定義治理框架本身。改動遵循發佈策略（見 `references/workflows/release.md`）：

1. 更新 `CHANGELOG.md`（分類：純文件 → 不記；修復 → Fixed；新能力 → Added；破壞性 → Changed）
2. 升 `package.json` 版本（SemVer：破壞性 → MAJOR，新能力 → MINOR，修復 → PATCH）
3. 保持版本一致：package.json · CHANGELOG · tag
4. push 前必須 `npm test`
5. 僅透過 `release-manager` 流程發佈（前置檢查 → 版本同步 → 校驗 → tag → push → GitHub Release）

## 提交約定

英文 Conventional Commits：`feat(scope): subject` / `fix(scope): subject`。絕不提交生成的執行時輸出（`.governance/validation.json`、`.governance/drift-report.json`、`.governance/release-proposal.json` 已被 git 忽略）。
