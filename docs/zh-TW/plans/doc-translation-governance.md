# 文件翻譯治理升級：術語門禁與翻譯新鮮度（TASK 計劃）

[English](../../en/plans/doc-translation-governance.md) · [简体中文](../../zh-CN/plans/doc-translation-governance.md) · [繁體中文](doc-translation-governance.md)

> **狀態：已實作，待歸檔。** 本計劃把三語文件從「結構同步」升級為「術語約束 + Git 派生新鮮度」，全部採用機械對帳：事實源仍是來源文件與術語表，狀態一律派生，不引入手寫 manifest、TMS 或執行期 i18n。

**Target：both** —— `payload` 擴展兩個已交付腳本（check-doc-consistency.js、check-doc-freshness.js）並同步其生命週期與子技能中的行為描述；`repo-infra` 擴展術語表、測試與本倉庫文件。兩個域分別列在「受影響文件」中。

### 任務目的

結構 parity 只證明三語文件「長得一樣」，不證明翻譯正確。本工作階段已真實發生 `協議/協定` 混用、`審核一下/审核一下` 漂移、zh-TW 文件混入簡體詞——全部是結構門禁檢不出的缺陷。本計劃在不重構目錄、不接 TMS、不引入 CLDR/ICU 的前提下，補上語義治理的第一層機械防線：術語約束 + 翻譯新鮮度。 <!-- i18n: allow 協議 -->

### 當前問題

- 檢查的是結構一致，不是翻譯一致：錯譯、漏譯、術語漂移、zh-TW 簡體洩漏沒有任何機械檢出手段。
- 沒有翻譯狀態模型：來源文件更新後譯文可能已經過時，但門禁仍然通過；現有 freshness 檢查只對比「文件 vs 程式碼活躍度」，不對比「來源文件 vs 譯文」的相對新鮮度。
- 「三語一次同步」與「草稿階段延遲翻譯」兩條規則之間缺少機械化狀態表達，目前完全依賴 Agent 自覺。

### 提議方案

#### 1. 術語門禁（第 1 優先）

- `docs/glossary.md` 增加兩個可選欄 `Forbidden zh-CN` 與 `Forbidden zh-TW`（分號分隔變體，缺省為空）：為概念登記禁止譯法，如 protocol 列的 Forbidden zh-TW 記 `協議`。 <!-- i18n: allow 協議 -->
- 擴展 `scripts/check-doc-consistency.js`：掃描三語文件樹，zh-CN 文件命中 Forbidden zh-CN 變體、zh-TW 文件命中 Forbidden zh-TW 變體即報告（kind `terminology_usage`）。跳過 glossary.md 自身。支援行級豁免註釋 `<!-- i18n: allow <術語> -->`。
- 執行強度：`--gate`/`--release-gate` fail-closed（隨 npm run check 常開）。術語門禁只保證術語一致，不判定整段翻譯語義正確——它是語義治理的第一層，不是機器翻譯品質判定器。

#### 2. Git 派生翻譯新鮮度（第 2 優先）

- 擴展 `scripts/check-doc-freshness.js`：按路徑對匹配（docs/zh-CN/X.md → docs/en/X.md、docs/zh-TW/X.md），比較每對檔案的最後提交時間（`git log -1 --format=%ct`，延續該腳本不用 mtime 的既有設計）。
- 判定：`sourceCommit > translationCommit → stale`；`sourceCommit ≤ translationCommit → translated`。
- 兩個邊界：① 來源檔案有未提交修改（疊加 `git status`/diff 判斷）→ 譯文視同 stale；② 來源與譯文同一次提交只報告「同步提交」，不聲明翻譯正確。
- `draft` 由 front matter 表達（檔案頭部 `<!-- i18n-status: draft -->`），僅非發佈階段允許繞過；`--release-gate` 下 stale 與 draft 均阻斷。
- 執行強度：日常 advisory（延續該腳本 exit 0 慣例）；`--release-gate` fail-closed。被治理專案沒有三語樹 → 檢查自然 no-op，payload 相容性由測試保證。

#### 3. Section ID 對齊（後續迭代，本計劃不實作）

記錄方向：用 `<!-- i18n-section: X -->` 標註穩定章節標識，三語文件只要求 ID 集合一致，不再強求列表數量與表格尺寸完全一致，從而減少結構 parity 的誤報。此項目在術語門禁與新鮮度落地並穩定後再啟動。

### 受影響文件

#### Payload

- `scripts/check-doc-consistency.js` —— 術語門禁（kind `terminology_usage`，advisory/`--release-gate` 雙強度）
- `scripts/check-doc-freshness.js` —— 翻譯新鮮度（路徑對 + 未提交來源變更 + draft front matter）
- `references/policies/lifecycle.policy.md` —— 建議層描述更新（freshness 新增 release-gate 阻斷強度）
- `references/templates/sub-skills.md` —— standard validation sequence 描述同步
- `references/workflows/release.md` —— Phase 4 第 3 步接入 `check-doc-freshness.js --release-gate`

#### 倉庫基礎設施

- `docs/glossary.md` —— 新增 Forbidden zh-CN / Forbidden zh-TW 欄（術語權威擴展）
- `tests/run-tests.js` —— 術語命中/豁免/無術語表 no-op；新鮮度 stale/translated/未提交來源變更/draft/release-gate 阻斷；payload 無三語樹 no-op
- `AGENTS.md` —— gate 簇描述同步術語門禁
- `docs/{en,zh-CN,zh-TW}/architecture.md` —— check-doc-consistency.js 與 check-doc-freshness.js 的樹內註釋同步
- `docs/{en,zh-CN,zh-TW}/roadmap.md` —— 一致性/新鮮度兩行描述同步
- `CHANGELOG.md` —— 發佈邊界記錄行為變化
- `SKILL.md` —— 嵌入的 manifest 版本示例隨發佈同步（0.11.2 → 0.11.3）
- `docs/en/commands.md` —— 觸發詞回源補同步，記錄 i18n-reviewed 標記
- `docs/zh-TW/commands.md`、`docs/zh-TW/bootstrap-output.md`、`docs/zh-TW/skill-discovery.md`、`docs/zh-TW/plans/skill-lifecycle-management.md` —— 術語門禁發現的簡體洩漏修正

### 風險與決定

- 歷史譯文未必嚴格同步：首次開啟 release-gate 可能一次性暴露存量 stale。緩解：日常 advisory 觀察一輪，發佈前修齊或補 draft 標註。
- 觸發詞類簡體詞（如 `审核一下`）在 zh-TW 文件中是來源形態引用，禁止譯法只登記概念術語、不登記觸發詞；確需登記的場景用行級豁免註釋兜底。
- 術語門禁可能誤傷正當語境：禁止譯法按概念登記而非全局詞頻規則，誤報由行級豁免顯式解決。
- 同提交同步 ≠ 語義正確：報告措辭只說「同步提交」，不升級為翻譯品質聲明。
- payload 相容：被治理專案形態無三語樹、無術語表，兩項檢查必須 no-op 且不改變現有 exit 碼語義。

### 驗證方法

- 術語門禁：zh-TW 文件含 `協議` 且 glossary 已登記該禁止譯法 → advisory 報告、release-gate exit 1；豁免註釋命中不報；無 glossary 的被治理形態 no-op。 <!-- i18n: allow 協議 -->
- 新鮮度：來源晚於譯文 → stale；同步提交 → translated；來源有未提交修改 → stale；front matter draft → 日常繞過、release-gate 阻斷。
- 變異測試：回退術語檢查與新鮮度判定後，對應測試失敗。
- 更新三語樹與 payload 複製不變量後，`npm test`、`npm run check`、`npm run check:all`、`--release-gate` 全部通過。

---
