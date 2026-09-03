# 確認憑證與變更衛生自動化（TASK 計劃）

[English](../../en/plans/consent-and-change-hygiene.md) · [简体中文](../../zh-CN/plans/consent-and-change-hygiene.md) · [繁體中文](consent-and-change-hygiene.md)

> **狀態：設計計劃，未實作。** 本計劃定義使用者確認、刪除、重新命名與遷移的可驗證證據，不推斷人的真實意圖。

**Target：both** —— `payload` 增加執行時驗證與受治理專案生成契約；`repo-infra` 增加測試、文件和發佈接線。兩個域分別列在「受影響檔案」中。

### 計劃目的

讓高影響 Git 操作以及刪除/重新命名變更具備機器可審計證據，同時保留那些無法從儲存庫狀態判斷的決策之人工確認。

### 當前問題

- 現行規則要求提交前回顯，但系統無法證明確認涵蓋精確的暫存變更集與命令範圍。
- 刪除、重新命名、遷移、API 和生成物衛生主要依賴文件，沒有與實際 diff 自動對帳。
- 現有密鑰、Git 策略、同步組和治理檢查沒有形成持久且綁定變更集的證據記錄。
- 腳本可以驗證證據和一致性，但不能證明人理解後果，也不能證明遷移在語義上足夠。

### 提議方案

#### 1. 綁定變更集的確認憑證

擴展 `.governance/consent.json`，包含 `changeSet`、`scope`、`commandDigest`、`approvedAt` 和 `approvedBy`。提交鈎子與發佈執行器拒絕缺失、格式錯誤、過期或不匹配的憑證。憑證綁定暫存 diff 或 Release Proposal 的 HEAD；之後任何變更都會使憑證失效。

確認範圍區分 `add`、`commit`、`tag`、`push` 和 `release`。使用者說「push」可以觸發確認提示，但本身不是批准憑證。

#### 2. 結構化變更衛生聲明

在 TASK 計劃或 `.governance/change-hygiene.json` 中增加機器可讀記錄。每項刪除或重新命名聲明操作、原因、受影響符號/路徑、引用搜尋詞、相容性決定、遷移或回滾證據以及允許的歷史命中。

檢查器把聲明與 `git diff --name-status --find-renames` 對照，執行聲明的搜尋，驗證遷移/ADR/CHANGELOG 文件真實存在，並報告未說明的刪除、重新命名、目前層殘留引用和缺失遷移證據。

#### 3. 按風險分級執行

- `advisory`：沒有公開 API/設定/資料格式信號的內部變更。
- `gate`：公開 API/設定/資料格式、安全、權限或破壞性變更。
- `human-required`：遷移是否語義充分、不可逆資料變更和模糊的相容性決定。

檢查器不能把文件存在當成內容充分的證明，只報告證據狀態，最終語義決定仍由開發者作出。

#### 4. 接線

在提交、tag、發佈寫操作前立即驗證確認憑證；在 Phase 4 和發佈歸檔/tag 前執行變更衛生驗證。只有完成獨立執行和受治理專案兜底測試後，才把腳本加入 INIT 載荷。

### 受影響檔案

#### Payload

- `scripts/check-consent.js` —— 驗證綁定變更集的確認憑證
- `scripts/check-coding-hygiene.js` —— 將刪除/重新命名/遷移聲明與 Git 狀態對帳
- `references/init-spec.json` —— 複製並聲明新的獨立腳本與確認憑證格式
- `references/templates/githooks-template.md` —— 寫操作前強制確認驗證
- `references/templates/agents-md.template.md` —— 記錄證據與風險分級
- `references/policies/git.policy.md` —— 定義確認憑證範圍
- `references/policies/coding.policy.md` —— 定義結構化刪除/重新命名衛生
- `references/policies/governance-files.policy.md` —— 保護新增門禁腳本
- `references/workflows/release.md` —— 接入 Phase 4 與發佈門禁
- `SKILL.md` —— 更新載荷契約與驗證順序

#### 儲存庫基礎設施

- `tests/run-tests.js` —— 覆蓋摘要綁定、範圍不匹配、刪除、重新命名、遷移與兜底
- `scripts/check-doc-consistency.js` —— 驗證同步文件標記
- `docs/{en,zh-CN,zh-TW}/commands.md` —— 記錄使用者觸發詞
- `CHANGELOG.md` —— 在發佈邊界記錄行為變化

### 風險與決定

- 雜湊只能證明身份，不能證明理解；確認仍保持人在迴路中。
- 每次內部重新命名都強制遷移文件會造成誤報，執行強度必須按風險分類。
- 匯出副本可能沒有 Git 歷史；歷史不可用時降低保證度並明確報告，不能偽造證據。
- CHANGELOG、ADR、歸檔、相容別名和測試中的歷史引用需要顯式白名單，不能採用全域零命中規則。
- 不啟用自動 tag/push/release；本計劃只加強寫操作前驗證。

### 驗證方法

- 針對一次暫存 diff 的確認憑證，在暫存行發生任何變化後失敗。
- 確認範圍不完整時，在對應寫操作前失敗。
- 未聲明的高風險刪除和重新命名使門禁失敗，並指出缺失聲明。
- 聲明的遷移路徑不存在時失敗；路徑存在只算證據，不算語義批准。
- 只有顯式聲明後才允許歷史層命中。
- 無 Git 和受治理專案的兜底行為穩定且報告清晰。
- 更新三語樹和 payload 複製不變量後，`npm test`、`npm run check`、`npm run check:all` 通過。

---
