# Skill Lifecycle Management（TASK 計劃）

[English](../../en/plans/skill-lifecycle-management.md) · [简体中文](../../zh-CN/plans/skill-lifecycle-management.md) · [繁體中文](skill-lifecycle-management.md)

> **狀態：設計計劃，未實作。** 暫緩的設計計劃；當版本同步步驟證明不夠用時再重啟（roadmap 近期條目）。

### 任務目的

治理 Agent 能力本身的生命週期 —— **INSTALL → UPDATE → ROLLBACK** —— 讓 skill（含 `ai-agent-governance` 自身）從「一次性安裝」變為可檢查、可更新、可回滾。治理對象從 Agent 行為擴展到 Agent 能力本身。

層級區分：

```
ai-agent-governance
        |
        ├── 管理目標專案治理狀態（.governance/）
        |
        └── 自身也是一個被安裝的 skill（.agents/skills/ai-agent-governance/）
```

skill 更新操作**安裝層**（`~/.agents/skills/...`），而非 `project/.governance`。

### 當前問題

- 生命週期 `INIT → Runtime → AUDIT → RELEASE` 缺少 `UPDATE` 階段
- Agent 平台（Claude Code / Codex / opencode）不會主動檢查 skill 更新、掃描版本或維護 skill 生命週期
- 技術上可行（讀取本地 skill 檔案、執行 git、查詢 GitHub release、修改本地檔案）——但缺少「何時主動做」的機制
- 本地與遠端版本漂移無感知（`local 0.3.1` vs `remote 0.3.2` 無人比較）

### 提議方案

在**安裝層**增加獨立的 **Skill Manager**。不要實作為 `.governance/generated/skills/update-manager` —— 該層管理目標專案的治理子技能；skill 自更新屬於更高層級。

架構：

```
             Skill Registry（GitHub releases）
                      |
                      v
              .agents/skills
                      |
                      v
               Skill Manager
                    ├── check update（檢查更新）
                  ├── install（安裝）
                  └── rollback（回滾）
                      |
                      v
      ai-agent-governance → Project Governance（.governance/）
```

#### 1. 版本元資料

SKILL.md frontmatter 增加 `version`：

```yaml
---
name: ai-agent-governance
version: 0.5.0
---
```

Agent 即可比較：`local: 0.5.0` vs `remote: 0.6.0` → 有更新。

#### 2. 能力

| 能力 | 行為 |
| --- | --- |
| CHECK | 當前版本 · 最新 release · changelog |
| UPDATE | 下載新版本 → 替換 skill → 驗證 |
| ROLLBACK | 恢復上一版本 |

#### 3. 整合方式

- **(a) 獨立 skill** —— `.agents/skills/skill-manager/`（推薦；安裝層職責）。已有種子：[`ai-skill-manager`](https://github.com/Consciencieux/ai-skill-manager)（Issue #1）。
- **(b) 整合進 `ai-agent-governance` 的 UPDATE 模式** —— `/update-skill ai-agent-governance`；操作對象是 `~/.agents/skills/ai-agent-governance`，而非 `project/.governance`。

#### 4. 更新流程

```
Inspect（读取 SKILL.md frontmatter 的本地版本）
→ 查询 upstream release
→ 比较版本
→ 备份当前 skill
→ 更新
→ 驗證
```

#### 5. 版本路線

- **v0.3.x** —— 不做（優先穩定治理模型 / release / CI）
- **順延（遠期）** —— 當 v0.5.2 的版本同步步驟證明不夠用時再重啟；暫無版本目標

### 受影響檔案

計劃（實作階段）：

- `SKILL.md` —— frontmatter 增加 `version`（與發佈保持同步）；若選方案 (b) 另增 UPDATE 模式
- 獨立實作位於單獨的 `ai-skill-manager` 倉庫（已存在，Issue #1）——本倉庫改動保持最小
- `docs/zh-TW/roadmap.md` / `docs/zh-TW/architecture.md` —— 狀態與架構更新
- `references/` —— 除非選方案 (b)，否則不變（新模式將引用更新流程）

### 風險

- 更新中斷/損壞 → 需要預置備份與回滾路徑
- 自動更新可能引入破壞性變更 → 更新前讀 changelog + 使用者確認
- 多 Agent 共享 `.agents/skills` 時並發更新 → 串行化/加鎖
- 更新可能與已生成產物不相容（`.governance` 輸出、`references/` 結構）→ 版本相容聲明 + 遷移說明
- 回滾後與已治理專案狀態失配 → 記錄對帳步驟

### 驗證方法

- CHECK 能正確報告本地 vs 遠端版本差異（模擬遠端版本測試）
- UPDATE 完整流程：下載 → 備份 → 替換 → 驗證（沙箱測試）
- ROLLBACK 能恢復備份版本
- 模擬更新中斷不留半損壞狀態
- SKILL.md frontmatter `version` 與 release tag 一致（版本一致性檢查）
