# Validator

[English](../en/validator.md) · [简体中文](../zh-CN/validator.md) · [繁體中文](validator.md)

治理校驗器是零依賴的純 Node 腳本，INIT 時生成到每個被治理專案 `scripts/verify-governance.js`（源頭：本倉庫 `scripts/verify_governance.js`）。本頁是開發者用法手冊；檢查項清單由腳本自身定義，不在本頁複述。

### 用法

```bash
node scripts/verify-governance.js          # 人類可讀報告，退出碼 = 通過/失敗
node scripts/verify-governance.js --json   # 機器可讀 JSON 報告
node scripts/verify-governance.js --help   # 用法
```

全部治理工件存在時退出碼 0，否則 1。

### 模式

- **manifest 模式** — `.governance/manifest.json` 宣告了非空 `artifacts` 陣列時，路徑以它為準（結構適配）。追加 manifest 相關檢查（schema、工件 kind、治理版本、可選 release 中繼資料）。
- **預設模式** — 無 manifest 時檢查內建預設清單（AGENTS.md、CHANGELOG format、architecture/features/plans/rules 目錄、.gitignore、.env.example、CI 工作流程、腳本、.governance/ 狀態檔案、治理版本）。
- **生成技能檢查（兩種模式共存）** — 當 `.governance/generated/skills/` 存在時，對每個子技能目錄檢查其 `SKILL.md` 是否真實且在專案樹內（符號連結檔案、或目錄連結到樹外均被拒絕）。這些檢查附加到當前模式清單，因此 `N/M checks passed` 中的 `M` 隨生成技能數量增加。

工件路徑經過包含性校驗：manifest 條目嘗試逃逸專案根（或透過連結解析到樹外）時報告為失敗，而不是 stat 到專案外。

權威檢查清單在 `scripts/verify_governance.js`（`DEFAULTS` 陣列）；`check-doc-consistency.js` 用它交叉核對 docs 裡的數值宣告。執行時輸出 `validation.json` / `drift-report.json` 不是 required artifact —— fresh checkout 無它們也能通過。

### 治理徽章（可選）

CI 治理 job 產出 shields.io `endpoint` 格式工件（`governance-badge.json`：`{ "schemaVersion": 1, "label": "governance", "message": "N/M", "color": "green|yellow|red" }`）。托管到自選公網位址後，在 README 引用：

```markdown
[![Governance](https://img.shields.io/endpoint?url=<YOUR_HOSTED_URL>/governance-badge.json)](scripts/verify-governance.js)
```

`--json` 輸出的 `score`（passed/total，v1 等權）即徽章與未來看板消費的綜合分數。配色閾值：100% 綠、≥80% 黃、否則紅。

### 報告

人類模式逐項列印 `✓/✗ <名稱> (<路徑>)` 及 `N/M checks passed.`。JSON 模式返回 `{ mode, governance_version, total, passed, failed, score, passedAll, results[] }`。治理檢查必須在宣稱任務完成前、以及 RELEASE 前通過。

---
