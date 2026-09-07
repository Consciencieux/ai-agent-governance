# 載荷治理教訓遷移：宣告-機制差距與驗證回饋閉環（TASK 計畫）

> **Status: Active.**（進行中，建立時的初始狀態。）

**Target：payload** —— 僅修改 `references/` 下的規則/範本正文，讓被治理專案獲得與本倉庫已證實的防線同類的教訓；不新增閘門腳本、不修改測試架構（`repo-infra` 部分零改動）。若實現中出現新的可判定規則且需要機械執行（需新增腳本/測試），將拆分為 `both` 並重新對本計畫修訂。

### 任務目的

把 0.13.0 之後本倉庫反覆踩出的教訓——特別是「宣告一套、機制覆蓋另一套」這一缺陷類——寫成被治理專案可直接遵守的規則正文，而不是留為倉庫內部記憶。目標：被治理專案的 Agent 在寫規則/測試/CI 時，能讀到「機械覆蓋必須與宣告一致」的判斷標準，並把「空洞測試」「列舉只斷言子集」識別為缺陷。

### 當前問題

- 本倉庫在 v0.13.1/v0.13.2/0.14.0 三次踩中同一類缺陷：規則宣告了集合，機制靜默只覆蓋子集（5 個同步點驗 2 個、hygiene 掃描漏 6 個閘門、plan-delivery 漏 2 棵樹、CI 只跑 2/6 閘門、shape guard 關閉真實保護）。每次都在 AGENTS.md 記錄教訓，但 **AGENTS.md 是本倉庫檔案，不隨載荷分發**——被治理專案完全讀不到。
- 類似的「空洞測試」（斷言子集而非完整集合、移除被測功能測試仍綠）在 v0.13.2/0.12.0 各出現過，也未落進載荷的 `testing.policy.md`。
- 載荷 `lifecycle.policy.md` Phase 4 已有「證據要求：裸命令+真實輸出摘錄」，但比本倉庫 AGENTS.md 的證據等級表（機械 / 人工背書 / 未驗證）**少三級區分**——被治理專案裡「✓ 通過」無法區分「機械條件滿足」與「語意正確」。
- 載荷 `release.md` 已寫明被治理專案的四處版本同步點，但「同步點清單必須與機械驗證一致」這條**判斷標準本身**沒有作為規則出現。

> **範圍外/已完成聲明**：CHANGELOG 內容邊界（記錄變更/影響/遷移，不記錄驗證過程）與 CHANGELOG 結構契約（分類標題規範、重複標題阻斷、已發布節不可追加、`[Unreleased]` 重建）**已隨上一輪工作寫入載荷並驗證落地**（`lifecycle.policy.md` §CHANGELOG 內容邊界 + §CHANGELOG 結構契約；`agents-md.template.md` Content boundary；被治理專案端到端：重複分類頭 `--gate` exit 1，10/10 落地，CHANGELOG [Unreleased] 已記錄）。**它們不屬於本計畫的待辦**——本計畫只覆蓋下列未落地教訓：D1 宣告集合≠機制覆蓋、D2 移動後複查列舉、D3 形態守衛關閉保護、D4 空洞測試、D5 斷言完整集合、D6 證據等級、D7 CI 閘門完整性。

### 提議方案

被治理專案已具備對應基礎設施（`lifecycle.policy.md` 的 Phase 4、`testing.policy.md` 的測試保護、`coding.policy.md` 的變更歸位、分發到專案 CI 的 `ci.md`）。方案是把下面四項教訓**寫入現有章節**，不新增章節標題、不新增腳本、不新增閘門；每條以「判斷標準」形式表述，而不是複述本倉庫的事故。

#### 1. 宣告-機制一致性（D1 + D2 + D3 合併為一節）

寫入 `references/lifecycle.policy.md` Phase 4（驗證序列）之後，作為一節「宣告與機制的差距」；同時在 `references/coding.policy.md` 的「變更歸位與殘留清理」加入一條。

要點：
- 規則宣告的是集合（同步點、掃描目錄、CI 閘門、檢查清單），機制必須覆蓋同等範圍；「宣告了 5 處、機制驗 2 處」與「宣告覆蓋所有原始碼樹但列舉漏了 1 棵」屬於同一缺陷類，修復時必須補齊宣告或縮小機制，不能只改文件。
- 檔案移動/重命名/目錄拆分後，必須複查所有硬編碼目錄列舉與守衛：`SCAN_DIRS`、`SEARCH_ROOTS`、角色清單、掃描集合、路徑常數。裁判標準：機械證明「宣告集合 = 恢復最終覆蓋集合」，不能憑印象。
- 形態守衛（「本專案不含 X 佈局 → not applicable → exit 0」）不得順帶關閉真實保護：守衛的成立條件必須是宣告的、窄的（例如「缺 `references/init-spec.json`」），而不是樹級寬條件（例如「缺 `references/`」）。

#### 2. 測試活性（D4 + D5 合併為一條）

寫入 `references/testing.policy.md` 的「測試保護」之後。
- 空洞測試：移除被測功能後測試仍綠 = 測試未覆蓋功能；斷言必須針對**完整**目標集合，而不是子集（列舉斷言、子集斷言都是空洞）。
- 變更涉及閘門/守衛/清單列舉時，測試必須證明條件非空洞（例如注入一個真實 marker/識別碼，證明檢查真的在跑），不能只斷言退出碼或空輸出。

#### 3. 證據等級（D6）

寫入 `references/lifecycle.policy.md` Phase 4 的「證據要求」段。
- 區分三級：機械（marker/結構/路徑/正則/檔案存在 → 「機械條件滿足」，非「行為正確」）；人工背書（需要使用者參與，如發布批准、翻譯審查）；未驗證宣告（僅自述，無獨立驗證）。「✓ 通過」必須掛這三級之一，否則不能聲稱驗證完成。

#### 4. CI 閘門完整性（D7）

寫入 `references/workflows/ci.md`（分發到被治理專案的 CI 範本檔案）。
- 若專案維護 CI，CI 必須運行與 AGENTS.md 宣告的閘門集合等價的命令，不能只運行子集（例如只 `npm test` 但聲稱「fails CI」）。

### Affected Files

- `references/policies/lifecycle.policy.md` —— 新增「宣告與機制的差距」節（Phase 4 後）+ Phase 4 證據等級三級區分
- `references/policies/testing.policy.md` —— 測試保護節新增空洞測試/斷言完整集合
- `references/policies/coding.policy.md` —— 變更歸位新增列舉複查條目
- `references/workflows/ci.md` —— CI 閘門完整性說明
- `references/templates/agents-md.template.md` —— 若上述規則在 AGENTS.md 範本有對應歸納（變更歸類/測試保護指標）則同步；無則跳過
- `docs/{en,zh-CN,zh-TW}/plans/` —— 本計畫的三語存在（實現後歸檔為單語）
- `docs/en/architecture.md`、`docs/zh-CN/architecture.md`、`docs/zh-TW/architecture.md` —— 佈局樹若新增檔案（預計無）

> 註：載荷變更必須附帶 `CHANGELOG.md` [Unreleased] 條目（治理/機制變更 → `Changed`）。

### 風險

- **範圍過大**：4 處編輯可能相互糾纏。對策：每處獨立提交前綴（`docs(rules)`、`docs(ci)`），單個 TASK 完成。
- **重複本倉庫事故細節反而形成「複述」**，違背「規則不複述」原則。對策：全部以判斷標準表述，不寫「0.13.2 發生了什麼」。
- **空泛無判據**：如果寫的規則變成「要做對」這種口號，等於沒寫。對策：每條帶可執行判據（如「宣告集合 = 恢復最終覆蓋集合」）。
- **未驗證被治理專案是否受益**：被治理專案可能沒有 `testing.policy.md`（取決於 INIT 佈局）。對策：核對 `init-spec.json` 是否安裝 `testing.policy.md`；未安裝的專案跳過。
- **跟 AGENTS.md 的「單語規則」衝突**：`references/` 是單語（簡體中文為準），本次所有寫入均用簡體。en/zh-TW 只同步 commands.md 觸發詞——而本計畫不涉及觸發詞，故三語同步只需保持 parity 不破壞即可。

### 驗證方法

1. `npm test`（全套回歸）
2. `npm run check`（parity/佈局/一致性/衛生/角色閘門）
3. `npm run check:payload`（載荷範圍）
4. 乾淨目標 INIT 一個 throwaway 專案（`--phase C`），核對：
   - 生成的 `docs/rules/lifecycle.md` 含「宣告與機制的差距」「證據等級」；
   - 生成的 `docs/rules/testing.policy.md` 含「空洞測試」；
   - 生成的 `docs/rules/coding.policy.md` 含「列舉複查」；
   - 生成的 `.github/workflows/` 或 `ci` 範本含「閘門完整性」；
   - 生成的 `AGENTS.md`（若範本有對應歸納）含對應指標。
5. 邊界體檢：`references/` 無 `repo-tools/`、`repo-workflows/`、`npm run` 等本倉庫特有路徑；`check-role-completeness --gate` 綠。