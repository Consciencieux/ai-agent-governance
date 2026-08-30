# Anti-Regression System

[English](../en/anti-regression.md) · [简体中文](../zh-CN/anti-regression.md) · [繁體中文](anti-regression.md)

治理不止於搭骨架 —— 它約束每個 Agent 的每次任務，讓後來者（新同事的 AI / 新的 Agent）無法破壞前人寫好的程式碼。本頁是防亂改機制的開發者地圖；每條的完整規範都在 skill 本體裡（見下）。

- **入口檔案自動載入** — `AGENTS.md` / `CLAUDE.md` / `.cursor/rules/` 每次會話開始自動讀取（見 `references/templates/agents-md.template.md`）
- **六階段操作生命週期** — Understand → Plan → Implement → Validate → Synchronize → Report（見 `references/policies/lifecycle.policy.md`）
- **程式碼修改/刪除保護** — 動既有程式碼先做上下文分析與歸屬判定；刪除必須理由 + 引用搜尋 + 遷移方案（見 `references/policies/coding.policy.md`）
- **變更歸位與殘留清理** — 刪除/重新命名/移動/替換/棄用/拆分合併/設定/API/產生物變更時，區分當前層、相容層和歷史層，不留未解釋殘留（見 `references/policies/lifecycle.policy.md`）
- **規則捕獲** — 開發者提出的持久性要求必須分類並明確裁定後才能進入 `AGENTS.md` / `docs/rules/**`；未決候選保存在可恢復狀態中（見 `references/policies/lifecycle.policy.md`）
- **CHANGELOG 變更分類** — 純文件不改；修復 → `Fixed`；新能力 → `Added`；破壞性 → `Changed`（見 `references/policies/lifecycle.policy.md`）
- **治理檔案保護** — 受保護檔案須 原因 → CHANGELOG → 版本升級 → 跑校驗器。權威清單在 `references/policies/governance-files.policy.md`（單一事實來源）；本頁不複述
- **規則優先級** — 系統/平台安全 > 使用者明確要求 > 治理完整性 > AGENTS.md > docs/rules/ > 既有程式碼慣例
- **Agent 權限矩陣** — 讀取自動；建文件自動；改程式碼需驗證；刪除/依賴/git commit 需確認；push 禁止（見 `references/policies/git.policy.md`）
- **多 Agent 鎖** — `.governance/state.json` 的 `locked` 欄位；不得並行修改同一檔案；從記錄階段續跑（見 `references/templates/sub-skills.md` → state-manager）
- **證據與恢復** — 每項報告基於真實輸出，✅/⚠️/❌ 三態；`preflight.json` 回滾快照（見 `references/policies/lifecycle.policy.md`）

---
