# Commands

[English](../en/commands.md) · [简体中文](../zh-CN/commands.md) · [繁體中文](commands.md)

以下全部是**給 AI 編碼 Agent 的聊天提示語 —— 不是 shell 命令**。它們遵循治理生命週期：**初始化 → 開發 → 持續維護 → 發佈**。

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
| 審查變動或專案 | `review this` | `review the changes` · `audit recent changes` · `review my changes` · `審核一下` · `review the whole project` · `deep review` |
| 準備發佈版本 | `release` | `publish version` · `create release` · `/release vX.Y.Z` |

Git 工作流程治理沒有獨立提示詞 —— 它作為執行期規則自動生效：任務開始前自動執行 `scripts/check-git-policy.js`，在受保護分支上阻止直接提交/推送（見 `.governance/git-policy.json`）。同理 `push` / `merge` 也不是提示詞 —— 它們是需確認的寫入操作：Agent 會說明意圖並等待你的明確批准（見 `docs/rules/git-policy.md`）。

### 提示詞詳情

#### initialize project governance

為倉庫引導（bootstrap）初始 AI Agent 治理地基（AGENTS.md、規則、Feature 登記、治理狀態、校驗系統、CI）。

執行流程：

```
倉庫偵測
→ 生成治理地基
→ 建立治理狀態
→ 設定 Agent 規則
→ 建立校驗系統
→ 設定 CI
→ 報告
```

詳細輸出（完整帶註解目錄樹）：[bootstrap-output.md](bootstrap-output.md)

#### plan this task

在中大型修改前建立開發計劃（TASK 文件：Status、目的、問題、方案、受影響檔案、風險、驗證）。

執行流程：

```
建立 docs/plans/TASK_<name>.md
→ 与開發者确认
→ 開始實作
```

完成後同一計劃器會勾選里程碑並把任務標記為 Completed。

#### audit governance

持續維護治理健康：偵測漂移並保持專案知識同步。

執行流程：

```
读取当前狀態
→ 偵測漂移
→ 校驗工件
→ 应用最小补丁
```

#### release

透過人工批准建立版本發佈。Proposal 含風險分級（低 = 僅輕量級閘門；中 = 批准時建議深度審查；高 = 必須 review-manager 或逐項確認）。

執行流程：

```
分析变更
→ SemVer Proposal + 風險分級
→ 批准
→ tag
→ GitHub Release
```

#### check governance drift

偵測治理漂移：將 manifest 與現實比對，外加三種建議性模式（結果寫入 `.governance/drift-report.json`）：

```
讀 manifest
→ 跑校驗器
→ 偵測漂移
→ 建議模式：activity-report · freshness · consistency
```

單獨指定模式：`run the drift activity report` · `check doc freshness` · `check doc consistency`

#### inspect the repo

任務開始前偵測環境——專案類型、語言、套件管理員、建置工具、測試框架、linter、git 狀態、CI、既有 AI 指南檔案，回傳技術棧報告。INIT 開始時也會自動執行。

#### setup CI

為偵測到的技術棧生成 CI 管線（能力偵測式：format/lint/typecheck/test/build，腳本缺失時優雅降級）。

#### governance check

執行 `scripts/verify-governance.js` 並把結果記錄到 `.governance/validation.json`。閘門：宣稱任務完成前、以及 RELEASE 前校驗器必須 exit 0。

#### update state

把進度持久化到 `.governance/state.json`（成熟度、階段、Agent 身分、已完成/阻塞項），讓後續會話正確續跑。每個任務結束自動執行。


### 執行期元件

這些元件由生命週期提示詞自動觸發，使用者通常只需要使用上面的生命週期提示詞。

| 元件 | 提示詞 | 職責 |
| --- | --- | --- |
| drift-check | `check governance drift` · `governance health report` · `is governance intact` | 將 manifest 與現實比對，報告漂移；`activity-report` 模式聚合稽核軌跡和當前規則捕獲候選，`freshness` 模式標記過時文件，`consistency` 模式標記文件間矛盾 |
| governance-validator | `governance check` · `verify governance` · `validate AGENTS` | 執行校驗器，記錄 `validation.json` |
| ci-generator | `setup CI` · `add CI` · `create workflow` | 為偵測到的技術棧生成 CI 管線 |
| repository-inspection | `inspect the repo` · `what is the stack` · `check environment` | 偵測環境，返回技術棧報告 |
| state-manager | `update state` · `record progress` | 把進度和當前規則捕獲候選持久化到 `.governance/state.json`，並在活動軌跡記錄已捕獲/待決/已解決的候選 ID |
| plan-manager | `plan this task` · `create task plan` · `update development plan` · `check off milestone` · `mark task completed` | 建立 TASK 計劃、勾選里程碑、標記任務完成 |
| review-manager | 深度：`review this` · `review the changes` · `audit recent changes` · `review my changes` · `审核一下`（輕量）— `deep review` · `full review` · `全面审查` · `彻底审查` · `逐行审查`（全量）— 範圍：預設本次變更集，加路徑參數限定範圍，或 `review the whole project` · `全项目审核`（輕量）/ `audit everything` · `全项目彻查`（全量） | 深度 × 範圍二維審核（輕量/全量 × 變更集/指定路徑/全專案） |
| release-manager | `release` · `publish version` · `/release vX.Y.Z` | 執行帶審批閘門的發佈流程 |

### 執行規則

任何結果不確定的提示詞（如發佈時 Breaking Change 判斷不清）都會暫停並請求釐清 —— 絕不靜默猜測。
