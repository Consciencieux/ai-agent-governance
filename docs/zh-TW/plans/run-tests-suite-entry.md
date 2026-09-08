# 領域級測試入口（run-tests.js --suite）（TASK 計劃）

> **Status: design plan, not implemented.**（設計計劃，未實作。已核准立案：本計劃是反補丁計劃 `anti-patch-development.md` §3「拆分採用基線遞減策略…並在每次遷移後保留領域級可執行入口」的**既核准承諾尾款**，不是新機制；工程克制「機制測試」不觸發，受「已核准需求優先」邊界保護。）

**Target：repo-infra** —— `run-tests.js` 是本倉庫測試執行器（REPO-ONLY，不隨 INIT 分發），變更只影響本倉庫的開發迴圈與測試架構。

### 任務目的

測試拆分（v1.0.1 已完成 11 個領域套件）之後，開發迴圈只能使用全量入口：改一個 README 標點也要跑 `npm test`（實測 42.9s，佔 `npm run check` 44.6s 的 96%）。反補丁計劃 §3 承諾的「領域級可執行入口」從未交付。本計劃交付一個**手動**快速入口，使迭代迴圈可以只跑相關套件，同時保持發佈/稽核迴圈的全量回歸不變。

### 當前問題

- 全量測試 42.9s，成本集中在 4 個套件：security 10.8s + docs 9.9s + consistency 6.3s + payload 5.9s = 33s（76%）。
- `tests/run-tests.js` 無 CLI 參數：SUITES 硬編碼、不讀 `process.argv`，單套件執行無入口。
- 這是開發體驗缺口，**不是**全量回歸本身錯誤——發佈/稽核/提交前全量是正確設計。

### 提議方案

`tests/run-tests.js` 增加兩個 CLI 參數：`--suite <name>` 與 `--list`。

行為規格（嚴格收窄，不超出）：

1. **無參數** → 現有全量行為，逐字不變（`npm test`、`npm run check` 繼續全量）。
2. **`--suite <name>`** → 只註冊並執行指定的單一套件。
3. **未知套件名** → `process.exit(1)`，並在標準錯誤列出可用套件（提示 `--list`）。
4. **`--list`** → 按 `SUITES` 宣告順序列印 canonical name（每行一個），exit 0。
5. **`--suite all`** → 等同無參數（全量），語意明確，文件可寫。
6. **不傳參數時 `npm test`/`npm run check` 輸出不變**——不改變既有呼叫方的任何行為。

#### 套件 canonical name（唯一命名規則）

`<name>` 是去掉路徑與 `.test.js` 副檔名後的名字，**不接受 `docs.test.js` 這類別名**——避免產生第二套命名規則：

```text
validator
security
consistency
docs
release
generator
payload
hygiene
narration
sync
plan-delivery
```

`--list` 嚴格按 `SUITES` 陣列宣告順序輸出（不排序），使輸出同時充當註冊順序的可見事實。

### 隔離性（已實測基線，作為計劃證據，不作為預設測試）

| 證據 | 結果 |
| --- | --- |
| 11/11 套件獨立執行（單獨 require + 執行） | 全部通過，無失敗 |

實測（2026-09-08 基準）：`consistency(68) docs(51) generator(33) hygiene(16) narration(12) payload(41) plan-delivery(15) release(18) security(35) sync(11) validator(26)` 各自獨立執行均通過。helpers 的 `TMP_ROOT` 每次執行獨立建立，套件間無共享初始化狀態。

**決定**：不要把隔離性回歸接入預設 `npm test`（會放大測試成本到約 90s，本末倒置）。隔離性由以下方式保持：(a) 本計劃記錄基線證據；(b) 單套件執行入口本身是隔離性的一次性使用證明。若未來出現依賴全域狀態的回歸，由具體測試失敗顯式暴露。

### 驗證方法

1. `node tests/run-tests.js --list` → 按 `SUITES` 順序輸出 11 個 canonical name，exit 0。
2. `node tests/run-tests.js --suite unknown` → exit 1，stderr 列出可用套件。
3. `node tests/run-tests.js --suite hygiene` → 只執行 hygiene 套件（16 個），不含其他套件輸出。
4. 無參與 `--suite all` 的全量語意：**用不遞迴的方式驗證**（見下）。
5. `npm run check` → 全量閘門 exit 0（既有指令碼不受影響）。

#### 遞迴防護（測試設計約束）

CLI 回歸測試**不得**在測試體內執行會重新載入當前套件的形式——`--suite all` 與無參都會拉起整個 runner，若從測試內 spawn 就會遞迴啟動（自身套件被再次註冊執行）。約束：

- 允許 spawn 的形式：`--list`、`--suite unknown`、`--suite <不含本測試的單一套件>`（例如從 hygiene 測試裡 spawn `--suite narration`）。
- 無參與 `--suite all` 的等價性**不用 spawn 驗證**，改為讀原始碼斷言：解析 `run-tests.js`，確認 `all` 與「無參」走同一分支，不建構第二條全量路徑。
- 現狀核實：現有測試對 `run-tests.js` 的引用全部是寫入暫存夾具檔案，無一 spawn 真 runner；本計劃保持該性質。

### 受影響檔案

- `tests/run-tests.js` —— 增加參數解析 + 分派
- `tests/suites/hygiene.test.js` —— CLI 行為回歸斷言（runner 機制歸 hygiene 套件，與現有 mutation-probe 斷言同址）
- `CHANGELOG.md` —— `Added` 段記錄
- `docs/{en,zh-CN,zh-TW}/plans/run-tests-suite-entry.md` —— 本計劃（三語）

### 明確不做（與工程克制 §3 對齊）

- **不做自動 scope routing**：不根據 `git diff` 自動選擇測試子集；`--suite` 是手動明確入口，不冒充「自動範圍閘門」。
- **不做 `--changed`**：閘門指令碼（check-doc-consistency 等）保持全域語意，不受此改變影響。
- **不做閘門範圍選擇**：`check:docs`/`check:payload` 等仍以全量測試開頭，除非另有獨立證據證明映射安全（本計劃不提供該證據，不請求核准）。
- **不做資格矩陣/評分/審查階段**：無新增治理機制。

### 風險與決定

- **`--suite` 會不會被誤用於繞過全量回歸？** 規避：`npm run check` 與 `--suite` 解耦——`check` 系列永遠全量；`--suite` 只作為開發迭代入口。文件在 CHANGELOG 與計劃中明確，不做自動化攔截。
- **單套件執行是否可能因缺少其他套件的初始化而假綠？** 規避：已實測 11/11 獨立通過（見隔離性）；本計劃把該證據記錄為基線，不把 11 遍套件接入測試（成本不可接受）。若未來出現套件間隱式依賴，其失敗由 CI 全量基線捕獲。
- **約定衝突：** 反補丁計劃 §3 承諾「每次遷移後保留領域級可執行入口」，本計劃是尾款——若被內部審查認為「新機制」，引用工程克制「已核准需求優先」邊界，衝突時升級決策、不本地裁決。

### 已知限制

- 手動入口，效能改善有限（開發迭代 42.9s → 單套件最快 0.3s hygiene）。
- 不改變全量測試的絕對成本。
- CI 不帶該參數（CI 繼續全量）。

### 驗證完成條件

- `npm run check` exit 0
- `npm test` exit 0（326/326 或等價基線）
- 4 條 CLI 行為全部有回歸斷言，且斷言在退化時變紅（變異驗證）
- 三語文件 parity 通過
