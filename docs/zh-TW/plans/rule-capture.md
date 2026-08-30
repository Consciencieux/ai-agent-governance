# Rule Capture（TASK 計劃）

[English](../../en/plans/rule-capture.md) · [简体中文](../../zh-CN/plans/rule-capture.md) · [繁體中文](rule-capture.md)

> **狀態：已實作（2026-08-30，待 Release 歸檔）。** 本計劃已在目前工作樹交付；發佈時按倉庫規則歸檔。
>
> **Target: both** —— `payload` 交付給受治理專案（`references/`、`scripts/`）；`repo-infra` 維護本倉庫的 `AGENTS.md`、測試和開發者文件。兩類交付點分列在「受影響檔案」中。
>
> **目標版本：v0.11.0（暫定）**。若實作範圍縮減為內部機制修補，發佈時由 Release Proposal 按 SemVer 重新判定；實作階段不直接改版本或建立發佈。

### 任務目的

讓**經開發者確認的長期要求**成為受治理專案的持久執行期契約，而不是只存在於一次對話中。確認後的規則必須進入目標專案的 `AGENTS.md` 或 `docs/rules/**`，讓新的 Agent 在更換開發者、電腦或會話後仍可讀取。

本計劃不把未確認候選偽裝成持久規則：`activity.jsonl` 只是稽核軌跡，當前未決候選由 `state.json` 保存以便同一任務恢復；只有已確認並寫入規則檔案的內容才是正式治理契約。未提交的本機狀態不承諾跨電腦保留。

### 當前問題

- Agent 會在當前會話遵守開發者提出的要求，但現有生命週期沒有規定如何把「開發者要求」分類、確認並寫入規則檔案。
- 現有活動稽核只記錄 Agent 的動作；它沒有規則候選、裁定結果或未決候選的結構化欄位。
- `activity.jsonl` 是被忽略的執行期輸出，不能單獨承擔跨機器的持久化職責；當前狀態應由受追蹤的 `state.json` 承擔。
- 原稿提到「本次會話的 5 條要求」和「漏掉的兩條規則」，但沒有給出原文、來源和適用範圍。它們**不作為本計劃的隱式回填交付**；若要回填，必須在實作前逐條列出候選 ID、原文/可稽核摘要、作用域、目標章節，並取得開發者明確確認。

### 交付邊界與非目標

**適用範圍：** 受治理專案中由生成的 `AGENTS.md`、`docs/rules/**` 和 `.governance/generated/skills/` 執行的開發任務；本倉庫自身只增加同等的開發者操作說明，不會把某個受治理專案的規則自動寫入本倉庫。

**只收集開發者的持久性行為要求：**

- 收集明確的通用約束、對 Agent 行為的修正，以及「以後/始終/不要再」等持久化訊號。
- 不收集系統/平台指令、問題和建議、僅用於本任務的驗收標準、綁定具體檔案或本次提交的指令、臨時 workaround、秘密或憑據。
- 「重複出現」只能提高候選優先級，不能單獨把一次性要求升級為持久規則。

**非目標：** 不自動把候選寫入規則檔案；不自動把既有專案升級到新範本；不修改既有規則的語義來「合併相似項」；不把規則裁定確認當作 Git 提交/推送授權。

### 提議方案

#### 1. 在任務中收集候選

從任務開始到 Phase 3，Agent 對符合邊界的開發者要求建立候選。每個候選必須有唯一 ID（建議 `rc-<task_id>-<序號>`），並在寫入前搜尋現有 `AGENTS.md` 和 `docs/rules/**`，優先更新既有單一事實來源，不得重複建立同義規則。

候選的最小結構如下；`text` 使用可稽核的規範化表述，不複製秘密或無關的整段對話：

```json
{
  "id": "rc-t-123-01",
  "text": "所有治理檔案變更都必須先說明原因並執行驗證",
  "scope": "governed-project",
  "classification": "persistent|one-off|unclear",
  "reason": "通用行為約束；適用於後續任務",
  "target": "docs/rules/lifecycle.md#governance-file-changes",
  "status": "proposed|confirmed|reclassified|discarded|pending"
}
```

分類規則：

| 訊號 | 初始分類 | Agent 行為 |
| --- | --- | --- |
| 通用祈使句（「以後都」「任何時候」「不要再」）；約束行為模式；明確要求作為專案規則 | `persistent` | 放入待裁定清單；不得先寫入 |
| 綁定具體物件或本次任務；含「先」「暫時」「就這一次」；完成後失效 | `one-off` | 報告分類和理由；不寫入、不計入待決候選 |
| 證據不足或訊號衝突 | `unclear` | 放入待裁定清單；預設不寫入 |

涉及權限、安全、刪除保護、校驗閘門或 Git 策略的候選，始終按高風險治理變更處理；即使分類為 `persistent`，也必須經過開發者對具體條目的明確確認。

#### 2. 將規則捕獲放在 Phase 5 的同步子流程

不能在最終報告發出後才寫入規則，否則寫入後沒有驗證閉環。執行順序改為：

1. **Phase 4 完成後**，Agent 產生規則沉澱清單；清單同時列出 `persistent`、`one-off` 和 `unclear`，對前兩類給出結論和理由，不把分類本身寫成開放式問題。
2. **Phase 5a 裁定閘門**，開發者在一則回覆中按候選 ID 裁定。例如：`確認 rc-t-123-01；rc-t-123-02 改為 one-off；rc-t-123-03 暫緩`。省略的候選視為未裁定，不得預設同意；明確「確認全部持久項」可以作為批次回覆。
3. **Phase 5b 寫入與同步**：只有明確確認的候選可以寫入目標規則檔案。Agent 按規則檔案保護流程處理，必要時更新 CHANGELOG，並完成 AGENTS 摘要/`@` 引用、規則檔案和同步組的聯動。
4. **Phase 5c 重新驗證**：只要寫入受保護檔案，就必須重新執行受影響的治理校驗、密鑰掃描和同步組檢查；受治理專案執行其 `verify-governance.js`，本倉庫執行 `npm run check`，不得用本倉庫的預設 validator 冒充受治理專案驗證。
5. **Phase 6 最終報告**：只報告最終狀態、已捕獲規則、一次性要求、未決候選和驗證證據。Phase 6 不再觸發新的規則寫入。

若開發者沒有完成裁定，Agent 將 `state.json` 的任務狀態標為 `blocked`，保留候選並在報告中明確阻塞原因；下一次執行先讀取候選，得到裁定後從 Phase 5b 繼續。規則裁定確認只是內容授權，仍不覆蓋倉庫現有的提交前 Git 命令回顯和提交確認。

#### 3. 當前狀態與稽核軌跡

`state.json` 增加可選的 `rule_capture` 物件，用於中斷恢復和當前未決狀態；缺少該欄位的舊專案按 `status: none` 相容：

```json
{
  "rule_capture": {
    "status": "none|collecting|awaiting_adjudication|resolved",
    "task_id": "t-123",
    "candidates": []
  }
}
```

`activity.jsonl` 繼續是追加式、被忽略的稽核日誌。每個任務執行結束點追加一行；同一 `task_id` 的恢復執行可以追加新行，但絕不改寫舊行，候選 ID 負責關聯這些記錄。每條任務執行記錄可增加以下可選欄位，舊記錄沒有這些欄位時按空陣列處理：

```json
{
  "rules_captured": ["rc-t-123-01"],
  "rules_pending": ["rc-t-123-03"],
  "rules_resolved": [
    {"id": "rc-t-123-02", "decision": "one-off"}
  ]
}
```

`rules_pending` 只包含未裁定的 `persistent`/`unclear` 候選，不包含明確的一次性要求。候選 ID 是跨恢復記錄的關聯鍵；drift-check 以當前 `state.json` 的未決候選為準，並用活動記錄展示歷史和最終裁定，不把歷史上已解決的候選重複計數。所有新增欄位都必須遵守現有日誌脫敏規則，必要時只記錄類別和摘要。

#### 4. 規則落點

- 通用、短小、需要每次會話立即看到的入口規則：寫入 `AGENTS.md`，詳細內容放在對應規則檔案並用 `@` 引用。
- 生命週期、Git、安全、測試等既有主題：更新對應的 `docs/rules/<topic>.md` 單一事實來源。
- 新主題：先搜尋是否已有規則；確實沒有時才建立 `docs/rules/<topic>.md`，並在 `AGENTS.md` 添加指標，而不是複製正文。
- 作用域為本倉庫的貢獻者規則只寫本倉庫 `AGENTS.md`；作用域為受治理專案的規則不能反向寫入本倉庫。

#### 5. 既有專案的遷移

新專案由產生器得到新的狀態欄位和子技能內容。既有專案不會因源範本變化而自動更新，因為產生器對既有檔案採用跳過策略；開發者明確要求升級時，按 MIGRATE 流程：

- 更新目標專案的 `docs/rules/lifecycle.md`、`AGENTS.md` 摘要、`state-manager` 和 `drift-check` 子技能；保留既有規則內容並合併，不覆蓋。
- `state.json` 缺少 `rule_capture` 時惰性初始化，不要求一次性重寫所有舊狀態。
- 校驗 `activity.jsonl` 的舊記錄相容性、候選欄位脫敏和治理版本；更新 manifest 的 `governance_version` 並執行目標專案 validator。
- 不自動遷移或自動裁定既有對話內容。

### 受影響檔案

#### Payload（交付給受治理專案）

- `references/policies/lifecycle.policy.md` —— 增加 Phase 5a/5b/5c 的規則捕獲子流程、阻塞/恢復條件、Phase 6 最終報告欄位和確認邊界
- `references/templates/agents-md.template.md` —— 增加規則捕獲摘要、規則落點和「裁定確認不等於 Git 授權」的指標
- `references/templates/sub-skills.md` —— state-manager 管理 `state.json.rule_capture` 與活動欄位；drift-check 按候選 ID 彙總當前未決項
- `scripts/generate-governance.js` —— 新專案產生 `rule_capture` 的相容初始狀態；保持既有專案「存在即跳過」行為
- `references/init-spec.json` —— 更新 `state.json` 工件描述/契約

#### Repo-infra（本倉庫維護）

- `AGENTS.md` —— 增加本倉庫自身的規則捕獲操作指標；未給出原文和範圍前不回填所謂「兩條遺漏規則」
- `tests/run-tests.js` —— 狀態欄位、活動欄位、脫敏、舊記錄相容性、候選解決/計數、產生輸出和中斷恢復測試
- `docs/en/commands.md`、`docs/zh-CN/commands.md`、`docs/zh-TW/commands.md` —— 同步 state-manager/drift-check 的使用者可見職責說明
- `CHANGELOG.md` —— 在 `[Unreleased]` 記錄 Added；不把每一次業務任務的規則寫入都變成獨立版本條目
- `docs/en/roadmap.md`、`docs/zh-CN/roadmap.md`、`docs/zh-TW/roadmap.md` —— 發佈歸檔時將 Near-term 項目移至 Done 並按倉庫維護規則重排；實作提交階段只在內容需要時更新

發佈邊界另按 Release 流程同步 `package.json`、`SKILL.md` frontmatter、CHANGELOG 和 tag；這不是本計劃授權的自動版本操作。完成後按規則將本計劃歸檔到 `docs/archive/rule-capture.md`，不刪除三語設計副本，且先通過計劃交付閘門。

### 風險與緩解

- **生命週期阻塞**：沒有裁定不能宣稱完成；用 `state.json.rule_capture` 保存斷點，下一次從 Phase 5b 恢復。
- **誤分類/誤寫入**：明確 ID、未裁定預設不寫、模糊偏向 `unclear`，且先搜尋既有規則。
- **確認混淆**：規則內容裁定、治理檔案保護確認和 Git 提交確認分別標示，不能用一句普通「完成」互相替代。
- **日誌洩露**：不記錄原始整段對話；候選文字和新增欄位沿用脫敏規則，秘密/憑據只記錄類別，不記錄值。
- **待決項堆積**：只統計當前 `state.json` 中的未決候選；drift-check 報告數量和候選 ID，但不把報告本身變成新的硬閘門。
- **範本版本漂移**：既有專案只透過明確的 MIGRATE 更新；遷移前後都驗證舊狀態和舊活動記錄。
- **多 Agent 競爭**：遵循既有 lock 檢查；候選 ID 必須包含 `task_id`，同一檔案的規則寫入不得並行。

### 驗收與驗證方法

#### 自動測試/契約測試

- 新產生專案的 `state.json` 含可選 `rule_capture` 初始結構；舊 `state.json` 和沒有新增欄位的舊活動記錄仍能讀取。
- 活動記錄的新增欄位接受合法陣列/物件，保持 JSONL 追加式；候選 ID 可關聯 `pending → resolved/captured`，已解決項不會被重複計數。
- 含秘密樣式文字的候選不會把秘密寫入 `state.json` 或 `activity.jsonl`；一次性候選不會進入 `rules_pending`。
- 產生的 state-manager/drift-check 子技能包含上述狀態、確認、恢復和報告契約；`activity-report` 能區分當前未決項與歷史已解決項。
- 中斷恢復 fixture：裁定前任務為 `blocked`，下一次執行讀取候選並在裁定後完成寫入、重新驗證和最終報告。

#### Agent 行為驗收（狗糧場景）

構造一項明確持久要求、一項明確一次性要求和一項模糊要求，檢查：

1. Phase 5a 清單有三項、每項有 ID、分類、理由和目標章節；一次性項不進入待決計數。
2. 開發者確認前，`AGENTS.md`/`docs/rules/**` 不發生規則寫入。
3. 開發者按 ID 確認/改判後，只寫入確認的持久項；模糊項若暫緩則任務為 `blocked`，若改判為一次性則不寫入。
4. 規則寫入後重新執行目標專案 validator、`check-secrets`、`check-sync`；最終 Phase 6 報告列出真實命令和結果。
5. 重複執行不會建立重複規則；drift-check 報告當前未決數量而不是歷史累計數量。

#### 本倉庫閘門與遷移驗收

- 本倉庫執行 `npm test`、`npm run check`；不執行或偽造本倉庫預設 `scripts/verify_governance.js` 的通過結果。
- 修改 `references/`、腳本或三語 docs 後執行對應的 `docs:parity`、`docs:layout` 和一致性閘門；真實輸出寫入任務報告。
- 通過一次目標專案 MIGRATE fixture：既有檔案不被覆蓋，明確升級後新增行為可用，舊狀態/活動記錄仍可讀取。
- 本次會話提到但未提供原文的「兩條規則」不作為自動驗收項；只有在實作前補齊候選記錄並獲明確確認後，才加入相應文件斷言。

---
