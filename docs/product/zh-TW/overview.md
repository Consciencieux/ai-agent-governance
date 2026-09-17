# 治理能力總覽

[English](../en/overview.md) · [简体中文](../zh-CN/overview.md) · [繁體中文](overview.md)

## 這是什麼

`ai-agent-governance` 是一個可安裝的 AI Agent Skill。它把治理框架寫進目標倉庫——規則、校驗器、漂移偵測、發佈管控——使約束在 Agent 會話間存續，而非隨上下文丟失。

與具體 AI 工具無關：Claude Code、Cursor、opencode、Codex 均可使用。

## 治理了哪些事

| 治理關切 | 規則在哪（讀） | 機械兌現（跑） |
| --- | --- | --- |
| 密鑰掃描 / 勿回顯 | `docs/rules/security.md` | `scripts/check-secrets.js`（CTRL-0001） |
| Git 寫確認 / 分支保護 | `docs/rules/git-policy.md` | `scripts/check-git-policy.js`（CTRL-0002） |
| 治理檔案保護 | `docs/rules/governance-files.md` | 手動流程（reason → CHANGELOG → bump → verify） |
| 治理校驗 | `AGENTS.md` 校驗序列 | `scripts/verify-governance.js` |
| 文件新鮮度 / 翻譯新鮮度 | `docs/rules/lifecycle.md` § Phase 4 報告層 | `scripts/check-doc-freshness.js`（CTRL-0003/0004） |
| 文件一致性 | `docs/rules/lifecycle.md` § Phase 4 報告層 | `scripts/check-doc-consistency.js`（CTRL-0006） |
| 同步組 | `docs/rules/capabilities/sync-groups.md` | `scripts/check-sync.js` |
| 計畫同步 | `docs/rules/capabilities/plan-sync.md` | `scripts/check-plan-sync.js` |
| 發佈管控 | `docs/rules/capabilities/release-orchestration.md` | `scripts/release-manager.js` |
| 漂移巡檢 | 生成子技能 `drift-check` | 按模式調各腳本 |
| 程式碼變更歸位 / 殘留清理 | `docs/rules/coding.md` | Agent 判斷 |
| 證據分層 / 測試保護 | `docs/rules/testing.md` | Agent 判斷 |
| 工程克制 / 檔案行數 | `docs/rules/coding.md` | `scripts/check-file-size-budget.js` |
| 生命週期（6 階段） | `docs/rules/lifecycle.md` | Agent 流程 |
| 確定性初始化 | `docs/rules/capabilities/deterministic-init.md` | `scripts/generate-governance.js` |

上表列出的路徑均為**被治理專案**視角（INSTALLED 路徑）。完整義務分類見 `docs/rules/capability-enforcement.json`。

## 落地方式

治理不靠單一檔案。每個關切有三層，按需載入：

```
政策（讀）          腳本（跑）          任務卡（做）
docs/rules/*.md  →  scripts/*.js     →  docs/rules/capabilities/*.md
常駐規則正文          機械閘控 / 報告       有獨立步驟才有葉
```

- **政策**（`docs/rules/*.md`）：Agent 和人都讀的常駐規則。由 INIT 從 skill 的 `references/policies/` 複製。
- **腳本**（`scripts/*.js`）：零依賴 Node 閘控，CI 或 Agent 跑，退出碼即證據。由 INIT 從 skill 的 `scripts/` 複製。
- **能力葉**（`docs/rules/capabilities/*.md`）：只在任務有獨立步驟時存在（如確定性初始化、發佈編排、審計漂移）。不是功能總目錄——政策和腳本覆蓋的關切不一定有同名葉。
- **生成子技能**（`.governance/generated/skills/`）：INIT 生成的 Agent 模組，接管日常任務（巡檢、校驗、發佈、狀態記錄等）。

### 功能入口優先順序

| 誰 | 從哪進 |
| --- | --- |
| 被治理專案的 Agent | `AGENTS.md`（自動載入）→ `docs/rules/` → 生成子技能 |
| 開發者 | `scripts/` 命令列 · `docs/rules/` 規則 · `.governance/` 狀態檔案 |
| Skill 執行器 | `SKILL.md` 路由表（讀/跑兩列） |

## 下一步

- **安裝** → [skill-discovery.md](skill-discovery.md)
- **提示詞 / 子技能** → [commands.md](commands.md)
- **INIT 產出** → [bootstrap-output.md](bootstrap-output.md)
- **狀態模型** → [governance-model.md](governance-model.md)
- **防回歸** → [anti-regression.md](anti-regression.md)
- **本倉佈局** → [architecture.md](architecture.md)

---
