# Roadmap

[English](../en/roadmap.md) · [简体中文](../zh-CN/roadmap.md) · [繁體中文](roadmap.md)

時間尺度：**已完成** / **近期** / **中期** / **遠期**

### 已完成

- AGENTS.md 治理引導
- Feature 登記
- 治理校驗器
- 發佈工作流程
- 多語言 CI 範本
- 多 Agent 鎖強制 —— `scripts/check-lock.js`（唯讀鎖檢查；INIT 複製、校驗器必查）
- 校驗器內容檢查 —— CHANGELOG 格式 + manifest `artifacts[].kind` 有效性
- Git 工作流程治理 —— `.governance/git-policy.json` + `scripts/check-git-policy.js`（受保護分支、分支開發、禁止直推）
- Agent 行為稽核 —— 追加式 .governance/activity.jsonl 逐任務稽核軌跡 + drift-check `activity-report` 模式
- 密鑰掃描閘門 —— scripts/check-secrets.js 阻止暫存區密鑰類內容（校驗器 21 項）
- 治理健康分 —— 校驗器 `--json` 輸出綜合 `score`（v1 等權）+ CI 產出 shields.io 徽章 endpoint 工件
- 知識新鮮度 —— `scripts/check-doc-freshness.js` 經 `git log` 提交日期標記過時治理文件，並按來源/譯文對派生譯文新鮮度（建議性；`--release-gate` 阻斷過時或 draft 譯文）
- 內容一致性 —— `scripts/check-doc-consistency.js` 標記文件間交叉矛盾（版本示例/受保護清單/ADR 狀態/roadmap 目標/連結/數值聲明；預設建議性；consent/受保護清單/原則索引/計劃狀態/術語簇在 `--gate`/`--release-gate` 下 fail-closed，changelog 覆蓋僅 `--release-gate` 下 fail-closed）
- **審核管理器** —— 第 8 個子技能：多智能體深度審查工作流程（固定 5 領域、嚴重度排序報告、修復 + 閘門驗證）。設計：[../archive/review-manager.md](../archive/review-manager.md)
- **分級審核閘門** —— release/push 風險分級（低 = 僅輕量級；中 = 批准時建議深度審查；高 = 必須 review-manager）；輕量級腳本總是自動跑。設計：[../archive/tiered-review-gate.md](../archive/tiered-review-gate.md)
- **被治理專案同步組** —— 兩層：（L1）聲明式 `.governance/sync-rules.json`（watch/require）+ 清單驅動 Phase 5；（L2）`scripts/check-sync.js` 對照實際改動集機械驗證。設計：[../archive/governed-project-sync-groups.md](../archive/governed-project-sync-groups.md) + [../archive/sync-groups-mechanical-check.md](../archive/sync-groups-mechanical-check.md)
- **INIT 生成器腳本化** —— 確定性、可快照測試的 INIT 生成（`scripts/generate-governance.js`）；分 A → B → C 三期。設計：[../archive/init-scripted-generator.md](../archive/init-scripted-generator.md)
- **計劃交付閘門** —— `repo-tools/check-plan-delivery.js`：計劃與實際交付的機械對帳（歸檔前 fail-closed）
- **計劃歸檔閘門** —— 規範計劃狀態關鍵詞（design/active/implemented/completed/archived）+ release 作用域的待歸檔閘門（`check-doc-consistency.js` 的 `--release-gate`）+ 交付提取修復（`####` 子節不再截斷）
- **安裝載荷完整性閘門** —— 3 項測試證明複製的閘門腳本自包含（無兄弟 `require`）且 `init-spec.json` 的複製清單與 INIT 實際寫入一致
- **確認政策重寫** —— 跨五個同步點提交前一次確認；計劃批准降為意圖對齊（`consent-policy-hardening` 計劃）
- **治理原則索引** —— 18 條原則的純指標索引 + 一個 `--gate` 檢查保持每條來源可解析
- **規則捕獲** —— 不讓口頭要求只活在對話上下文裡：Agent 對每條要求預分類（持久 / 一次性 / 模糊），開發者在 Phase 6 裁定，確認的規則寫入 `AGENTS.md` / `docs/rules/**`，未確認的在行為軌跡裡留 `rules_pending` 痕跡。設計：[../archive/rule-capture.md](../archive/rule-capture.md)
- **術語門禁** —— 術語表 `Forbidden zh-CN`/`Forbidden zh-TW` 欄在三語樹強制執行（`--gate` fail-closed、行級豁免、無術語表則 no-op）。設計：[../archive/doc-translation-governance.md](../archive/doc-translation-governance.md)
- **翻譯新鮮度** —— Git 派生的逐對狀態（stale / draft / reviewed 標記），`--release-gate` 阻斷落後譯文；無手寫 manifest。設計：[../archive/doc-translation-governance.md](../archive/doc-translation-governance.md)
- **工程克制（機制測試）** —— 未經批准的新增機制必須自證；已批准需求優先；語義接縫合法。設計：[../archive/engineering-restraint.md](../archive/engineering-restraint.md)
- **根因修復協定 + 失敗預算** —— 重現優先的計劃欄位、`repairSessionId` 綁定、第一/二/三次失敗升級。設計：[../archive/anti-patch-development.md](../archive/anti-patch-development.md)
- **測試架構拆分 + 編碼衛生閘門** —— 單一發現入口 + 八個領域套件（集合對帳），並對單體回歸與空套件設閘門。設計：[../archive/anti-patch-development.md](../archive/anti-patch-development.md)
- **分發角色完備閘門** —— `references/` 與 `scripts/` 下每個檔案都攜帶唯一宣告角色（INSTALLED / SKILL-INTERNAL），由 `repo-tools/check-role-completeness.js` 驗證（無未分類檔案、無重疊、無陳舊宣告、打包邊界一致）。設計：[../archive/gate-tiering-evidence-boundary.md](../archive/gate-tiering-evidence-boundary.md)
- **閘門分級 + 證據等級** —— 
- **物理分發邊界** —— 倉庫維護內容不再隨 tarball 發給技能用戶：7 個 repo-only 檔案（skill 發佈流程、打包腳本、五個倉庫專屬閘門）從 `references/` 與 `scripts/` 移入打包步驟無法觸達的 `repo-tools/` 與 `repo-workflows/`。角色閘門反向檢查 + 完整 tarball 清單相等性測試保證「宣告」與「打包」是同一事實。設計：[../archive/repository-boundary-split.md](../archive/repository-boundary-split.md)
- **發佈流程按受眾拆分** —— `release.md` 僅覆蓋被治理專案發佈；本倉庫自身的流程在內聚自足的 `repo-workflows/skill-release.md`（SemVer 判定、分級審核、事務性條款內聯承載）。設計：[../archive/repository-boundary-split.md](../archive/repository-boundary-split.md)
- **INSTALLED 內容專案可移植化** —— 載荷規則正文不再混用受眾：沒有 package.json 的專案不再出現 `npm run` 命令、無技能倉庫 docs 路徑、無無條件三語義務、無懸空指標。設計：[../archive/content-audience-portability.md](../archive/content-audience-portability.md)`check:docs` / `check:payload` / `check:tests` / `check:full` 各入口依變更範圍匹配，每個閘門的產出標註為機械 / 人工背書 / 未驗證，使綠色結果不被讀成超出其實際證明力的結論。設計：[../archive/gate-tiering-evidence-boundary.md](../archive/gate-tiering-evidence-boundary.md)

### 近期

- **多 Agent 協調協定** —— 並發 Agent 之間的標準化協調（鎖檢查已交付；review-manager 的並行子代理是其第一個真實用例）
- **Skill 生命週期管理** —— 獨立 [`ai-skill-manager`](https://github.com/Consciencieux/ai-skill-manager) skill（管理 .agents/skills/ 下所有 skill 的 INSTALL → UPDATE → ROLLBACK，含本 skill）。自 v0.6.0/v0.7.0 順延；當版本同步步驟證明不夠用時再重啟。設計：[plans/skill-lifecycle-management.md](plans/skill-lifecycle-management.md)
- **遠端治理看板** —— 被治理倉庫的可觀測性（依賴：稽核軌跡 + 健康分，均已交付）
- **monorepo 多治理域** —— 校驗器多根解析 + 多 manifest（出現真實 monorepo 需求時再做）

### 已裁定延後的發佈安全事項

已裁定、已記錄、有意未實作。執行任何發佈相關任務前先看這一節：它們是「閘門綠燈」實際
證明範圍內的已知缺口。

- **評審證據綁定** —— 狀態：延後。當前行為：`reviewStatus` 是自證聲明（提案中由呼叫
  方提供的字串）；`headSha` 是機械校驗的。`execute` 會列印該值為自證聲明，因此簽名
  標籤並不意味著評審發生過。重新評估條件：發佈批准需要證明評審者身分，或評審證據必須
  綁定到具體 commit。參見：[../archive/gate-repair-and-ssot-alignment.md](../archive/gate-repair-and-ssot-alignment.md) § C6

### 中期

- **demo 示例倉庫** —— 展示治理產物實際效果的真實示例專案（中期；在此之前本倉庫僅作為*輕量治理*參考：發佈流程 + plans/archive + ADR + 測試，**不是**完整的被治理軟體專案——其 validator 預設模式必然失敗屬設計使然）
- **生態完善** —— IDE 擴充（治理感知的編輯器整合；真實使用者需求出現時觸發）+ Cursor 相容實測（驗證文件聲明的 `.cursor/rules` 相容性；機制變化或問題報告時觸發）

說明：未實現功能的設計計劃在各語言樹的 `plans/`（如 `skill-lifecycle-management.md`）；已完成的 TASK 計劃在發佈時歸檔到 `docs/archive/`。被治理專案自身的開發計劃由 INIT 生成在 `docs/plans/DEVELOPMENT_PLAN.md`。

**維護規則（每次發佈滾動重排）：**

1. **完成時** —— 移到「已完成」（已完成項不帶時間尺度）。其設計文件歸檔到 `docs/archive/`（共享區，單語）。
2. **時間尺度是相對的** —— 移出已完成項後，剩餘項整體前移：中期 → 近期、遠期 → 中期（視需求）。
3. **觸發時機** —— 重排是發佈流程的一部分（`release-manager` 歸檔計劃時一併重排本 roadmap），不是隨手改；否則時間標註會過期失真。
