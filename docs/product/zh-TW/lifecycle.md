# Agent Operating Lifecycle

[English](../en/lifecycle.md) · [简体中文](../zh-CN/lifecycle.md) · [繁體中文](lifecycle.md)

被治理專案中任何 Agent 執行的每個開發任務都遵循六階段生命週期：**Understand → Plan → Implement → Validate → Synchronize → Report**。按範圍分級決定適用程度：小型改動（單檔案、<50 行、無公共介面變化）只走 Understand → Implement → Validate → Report；中大型改動走完整六階段並建 TASK 計劃。

**完整規範在 skill 本體裡** —— `references/policies/lifecycle.policy.md`，INIT 時複製進被治理專案為 `docs/rules/lifecycle.md`。本頁只是開發者摘要。

完整生命週期還包括變更歸位與殘留清理（高影響變更的當前層/相容層/歷史層檢查）和規則捕獲（持久性開發者要求寫入規則檔案前必須明確裁定）；兩者均由同一政策檔案定義。

### 變更分類（何時寫 CHANGELOG）

| 變更類型 | CHANGELOG 動作 |
| --- | --- |
| 僅文件/註解/typo | 不更新 |
| Bug 修復 | `Fixed` |
| 新能力 | `Added` |
| 架構/行為/破壞性變更 | `Changed` |

### Definition of Done

程式碼 + 測試 + 全部品質閘門 + CHANGELOG + 文件同步，缺一不算完成。

### 成熟度等級（INIT 策略）

| 等級 | 判定 | 策略 |
| --- | --- | --- |
| L0 空倉庫 | 只有 README/無原始碼 | 建立完整治理骨架 |
| L1 原型 | 有少量原始碼，無測試/CI/文件體系 | 完整骨架 + 接管現有檔案（合併而不覆蓋） |
| L2 活躍開發 | 有原始碼 + 測試 + 部分 CI/文件 | 增量補齊缺口，只建立缺失項 |
| L3 生產專案 | 大量檔案 + 既有規範 | 稽核模式：差距報告 + 最小修補 |

---
