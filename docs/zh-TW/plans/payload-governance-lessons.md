# 載荷治理教訓遷移：宣告-機制差距與驗證回饋閉環（TASK 計畫）

> **Status: Active.**（進行中，建立時的初始狀態。）

**Target：both** —— `payload`：`references/policies/*.md`（lifecycle / testing / coding）、`references/workflows/ci.md`、`references/templates/agents-md.template.md`（經裁定—見下）；`repo-infra`：`CHANGELOG.md` [Unreleased] 條目、三語計畫檔案、目標鏈路斷言測試（若新增，見 §驗證方法 第 4 條）。

**agents-md.template.md 裁定：直接修改。** 該範本把 CHANGELOG 內容邊界與結構契約寫入生成專案的 AGENTS.md；與之相鄰的「結論/測試要點」歸納（變更歸類、測試保護指標）同樣應帶上本次的宣告-機制一致性要點，避免生成專案 AGENTS.md 與 docs/rules/*.md 脫節。**不寫「如需要則跳過」。**

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

寫入 `references/policies/lifecycle.policy.md` Phase 4（驗證序列）之後，作為一節「宣告與機制的差距」；同時在 `references/policies/coding.policy.md` 的「變更歸位與殘留清理」加入一條。

要點：
- 規則宣告的是集合（同步點、掃描目錄、CI 閘門、檢查清單），機制必須覆蓋同等範圍；「宣告了 5 處、機制驗 2 處」與「宣告覆蓋所有原始碼樹但列舉漏了 1 棵」屬於同一缺陷類，修復時必須補齊宣告或縮小機制，不能只改文件。
- 檔案移動/重命名/目錄拆分後，必須複查所有硬編碼目錄列舉與守衛：`SCAN_DIRS`、`SEARCH_ROOTS`、角色清單、掃描集合、路徑常數。裁判標準：機械證明「宣告集合 = 恢復最終覆蓋集合」，不能憑印象。
- 形態守衛（「本專案不含 X 佈局 → not applicable → exit 0」）不得順帶關閉真實保護：守衛的成立條件必須是宣告的、窄的（例如「缺 `references/init-spec.json`」），而不是樹級寬條件（例如「缺 `references/`」）。

#### 2. 測試活性（D4 + D5 合併為一條）

寫入 `references/policies/testing.policy.md` 的「測試保護」之後。
- **事實源規定**：「宣告集合」必須有出處，Agent 不得憑感覺判定「這就是完整集合」。宣告集合的候選事實源：`init-spec.json` 的 artifacts 清單、`check-doc-consistency.js` 的簇註冊表、`AGENTS.md` 閘門表、`sub-skills.md` 的子技能清單；機制集合 = 實際掃描目錄 / 實際註冊測試 / 實際 CI job。兩者必須可對照。
- **優先級規定**：對閘門、列舉、註冊表、關鍵路徑測試，必須提供負向 fixture 或 mutation evidence，證明測試確實覆蓋目標；一般業務測試不強制逐個做刪除變異——避免把 mutation testing 變成新的形式主義。
- 空洞測試定義：移除被測功能後測試仍綠 = 測試未覆蓋功能；斷言必須針對完整目標集合，而不是子集（列舉斷言、子集斷言都是空洞）。
- **未機械化聲明**：本計畫新增的是 human-attested / unverified judgement standards，不聲稱它們已獲得 mechanical enforcement——寫入後它們是規則文字，不自動阻止錯誤。

#### 3. 證據等級（D6）

寫入 `references/policies/lifecycle.policy.md` Phase 4 的「證據要求」段。
- 區分三級：機械（marker/結構/路徑/正則/檔案存在 → 「機械條件滿足」，非「行為正確」）；人工背書（需要使用者參與，如發布批准、翻譯審查）；未驗證宣告（僅自述，無獨立驗證）。「✓ 通過」必須掛這三級之一，否則不能聲稱驗證完成。
- **不新增機械閘門**：本次只設立證據等級的文字標準；是否升級為 mechanical enforcement 由後續觀察決定，本計畫不預先聲稱。

#### 4. CI 閘門完整性（D7）

寫入 `references/workflows/ci.md`（分發到被治理專案的 CI 範本檔案）。
- **限定條件**：僅檢查專案實際啟用且適用的閘門。判定鏈為：若專案無 CI 維護 → 不適用；有 CI 但該閘門不可用（腳本缺失/平台限制）→ 必須明確標記 `not applicable` 或 `deferred`，**不得偽裝成通過**；`echo "No <tool> configured yet"` 是警告佔位，不是已執行。
- **與現有降級策略一致**：不推翻 `SKILL.md`「CI 降級策略」（專案腳本缺失時保留警告佔位）；本條目只補充「可以降級，但必須聲明降級」的判定標準。

### Affected Files

**payload**
- `references/policies/lifecycle.policy.md` —— 新增「宣告與機制的差距」節（Phase 4 後）+ Phase 4 證據等級三級區分（有寫）
- `references/policies/testing.policy.md` —— 測試保護節新增空洞測試/斷言完整集合/事實源規定（有寫）
- `references/policies/coding.policy.md` —— 變更歸位新增列舉複查條目（有寫）
- `references/workflows/ci.md` —— CI 閘門完整性說明（有寫，含降級策略約定）
- `references/templates/agents-md.template.md` —— 裁定為修改：生成專案 AGENTS.md 的變更歸類/測試保護指標帶上宣告-機制一致性要點（有寫）

**repo-infra**
- `CHANGELOG.md` —— [Unreleased] 補條目（治理/機制變更 → `Changed`）
- `docs/{en,zh-CN,zh-TW}/plans/payload-governance-lessons.md` —— 本計畫三語（實現後歸檔為單語）
- `tests/suites/` 現有目標專案測試 —— **裁定：不新增專門測試檔案；** 在目標鏈路斷言（§驗證方法第 4 條）中複用既有 INIT 測試，只增加斷言。若發現既有測試無法承載（例如斷言位置不在現有 suite 內），再拆分新測試檔案，屆時更新本計畫 Affected Files。

> 路徑慣例：`references/` 下的 policy 檔案一律是 `references/policies/<name>.policy.md`；工作流是 `references/workflows/`；範本是 `references/templates/`。無 `references/<name>.policy.md` 這種寫法。

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
4. 乾淨目標 INIT 一個 throwaway 專案（`--phase C`），並做**機械斷言**（非人工核驗）：
   - 生成的 `docs/rules/lifecycle.md` 含「宣告與機制的差距」與「證據等級」——用 `fs.readFileSync` + `.includes()` 斷言，納入現有目標專案測試 suite（複用而非新增）；
   - 生成的 `docs/rules/testing.policy.md` 含「空洞測試」；
   - 生成的 `docs/rules/coding.policy.md` 含「列舉複查」；
   - 生成的 `ci` 範本含「閘門完整性」；
   - 生成的 `AGENTS.md` 含宣告-機制一致性指標。
5. 邊界體檢：`references/` 無 `repo-tools/`、`repo-workflows/`、`npm run` 等本倉庫特有路徑；`check-role-completeness --gate` 綠。
6. 證據等級自檢：每個寫出的規則條目標註適用證據等級（機械 / 人工背書 / 未驗證）；無人能聲稱本次已「機械強制」。

> 寫計畫即驗證：本計畫所有 `references/` 引用必須逐一 `Test-Path` 通過；不存在者即為計畫自身的宣告-機制不一致，必須本計畫先改。