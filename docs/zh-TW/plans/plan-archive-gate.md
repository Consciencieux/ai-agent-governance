# 計劃歸檔閘門（TASK 計劃）

[English](../../en/plans/plan-archive-gate.md) · [簡體中文](../../zh-CN/plans/plan-archive-gate.md) · [繁體中文](plan-archive-gate.md)

> **狀態：已實作（2026-09-03）。** 交付驗證（`scripts/check-plan-delivery.js`）跳過純設計計劃；本行即標記。

**Target: both** —— `payload` 把計劃狀態契約與 release 閘門接線落到被治理專案的工件（`references/`，含 INIT 複製的 `scripts/check-doc-consistency.js`）；`repo-infra` 維護本倉庫的閘門簇、交付閘門提取修復、測試與三語文件同步。兩類交付點分列在下方「受影響檔案」。

**目標版本：v0.12.0（暫定）。** 規範計劃狀態契約 + release 作用域閘門是新的 payload 能力（minor），不是補丁；發佈時由 Release Proposal 按 SemVer 重新判定。實作階段不改版本、不建立發佈。

### 任務目的

終止反覆出現的漏歸檔問題——已完成的 TASK 計劃一直留在 `docs/*/plans/` 未歸檔——並讓計劃完成度成為機器可查詢的進度視圖。目前完成度靠手寫 prose 推斷，推斷錯誤時沒有任何閘門報錯；讓「已實作但未歸檔」成為機制可偵測、在發佈時強制執行的狀態——prose 裡可以被遺忘，閘門裡不能被繞過。

### 當前問題

- 計劃完成狀態只有 prose：狀態行至少有八種表述（`implemented`、`Completed (2026-08-29)`、`已实现，已归档`、`已实现（v0.6.0，已归档）`、`设计计划，未实现`、……）。沒有規範的機器可讀值。
- 歸檔步驟（`references/workflows/release.md` Phase 4 第 4 步）是執行者必須記住的清單項；沒有閘門強制它。
- `scripts/check-plan-delivery.js` 驗證聲明的文件，但只用排除法——只要不是純設計計劃就納入範圍。它從不報告「某計劃標註已實作卻仍躺在 `plans/`」；從閘門角度看歸檔是可選的。
- 真實案例：`v0.11.0` 發佈只提交了版本同步文件；三個已實作計劃（`post-review-remediation`、`removal-hygiene`、`rule-capture`）留在 `plans/`，直到人工複查才發現。閘門全程通過。
- 用 `####` 子分節書寫的「受影響檔案」在交付閘門中提取為空——`scripts/check-plan-delivery.js` 的 `extractSection` 在第一個 `####` 處截斷，這類計劃空洞通過。已歸檔的 `rule-capture.md` 帶此缺陷，本計劃的初稿也踩中了它。
- `skill-lifecycle-management.md`（三語樹）完全沒有 Status 行——一個現有工具連名字都叫不出來的狀態。

### 提議方案

#### 1. 規範狀態關鍵詞

每個計劃的第一行 Status/狀態 行必須以一個規範關鍵詞開頭；該集合是閘門的屬性，三個語言樹完全一致：

| 規範值 | English | 简体中文 | 繁體中文 | 閘門處理 |
| --- | --- | --- | --- | --- |
| design | Status: design plan, not implemented | 状态：设计计划，未实现 | 狀態：設計計劃，未實作 | 不在交付範圍；永不是待歸檔候選 |
| active | Status: Active | 状态：Active | 狀態：Active | 進行中（Phase 2 建立態）；不是待歸檔候選 |
| implemented | Status: implemented | 状态：已实现 | 狀態：已實作 | 位於 docs/*/plans/ 時為待歸檔候選 |
| completed | Status: Completed | 状态：已完成 | 狀態：已完成 | 位於 docs/*/plans/ 時為待歸檔候選 |
| archived | Status: archived | 状态：已归档 | 狀態：已歸檔 | 從不標記；歸檔即斷言完成 |

不以規範關鍵詞開頭的變體為 `unknown`——照實報告，絕不猜測。`completed` 與既有 Phase 5 約定一致（任務收尾時標 Completed；歸檔發生在 RELEASE），本契約是成文既有行為而非發明新生命週期。

#### 2. release 作用域的待歸檔閘門

- `scripts/check-doc-consistency.js` 新增閘門簇：掃描 `docs/{en,zh-CN,zh-TW}/plans/*.md`，按規範關鍵詞分類每個計劃，報告 `plans_pending_archive` 與 `plans_status_unknown`。
- 僅在新的 `--release-gate` 模式下 fail-closed（常開閘門簇 + 待歸檔簇），接線到 `references/workflows/release.md` Phase 4 第 3 步。default 與 `--gate` 模式下待歸檔僅 advisory：任務收尾到發佈之間，計劃合法地以 implemented 狀態留在 `plans/`——這是成文生命週期，常開檢查不得在該窗口變紅。本計劃自身實作後的狀態就是回歸證明。
- `plans_status_unknown` 保留在常開 `--gate` 中 fail-closed：它當場改一行狀態行即可修復，而待歸檔只能在 release 解決。
- 三語樹缺失時掃描安全降級（INIT 會把本腳本裝進被治理專案；該簇在那裡 no-op）。

#### 3. 歸檔措辭與觸發同步

- `references/policies/lifecycle.policy.md` 記錄計劃頭契約；`AGENTS.md` 鏡像指標。
- `docs/{en,zh-CN,zh-TW}/commands.md` 的 plan-manager 行增加 `archive completed plan` 觸發詞（prompt-sync 檢查覆蓋）。
- `references/workflows/release.md` 以腳本無關措辭陳述先決條件，使其在被治理專案同樣成立：歸檔步驟運行時，任何狀態為 implemented/completed 的計劃不得留在 `docs/plans/` 或 `docs/*/plans/` 下。

#### 4. 修復交付閘門的 `####` 截斷

`scripts/check-plan-delivery.js` 的 `extractSection` 在「受影響檔案」內第一個 `####` 處截斷，那裡的聲明從未被校驗。把節邊界改為只在更低級別標題（`##`/`#`）處停止，並補一個 `####` 結構分節的回歸測試。本計劃的驗收依賴閘門讀到它的扁平聲明；該修復也讓未來子分節式計劃保持誠實。

#### 5. 進度可見性

`scripts/check-doc-consistency.js --json` 增加逐計劃狀態分類（design / implemented / completed / archived / unknown）及待歸檔計數——本倉庫此前缺失的機器可查詢完成進度視圖。

### 受影響檔案

**Payload（交付給被治理專案）**

- `references/policies/lifecycle.policy.md` —— 計劃頭契約：規範關鍵詞表、各值含義、release 閘門下的歸檔時序
- `references/templates/agents-md.template.md` —— Phase 2 計劃結構引用規範狀態關鍵詞
- `references/workflows/release.md` —— Phase 4 第 3 步運行 `--release-gate`；第 4 步增加腳本無關的待歸檔先決條件
- `scripts/check-doc-consistency.js` —— 新閘門簇、`--release-gate` 模式、`--json` 逐計劃分類（INIT 複製本腳本；三語掃描在被治理專案 no-op）

**Repo-infra（本倉庫維護）**

- `scripts/check-plan-delivery.js` —— `extractSection` 只在更低級別標題處停止；`####` 內容被校驗
- `tests/run-tests.js` —— 閘門簇 fixture（advisory 對 release-gate）、unknown 狀態閘門、三語關鍵詞、提取回歸
- `AGENTS.md` —— 規範計劃狀態約定與 release-gate 步驟指標
- `docs/en/commands.md` + `docs/zh-CN/commands.md` + `docs/zh-TW/commands.md` —— plan-manager 增加 archive 觸發詞
- `docs/{en,zh-CN,zh-TW}/plans/skill-lifecycle-management.md` —— 補設計狀態行（歸一化；防止落地即 unknown）
- `CHANGELOG.md` —— `[Unreleased]` Added 條目

發佈邊界另按 Release 流程同步 `package.json`、`SKILL.md` frontmatter、CHANGELOG 和 tag；這不是本計劃授權的自動版本操作。完成後按倉庫規則歸檔本計劃（zh-CN 副本勝出，移入 docs/archive/plan-archive-gate.md），且先通過計劃交付閘門。

### 風險與緩解

- 既有 prose 的誤報以 `plans_status_unknown` 暴露，隨計劃通過逐步調和；關鍵詞集合保持顯式，不靜默放寬正則。
- release 閘門只有被調用才有效：接線進 release.md Phase 4 第 3 步，且本倉庫的發佈實踐執行該清單。
- 三語關鍵詞漂移：關鍵詞表在三樹中完全一致；編輯後運行 parity 與 prompt-sync 檢查。
- 範圍蔓延：不重寫所有既有計劃的 prose；歸一化只覆蓋無狀態行的那份計劃。
- 常開閘門在 pre-release 窗口保持綠色屬設計使然——強制點是 release 時，不是每次檢查。

### 驗收與驗證方法

#### 自動測試/契約測試

- `plans/` 下的 implemented 計劃：`--gate` 退出 0（僅 advisory 報告）；`--release-gate` 以 `plans_pending_archive` 退出 1 並指名該計劃。
- 同一計劃移到 `docs/archive/`：兩種模式皆綠。
- 設計計劃與已歸檔計劃：兩種模式都不標記。
- unknown 狀態：`--gate` 退出 1。
- zh-CN 與 zh-TW 的關鍵詞變體都被識別。
- `####` 結構的受影響檔案節能提取其聲明（截斷修復的回歸測試）。

#### 閘門驗證

- 本計劃自身狀態翻成 implemented 後 `npm test` 與 `npm run check` 立即保持綠——release 作用域決策的回歸證明。
- 三語 commands.md 編輯後 `scripts/check-doc-parity.js` 保持綠。
- 記錄真實輸出；絕不聲稱「應當通過」。
