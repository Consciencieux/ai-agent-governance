# Commands

[English](../en/commands.md) · [简体中文](../zh-CN/commands.md) · [繁體中文](commands.md)

以下全部是**給 AI 編碼 Agent 的聊天提示語——不是 shell 命令**。它們遵循治理生命週期：**初始化 → 開發 → 持續維護 → 發佈**。

### 可用提示詞

| 使用場景 | 提示詞 | 別名 |
| --- | --- | --- |
| 新倉庫 / 首次接入 | `initialize project governance` | `initialize governance` · `setup project for AI agents` · `create AGENTS.md framework` |
| 開發任務寫計劃 | `plan this task` | `create task plan` · `update development plan` · `check off milestone` · `mark task completed` |
| 已有治理倉庫的持續維護 | `audit governance` | `governance health check` · `fix governance drift` |
| 治理漂移報告 | `check governance drift` | `governance health report` · `is governance intact` |
| 倉庫偵測 | `inspect the repo` | `what is the stack` · `check environment` |
| CI 搭建 | `setup CI` | `add CI` · `create workflow` |
| 治理校驗 | `governance check` | `verify governance` · `validate AGENTS` |
| 狀態記錄 | `update state` | `record progress` |
| 審查變動或專案 | `review this` | `review the changes` · `audit recent changes` · `review my changes` · `审核一下` · `review the whole project` · `deep review` |
| 準備發佈版本 | `release` | `publish version` · `create release` · `/release vX.Y.Z` |

Git 工作流程治理沒有獨立提示詞——它作為執行期規則自動生效：任務開始前自動執行 `scripts/check-git-policy.js`，在 `.governance/git-policy.json` 設定 `directPush: false` 時閘控受保護分支的直接推送。Git 寫入操作（`commit` / `push` / `tag`）需使用者明確授權——寫入指令或 IDE 的暫存-提交-推送確認即為同意；Agent 執行後回報（見 `docs/rules/git-policy.md`）。

### 關鍵提示詞

#### initialize project governance

為倉庫引導治理地基：AGENTS.md、規則、Feature 登記、治理狀態、校驗系統、CI。

```
倉庫偵測 → 生成地基 → 建立狀態 → 設定規則 → 設定校驗 → 設定 CI → 報告
```

詳細輸出：[bootstrap-output.md](bootstrap-output.md)。

#### audit governance

對已治理專案做健康檢查：偵測漂移、校驗工件、應用最小補丁。

#### release

人在環版本發佈。Proposal 含風險分級（低 / 中 / 高）。

```
分析變更 → SemVer Proposal + 風險分級 → 批准 → tag → 推送已批准分支與 tag（GitHub Release 按專案約定）
```

#### review this

深度 × 範圍二維審查：輕量（`review this`）或全量（`deep review`）；預設本次變更集，加路徑或 `review the whole project` 改變範圍。

### 生成的 Skills

INIT 在 `.governance/generated/skills/<name>/SKILL.md` 下生成子技能；專案的 `AGENTS.md` 包含執行時索引。使用者透過上面的提示詞互動。

| 元件 | 觸發詞 | 職責 |
| --- | --- | --- |
| drift-check | `check governance drift` · `governance health report` · `is governance intact` | 將 manifest 與現實比對；模式：activity-report、freshness、consistency |
| governance-validator | `governance check` · `verify governance` · `validate AGENTS` | 執行校驗器，記錄 `validation.json` |
| ci-generator | `setup CI` · `add CI` · `create workflow` | 為偵測到的技術棧生成 CI 管線 |
| repository-inspection | `inspect the repo` · `what is the stack` · `check environment` | 偵測環境，返回技術棧報告 |
| state-manager | `update state` · `record progress` | 把進度持久化到 `.governance/state.json` |
| plan-manager | `plan this task` · `create task plan` · `update development plan` · `check off milestone` · `mark task completed` · `archive completed plan` | 建立 TASK 計劃、勾選里程碑、發佈時歸檔 |
| review-manager | `review this` · `review the changes` · `audit recent changes` · `review my changes` · `审核一下` · `deep review` · `full review` · `全面审查` · `彻底审查` · `逐行审查` · `review the whole project` · `全项目审核` · `audit everything` · `全项目彻查` | 深度 × 範圍審查（輕量/全量 × 變更集/指定路徑/全專案） |
| release-manager | `release` · `publish version` · `create release` · `/release vX.Y.Z` | 執行帶審批閘門的發佈流程 |

### 執行規則

任何結果不確定的提示詞都會暫停並請求釐清——絕不靜默猜測。

---
