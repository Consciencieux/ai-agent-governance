# Anti-Regression System

[English](../en/anti-regression.md) · [简体中文](../zh-CN/anti-regression.md) · [繁體中文](anti-regression.md)

治理不止於搭骨架 —— 它約束每個 Agent 的每次任務，讓後來者（新同事的 AI / 新的 Agent）無法破壞前人寫好的程式碼。本頁是防亂改機制的開發者地圖；每條的完整規範都在 skill 本體裡（見下）。

- **入口檔案自動載入** — `AGENTS.md` / `CLAUDE.md` / `.cursor/rules/` 每次會話開始自動讀取（見 `references/instruction/agents-md.template.md`）
- **六階段操作生命週期** — Understand → Plan → Implement → Validate → Synchronize → Report；含變更歸位、規則捕獲與變更分類（見 [lifecycle.md](lifecycle.md)）
- **程式碼修改/刪除保護** — 動既有程式碼先做上下文分析與歸屬判定；刪除必須理由 + 引用搜尋 + 遷移方案（見 `references/policies/coding.policy.md`）
- **治理檔案保護** — 受保護檔案須 原因 → CHANGELOG → 版本升級 → 跑校驗器。權威清單在 `references/policies/governance-files.policy.md`（單一事實來源）；本頁不複述
- **規則優先級** — 系統/平台安全 > 使用者明確要求 > 治理完整性 > AGENTS.md > docs/rules/ > 既有程式碼慣例
- **Agent 權限矩陣** — 讀取自動；建文件自動；改程式碼需驗證；刪除/依賴/git 寫入操作（commit、push、tag）需使用者明確授權（見 `references/policies/git.policy.md`）
- **多 Agent 鎖** — `.governance/state.json` 的 `locked` 欄位；不得並行修改同一檔案；從記錄階段續跑（見 `references/instruction/sub-skills.md` → state-manager）
- **證據與恢復** — 每項報告基於真實輸出，✅/⚠️/❌ 三態；`preflight.json` 回滾快照（見 `references/policies/lifecycle.policy.md`）

---
