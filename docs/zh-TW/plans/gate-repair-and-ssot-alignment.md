# 閘門修復與單一事實源對齊（TASK 計劃）

[English](../../en/plans/gate-repair-and-ssot-alignment.md) · [简体中文](../../zh-CN/plans/gate-repair-and-ssot-alignment.md) · [繁體中文](gate-repair-and-ssot-alignment.md)

> **Status: implemented.**（狀態：已實作。）已在當前工作樹交付；發佈時歸檔。回應 2026-09-05 一次唯讀稽核：多個閘門存在但失效、接線錯誤或強於其聲稱——受保護文件簇解析出 0 行、`check:payload` 漏掉守護 payload 編輯的那個閘門、CI 只跑 6 個閘門中的 2 個、`plans:delivery` 不帶 `--gate` 執行、SKILL.md frontmatter `version` 永不被偵測、歸檔計劃攜帶非規範 Status 行。同次稽核還確認了五處單一事實源違規（三份相互矛盾的發佈流程、zh-CN/zh-TW 反向的未決聲明、無人消費的 README 模塊、殘缺的驗證器檢查清單、權限矩陣行不一致）。

**Target: both** —— `payload` 修復 INSTALLED 腳本行為（`scripts/check-doc-consistency.js`、`scripts/generate-governance.js`）與 `references/` 內容完整性（`references/templates/sub-skills.md`、`references/policies/governance-files.policy.md`、`SKILL.md`）；`repo-infra` 修復測試夾具、npm 接線、CI、倉庫文件與歸檔狀態。兩個域分別列在「受影響檔案」中。

### 任務目的

讓現有閘門集真正兌現 AGENTS.md 已宣稱的內容，並在稽核證實存在多重權威之處恢復單一事實源。對於已知規則完全沒有兜底的地方，添加成本最低的機械檢查並用反向測試證明——不超出發現所要求的新閘門類別。

### 當前問題（2026-09-05 確認）

- **受保護文件簇已失效。** `scripts/check-doc-consistency.js` 將政策表限定為 `policy.slice(0, policy.search(/\n## /))`；真實檔案中第一個 `## ` 標題（位元組 217）在表格（位元組 470）之前，因此 `protectedPaths` 恆為空，整個完備性迴圈從不執行。該簇唯一的反向測試使用無標題夾具，證明的是一條生產中從不執行的程式碼路徑。
- **範圍分級 npm 入口組合錯誤。** `check:payload`（文件指定給 `references/` + `SKILL.md` 編輯的檔位）漏掉了 `check-doc-consistency --gate`——即守護恰好位於這些檔案中的 consent 標記與受保護清單的閘門。`check:docs` 對稱地漏掉 `docs:layout`。兩者都與 AGENTS.md 範圍表矛盾。
- **CI 只跑 6 個閘門中的 2 個。** `.github/workflows/ci.yml` 只運行 `npm test` + `docs:parity`；layout、consistency、hygiene 與 role-completeness 從不使 CI 失敗。AGENTS.md 的「fails CI」表述目前不成立。
- **`plans:delivery` 從不設閘門。** `npm run plans:delivery` 不帶 `--gate` 執行 `check-plan-delivery.js`，所以 `check:all` 不強制計劃交付，儘管 AGENTS.md 與 release.md 都要求。
- **SKILL.md frontmatter `version:` 不可達。** 版本正則要求帶引號的 `"version"`/`"governance_version"` 形式；YAML 的 `version: 0.13.0` 永不匹配。三個版本同步點中有一個沒有任何機械兜底。
- **歸檔計劃攜帶非規範 Status 行。** `docs/archive/` 共 21 個檔案：僅 anti-patch-development 與 gate-tiering-evidence-boundary 攜帶 `Status: archived`；若干仍寫「已實現（待 Release 歸檔）」或「狀態：…」，5 個以上根本沒有 Status 行。plan-status 簇只掃描 `docs/*/plans/`，從不掃描 `docs/archive/`。
- **發佈流程標記存在三個覆蓋不一致的版本。** `references/workflows/release.md`（權威）攜帶 6 個需求標記；`references/templates/sub-skills.md`（安裝進被治理專案的副本）只帶 3 個——`docs.parity_passed`、`sync.passed`、`plan.delivery_verified` 缺失，release.md Phase 4 第 3 步（三個 release-gate）與第 11 步（打包與上傳）也不見。
- **zh-CN/zh-TW 架構頁斷言一個已過時、反向的事實。** 兩者都說角色完備閘門「保持紅色直到裁定——目前是 governance-files.policy.md 與 feature-doc.template.md」；英文頁說兩者已解決。`init-spec.json` 顯示 `undecided: {}`。
- **`.governance/README.md` 有兩個範本且 policy 那份是死的。** `governance-files.policy.md` § .governance/README.md 生成範本 定義了一個無人消費的 Tracked/Ignored 區塊；生成器實際輸出 `references/init-spec.json` 中的 `static content` 變體。
- **驗證器檢查清單在其安裝副本中殘缺。** `scripts/verify_governance.js` `DEFAULTS` 列出 21 項檢查，含 Lock check、Git policy、Git policy check、Secret scan gate、Sync groups check；`sub-skills.md` 的 `governance-validator` Checks 行只列產物類別，漏掉這五個工具檢查與 `.governance/git-policy.json`。
- **權限矩陣不一致。** `references/templates/agents-md.template.md` 攜帶「Modify 3+ Files at Once | confirmation required」行，而 `SKILL.md` § Agent Permission Model（索引中的權威）沒有，儘管該規則真實存在（`lifecycle.policy.md` § 規模分級）。

### 提議方案

#### A. 閘門修復（payload + repo-infra）

##### A1. 受保護文件解析器——在政策自身範圍內提取表格

將 `slice(0, search(/\n## /))` 視窗替換為提取政策**第一個內容段內部**的第一張 Markdown 表格（更簡單也更穩：解析檔案中第一張表格，其匹配落在引言段之後；不要在第一個 `## ` 標題處截斷，因為政策自己的標題先於其表格）。把現有反向測試夾具重塑為真實文件形態（標題 + 表格），使迴歸測試覆蓋生產路徑。單一事實源豁免保持限定在同一段。

##### A2. npm 範圍分級組合

使 `package.json` 與 AGENTS.md 範圍表一致：
- `check:docs` = test + parity + consistency `--gate` + layout
- `check:payload` = test + layout + consistency `--gate` + hygiene `--gate` + role-completeness `--gate`

##### A3. CI 接線

`.github/workflows/ci.yml` 增加一步執行 `npm run check`（全部 fail-closed 閘門）。`verify_governance.js` 徽章步驟保留 `|| true`（ADR-0006）。更新 AGENTS.md 相應表述以反映新事實（閘門在 CI 中執行）。

##### A4. `plans:delivery --gate`

將 `package.json` 的 `plans:delivery` 改為 `node scripts/check-plan-delivery.js --gate`，使 `check:all` 強制交付。

##### A5. SKILL.md frontmatter 版本檢查

擴展版本簇以解析 SKILL.md 的 YAML frontmatter 區塊（無引號 `version: X.Y.Z`）並與倉庫當前版本比對。反向測試：僅改 frontmatter → 閘門失敗。

##### A6. 歸檔計劃 Status 規範化

- 將每個 `docs/archive/*.md` 的 Status 行改寫為規範歸檔形式（`> **Status: archived.**（已歸檔。歸檔即斷言完成。）` 風格，按生命週期政策）。凡是承載交付資訊的舊狀態文字，作為嵌套說明保留（anti-patch-development 已是如此）。
- 擴展 plan-status 簇（或按凍結責任規則增加 archive-status 兄弟簇——優先擴展現有簇，因為同屬 plan-status 域）以掃描 `docs/archive/` 中缺失或非規範的 Status 行，`--release-gate` 時 fail-closed，配反向測試。

#### B. 單一事實源對齊（payload + repo-infra）

##### B1. 子技能發佈流程對齊

在 `references/templates/sub-skills.md` 中，將 release-manager 需求清單補至與 `release.md` 相同的 6 個標記，並恢復 Phase 4 第 3 步（三個 release-gate）與第 11 步（打包 + 上傳），措辭結構一致。新增一致性測試重現稽核的方法：從兩檔案提取標記集，斷言 sub-skills ⊇ release.md 的需求標記，fail-closed。

##### B2. zh-CN/zh-TW 架構未決聲明

將 `docs/zh-CN/architecture.md` 與 `docs/zh-TW/architecture.md` 中「當前是 X 與 Y」的過時句替換為已解決的事實（兩者現為 INSTALLED 產物；`undecided` 為空），與英文頁一致。

##### B3. 刪除無用的 README 模塊

刪除 `references/policies/governance-files.policy.md` § .governance/README.md 生成範本（或縮減為指向 `init-spec.json` 產物 `content` 的指針），保留政策的 tracked/ignored 表完好。為該節加入測試，斷言它不重複第二個 .governance/README.md 範本。

##### B4. sub-skills.md 驗證器檢查清單

補全 `governance-validator` Checks 行，使其按 `DEFAULTS` 順序列舉全部 21 項檢查（採用權威清單的格式；無計數漂移）。

##### B5. 權限矩陣行

將「Modify 3+ Files at Once | confirmation required」行補入 `SKILL.md` § Agent Permission Model，與 `references/templates/agents-md.template.md` 及 `lifecycle.policy.md` § 規模分級 一致。

### 已裁定不做 / 延後

- **C5 `.gitattributes` 機械校驗 —— 不做。** 存在性檢查證明不了內容（一個沒有 `text=auto eol=lf` 的 `.gitattributes` 照樣通過），內容校驗則越界成不成比例的機制；且該規則本身已聲明 INIT 不生成、被治理專案自行添加。機制測試不通過，維持散文規則。
- **C6 評審證據綁定 —— 本次只做誠實化，實質綁定延後。** `execute` 的 `reviewStatus` 是呼叫方提供的字串，`plan` 從不產出 `completed`，所以走到該分支的提案必然是手寫的——這正是 human-in-the-loop 的預期形態，但它校驗的是**聲明**而非「評審發生過」。本次僅讓 `execute` 明確列印該值為自證聲明（不再讓簽名標籤隱含「已評審」）。真正的綁定需要評審證據工件 + 評審工作流，屬於新機制，當前需求不足以獨立證成，另案處理。

### 驗證（證據等級）

- 每項修復都配備機械反向測試，能在真實檔案/真實夾具上重現原始失效模式（測試證明閘門能變紅——不只是它是綠的）。
- `npm test`（全部套件）+ `npm run check` + `npm run check:all` 退出 0。
- plan-status/archive-status 簇的 release-gate 行為用變異副本以 `--release-gate` 驗證。
- 除 plan-status 擴展外不新增閘門類別；責任表其餘不變。

### 受影響檔案

**payload（INSTALLED / SKILL-INTERNAL 行為與內容）：**

- `scripts/check-doc-consistency.js` —— A1（受保護文件表格提取）、A5（frontmatter 版本）、A6（archive-status 掃描）
- `scripts/generate-governance.js` —— A5 僅核實：哨兵已與 package.json / init-spec 一致（0.13.0），無需改動。
- `references/templates/sub-skills.md` —— B1（發佈流程標記 + Phase 4 步驟）、B4（驗證器檢查清單）
- `references/policies/governance-files.policy.md` —— B3（無用 README 模塊移除）
- `SKILL.md` —— B5（權限矩陣行）；版本 frontmatter 必須保持同步（A5）

**repo-infra（docs、測試、接線）：**

- `package.json` —— A2（範圍分級組合）、A4（`plans:delivery --gate`）
- `.github/workflows/ci.yml` —— A3（執行 npm run check）
- `AGENTS.md` —— A3 措辭、A2 表格核對（已正確——僅核實）
- `docs/en/architecture.md` —— B2（陳舊工件計數措辭；該修復涉及三語樹）
- `docs/zh-CN/architecture.md` —— B2
- `docs/zh-TW/architecture.md` —— B2
- `docs/archive/` —— A6：21 份歸檔計劃的 Status 行全部規範化（目錄級改動，非單檔案）
- `tests/suites/consistency.test.js` —— A1 夾具重塑、A5 反向測試、A6 反向測試、B1 標記集測試
- `tests/suites/docs.test.js` —— A2 組合測試（package.json 入口等價）
- `tests/support/helpers.js` —— 未改動：新夾具助手只被單個套件使用，提取進共享層屬於過早抽象（工程克制）。
- `CHANGELOG.md` —— 發佈條目
