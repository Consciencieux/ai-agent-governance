# Governance Model

[English](../en/governance-model.md) · [简体中文](../zh-CN/governance-model.md) · [繁體中文](governance-model.md)

「治理即程式碼」背後的三層狀態模型：期望態 / 當前態 / 觀測態，以可版本控制的檔案存在於倉庫內。

**完整機器狀態規範在 skill 本體裡** —— [SKILL.md](../../SKILL.md)（".governance/ 機器可讀狀態"一節）。本頁只是開發者概念摘要。

### Spec / Status / Health

參照 Kubernetes 的 Spec / Status / Health 分層：

| 檔案 | 角色 | Git |
| --- | --- | --- |
| `manifest.json` | 期望態 —— 全部治理工件的唯一索引（路徑、`kind`、`type`、版本） | 提交 |
| `state.json` | 當前態 —— 成熟度、階段、Agent 身份、鎖、已完成/阻塞 | 提交 |
| `preflight.json` | 初始化寫入前的回滾快照 | 提交 |
| `generated/skills/` | 生成的 Agent 模組（drift-check、release-manager 等） | 提交 |
| `validation.json` | 觀測態 —— 最近一次校驗結果 | 忽略（執行時輸出） |
| `drift-report.json` | 漂移報告 | 忽略（執行時輸出） |

### 版本

- `schema_version` —— manifest 的資料格式版本
- `governance_version` —— 治理框架版本

二者分離；升框架版本不需要改 schema。

### 其餘內容在哪

MIGRATE 流程、路徑解析、執行時輸出與行為稽核軌跡都是 skill 行為 —— 見 [SKILL.md](../../SKILL.md) 與 `references/`（生成的 state-manager 子技能寫入 `.governance/activity.jsonl`）。

---
