# Roadmap

[English](en.md) · [简体中文](zh-CN.md) · [繁體中文](zh-TW.md)

## 願景

AI Agent Governance 的目標不是為 AI 編碼 Agent 堆疊更多提示詞、規則文件和檢查腳本，而是建立一套：

- 倉庫原生
- 工具中立
- 可驗證
- 可追蹤
- 可漸進採用
- 可擴展到不同 Agent runtime

的治理框架。

長期目標是讓治理從：

```text
文件聲明
    ↓
Agent 閱讀並記住
    ↓
Agent 自行判斷適用規則
    ↓
Agent 自行選擇檢查命令
    ↓
腳本回傳 exit code
```

演進為：

```text
Machine-readable Controls
        ↓
Context Detection
        ↓
Applicability Resolution
        ↓
Dispatcher
        ↓
Evaluator / Mechanism
        ↓
Evidence
        ↓
Decision
        ↓
Explicit Enforcement Boundary
```

治理系統應盡可能減少對 Agent 注意力、記憶和自覺性的依賴。

## 當前狀態：v2.0.0（Generation 2 必裝切片）

目前產品是 **`v2.0.0`**：可安裝、可在乾淨目標上直接使用的 INSTALLED 必裝切片。CI 阻斷權威是 `npm run check:must-ship`。Migration Mode 已退出；`main` 就是 2.0 產品線。權威：[ADR-0024](../../design-decisions/ADR-0024-gen2-product-freeze.md) · [ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md)。

這 **不是**「Generation-1 限制已消失」。2.0 把已驗證的控制面接到可發佈 skill 上；底層仍大量是文件 + 腳本 + WRAP 後的 checker。Generation 1 的六條限制仍描述剩餘架構債，只是不再擋住已發佈的必裝面。

Generation 1（1.x）仍是歷史基線，具備：

- INIT / AUDIT / RELEASE 生命週期
- 確定性治理生成器
- 治理檔案與狀態管理
- Git / release policy
- secret scanning
- sync checking
- documentation consistency
- release management
- plan delivery verification
- review-manager
- 多語言產品文件
- regression test suites
- repo / payload 物理分發邊界

Generation 1 已證明：

> AI 編碼治理可以透過倉庫內文件、腳本、測試、CI 與 release workflow 獲得比純 Prompt 更強的約束能力。

但當前架構仍以：

```text
Markdown / SKILL / AGENTS
        +
npm scripts
        +
independent checkers
```

為主要控制方式。

其機械能力已經明顯超過最初設計模型能夠清楚表達和調度的範圍。

## Generation 1 的主要限制

已知限制引用自 `docs/findings/`（FINDING-0001..0019），此處不複述；Roadmap 只保留影響長期方向的結論。

具體證據、缺陷和研究記錄由 `docs/findings/` 與 `docs/research/` 管理；Roadmap 只保留影響長期方向的結論。

### 1. Producer Governance 與 Product Governance 邊界不清

本倉庫自身的治理與分發給使用者的 Skill Governance 已經在物理分發層面分離，但在治理語意、checker ownership 和 shared rules 上仍存在隱式耦合。

當前部分規則仍表現為：

```text
repo
skill
both
```

這種模型無法清楚回答：

- 誰擁有規則語意
- 誰負責執行
- 哪些實作必須同步
- 哪些控制只屬於倉庫
- 哪些控制屬於被治理專案

這是 Generation 2 的首要架構問題。

### 2. Policy Declaration 與 Enforcement 分離

大量規則仍主要存在於 Markdown、SKILL、AGENTS 或 policy 文件中。

系統通常依賴 Agent：

1. 閱讀規則
2. 判斷規則是否適用
3. 記住需要執行什麼
4. 選擇正確 gate
5. 正確解讀結果

因此：

```text
MUST
```

並不天然意味著：

```text
deny
```

聲明強度與實際 enforcement strength 尚未形成統一模型。

### 3. Trigger 依賴 Agent 注意力

本地治理通常仍是：

```text
Agent
  ↓
決定是否執行檢查
```

而不是：

```text
Context
  ↓
系統自動確定 applicable controls
```

這意味著部分治理保證依賴 Agent 的注意力與上下文完整性。

### 4. Validation Routing 不夠精確

當前已經存在不同 gate scope，但整體仍以 npm script / suite 為中心。

系統尚不能穩定從：

```text
change impact
```

推導：

```text
minimal required controls
```

因此可能出現：

- 簡單變更執行過多驗證
- 複雜變更遺漏真正相關的控制
- CI 執行範圍過粗
- 本地驗證範圍依賴 Agent 判斷

### 5. Checker 與測試仍以歷史缺陷驅動增長

Generation 1 中大量可靠性來自：

```text
incident
→ patch
→ checker
→ regression test
```

這種方式非常適合保護已知缺陷，但長期容易造成：

- checker 增殖
- regex / structural heuristic 堆積
- governance machinery 自身複雜化
- 綠色測試數量與真實控制成熟度脫節

Generation 2 需要從 checker-centric 轉向 control / invariant-centric。

### 6. Enforcement Boundary 尚未統一

當前治理強度分佈在：

```text
Prompt
Git hooks
local scripts
CI
release workflow
human approval
```

這些機制的阻斷能力不同，但尚未被統一描述。

尤其：

- Git hook 可繞過
- CI 只能在提交後阻斷
- Prompt 只是 guidance
- runtime interception 依賴具體 Agent 工具

因此未來必須明確：

```text
規則在哪個 boundary 上生效？
```

## Generation 2 目標架構

Generation 2 的目標不是重寫所有現有機制，而是給現有成熟能力建立統一控制平面。

目標模型：

```text
Governance Core
│
├── Control / Rule Model
├── Applicability Model
├── Evidence Model
├── Decision Semantics
├── Shared Primitives
└── Contracts
        │
        ├───────────────┐
        ▼               ▼
Repo Governance      Skill Governance
Profile              Profile
        │               │
        └───────┬───────┘
                ▼
          Context Detector
                ↓
            Dispatcher
                ↓
      ┌─────────┼──────────┐
      ▼         ▼          ▼
 Mechanical  Heuristic   Review
 Evaluator   Evaluator   Evaluator
      └─────────┬──────────┘
                ↓
             Evidence
                ↓
             Decision
                ↓
 allow / deny / warn / require-review
```

> 註：上圖 Governance Core 組成（Control / Rule Model、Applicability Model、Evidence Model、Decision Semantics、Shared Primitives、Contracts）是**目標架構示意**，不是 Phase 3 schema 決策；確切歸屬（Core vs profile）與 machine-readable schema 由 Phase 3 決定（ADR-0018 Phase 邊界紀律；ADR-0020）。

## Generation 2 開發階段（遷移路徑，已關閉）

Roadmap 不獨立定義或裁決 phase order。下表鏡像 ADR-0018 的 **已關閉** 遷移 projection。2.x 工作帶鏡像 [ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md)，見後文。

| Phase | 名稱（ADR-0018） | 一句話成果 |
| --- | --- | --- |
| 0 | Architecture Migration Mode | 安全而不阻塞的重構環境（gate 觀測化、Safety Kernel 阻斷） |
| 1 | Producer / Product Separation | repo/skill ownership 邊界明確，`scope = both` 架構性退役（殘留保留，FINDING-0001） |
| 2 | Research / Findings / Traceability | 系統模型 → 觀察到的問題 → 溯源閉環 |
| 3 | Governance Core / Rule Model | shared semantics, separate profiles |
| 4 | Checker / Primitive restructuring | 成熟 checker → 可重用 primitive + evidence |
| 5 | Dispatcher | context detection → applicability → mechanical / heuristic / review |
| 6 | Invariant-based Testing | 每個 control 有 positive + negative oracle |
| 7 | Review System redesign | Implementation / System / Research 三類 review |
| 8 | Rebuild mandatory gates | 在新 control plane 上重建阻斷權威 |

權威：ADR-0018（`docs/design-decisions/ADR-0018-generation-2-dev-path.md`）。

**遷移階段已關閉：** Phase 0–8 EXITED；**`v2.0.0` 已發佈**（2026-09-12）。Plan archive ≠ Release（ADR-0016）。**目前工作帶 = ADR-0025 H1**（[PLAN-0037](../PLAN-0037-governance-skill-extraction.md) **Active**）。H0（[PLAN-0045](../archive/PLAN-0045-post-2.0-doc-truth.md)）已歸檔。

## 2.0 已發佈（索引）

Roadmap 只列順序與施工計劃，不複製 Plan 步驟 / Affected Files / 驗收命令。遷移順序權威：ADR-0018。2.x 順序權威：ADR-0025。產品切片：ADR-0024。提煉邊界：ADR-0020 / PLAN-0037。

### 已完成（checkpoint）

| Phase | 施工計劃 | 狀態 |
| --- | --- | --- |
| 0 | ADR-0014 Migration Mode | **已退出**（2026-09-12）；CI 阻斷 = `check:must-ship` |
| 1 | [PLAN-0031](../archive/PLAN-0031-producer-product-governance-separation.md) | Archived |
| 2 | [PLAN-0032](../archive/PLAN-0032-documentation-knowledge-architecture-closure.md) · [PLAN-0033](../archive/PLAN-0033-known-issue-closure.md) | Archived |
| 3 | [PLAN-0034](../archive/PLAN-0034-governance-core-rule-model.md) · ADR-0023 | Archived；baseline `24021c4` |
| 4 | [PLAN-0035](../archive/PLAN-0035-checker-primitive-restructuring.md) · [PLAN-0036](../archive/PLAN-0036-payload-discovery-ledger.md) | Implemented / EXITED |
| 5 | [PLAN-0038](../archive/PLAN-0038-task-capability-routing.md) · [PLAN-0039](../archive/PLAN-0039-context-detector-dispatcher.md) · [PLAN-0040](../archive/PLAN-0040-capability-physical-projection.md) | Implemented / EXITED（5a 圖 · 5b resolve/CLI · 5c P0–P2 投影；leftover 延後） |
| 6 | [PLAN-0042](../archive/PLAN-0042-invariant-based-testing.md) | Implemented / EXITED（oracle 台帳 + 路由負向 + 種子 CTRL；全量機械規則仍延後） |
| 7 | [PLAN-0043](../archive/PLAN-0043-review-system-redesign.md) | Implemented / EXITED（Impl must-ship；System/Research repo-keep；路由 N4） |

### 發佈記錄

| 項 | 狀態 |
| --- | --- |
| 8 重建 mandatory gates | [PLAN-0044](../archive/PLAN-0044-rebuild-mandatory-gates.md) Implemented / EXITED |
| 2.0 skill-release | **已發佈** `v2.0.0`（清單：[skill-release-2.0-checklist.md](../archive/skill-release-2.0-checklist.md) 歷史） |

[PLAN-0037](../PLAN-0037-governance-skill-extraction.md) **已解凍為 Active**（2026-09-12）。過濾邊界仍約束提煉產物：禁止把本倉目錄 / CTRL 號 / Phase 劇本当 L1。

Phase 5 已 EXITED（索引自 PLAN-0035 / `call-topology.md`，非新裁決）：**5a** 顯式映射 → **5b** Dispatcher → **5c** 按 Capability 投影（只改 `AuthorityRef`）。殘留葉 / 可選 rename **不**重開 Phase 5。紀律：`docs/research/working/routing/call-topology.md` § 物理拓撲。

## 2.x 工作帶（索引 ADR-0025）

Roadmap 不裁決順序。成員來自 ADR-0024 `later`；順序來自 ADR-0025。施工只走 Active Plan。

| 帶 | 一句話 | 施工 | 狀態 |
| --- | --- | --- | --- |
| **H0** 文件與生命週期對帳 | 入口/路線圖/計劃位置與 `v2.0.0` 對齊 | [PLAN-0045](../archive/PLAN-0045-post-2.0-doc-truth.md) | **Archived**（九份 Phase 4–8 計劃已歸檔） |
| **H1** 可重用治理 Skill 提煉 | L1/L2/L3 提取協議 → 乾淨目標驗證 | [PLAN-0037](../PLAN-0037-governance-skill-extraction.md) | **Active** |
| **H2** 控制面補完 | 殘留抽出 → 檢查器/台帳 → 機器 Control / CONTROL-X → 載荷調度與可移植性 | 另開 Plan；輸入見下表 | 未開工 |
| **H3** 執行期與科研 | L3、測量、注意力實驗；不擋 2.1 | 無 Active Plan | 遠 |

### H0 已完成

已歸檔 PLAN-0035 / 0036 / 0038–0044 與 PLAN-0045；`mode-exit-proposal` / `skill-release-2.0-checklist` 移入 `docs/plans/archive/`。`docs/plans/` 當前施工計劃僅 [PLAN-0037](../PLAN-0037-governance-skill-extraction.md)。

### H2 輸入（按子帶；不擋已發佈的 2.0）

| 子帶 | 索引（Finding / 殘留，非施工步驟） |
| --- | --- |
| H2a 殘留抽出 | 5c leftover Capability 葉 · [FINDING-0029](../../findings/FINDING-0029-lifecycle-name-concept-drift.md) · [FINDING-0028](../../findings/FINDING-0028-script-generation-disposition-gap.md)（L0 台帳 = [PLAN-0041](../archive/PLAN-0041-script-inventory.md)） |
| H2b 檢查器與台帳 | 剩餘 consistency clusters · principles-index #9 · [FINDING-0011](../../findings/FINDING-0011-adr-status-false-positive.md) · [FINDING-0019](../../findings/FINDING-0019-check-doc-consistency-meta-checker-monolith.md) · [FINDING-0021](../../findings/FINDING-0021-roadmap-checker-vacuous.md) · Discovery Ledger L2 · [FINDING-0022](../../findings/FINDING-0022-recursive-discovery-workset-gap.md) · [FINDING-0024](../../findings/FINDING-0024-metadata-projection-drift.md) · ADR-0016 parser 遷移 |
| H2c 跨 profile / 機器 Control | [FINDING-0001](../../findings/FINDING-0001-producer-product-governance-coupling.md) CONTROL-X · [FINDING-0002](../../findings/FINDING-0002-missing-governance-control-plane.md) · [FINDING-0025](../../findings/FINDING-0025-governance-sync-mapping-gap.md) · [FINDING-0026](../../findings/FINDING-0026-templates-instruction-source-mix.md) |
| H2d 載荷調度與可移植性 | [FINDING-0003](../../findings/FINDING-0003-declaration-enforcement-gap.md) 判斷型 MUST · [FINDING-0004](../../findings/FINDING-0004-trigger-coverage-gap.md) · [FINDING-0005](../../findings/FINDING-0005-validation-routing-overhead.md) · [FINDING-0006](../../findings/FINDING-0006-regression-oracle-gap.md) 全量 oracle · [FINDING-0007](../../findings/FINDING-0007-portability-enforcement-boundary.md) adapter · [FINDING-0010](../../findings/FINDING-0010-gitlab-ci-stack-template-mismatch.md) · [FINDING-0012](../../findings/FINDING-0012-lock-not-atomic.md) · Git consent 機械 evaluator · MIGRATE 入口 · [FINDING-0014](../../findings/FINDING-0014-review-manager-layer-mismatch.md) L0–L4 工具 · [FINDING-0016](../../findings/FINDING-0016-canonical-example-not-constraint.md) · [FINDING-0017](../../findings/FINDING-0017-adr-no-continuous-enforcement.md) |

### H3 輸入（遠；不擋 2.1）

[FINDING-0008](../../findings/FINDING-0008-governance-measurement-gap.md) 測量 · [FINDING-0015](../../findings/FINDING-0015-static-prompt-attention-burden.md) 靜態 vs 注入 · L3 執行期攔截 · 完整 `activity.jsonl`。

### 本倉 vs 2.x 產品

- **本倉**：實驗場 + 參考實作 + 科研回溯（[RESEARCH-0013](../../research/RESEARCH-0013-research-provenance-and-context-economy.md)）。
- **已發佈 skill（2.0）**：可安裝必裝切片，不是 PLAN-0037 另開通用包。
- **2.x 產品主線（H1）**：[PLAN-0037](../PLAN-0037-governance-skill-extraction.md) **Active** — 把已驗證原則提煉為可重用 skill。

## Guarantee Levels

Generation 2 逐步明確治理保證等級：

```text
L0 — Guidance
     Agent-readable instruction

L1 — Repository Mechanical
     Repository checker can independently verify

L2 — Workflow Blocking
     CI / Git / release workflow can block progression

L3 — Runtime Interception
     Agent runtime can intercept the action before execution
```

任何治理能力都不應僅用「支援 / 不支援」描述，而應明確其 guarantee level。

## Research Direction

專案後續不僅評價「實現了多少功能」，還要研究治理機制是否真正有效。

重點研究問題包括：

### Zero-Attention Governance

如果 Agent 完全忘記治理規則：

> 哪些保證仍然成立？

任何被稱為 mechanical guarantee 的能力都應該能回答這個問題。

### Static Prompt vs Dynamic Policy Injection

研究：

```text
靜態上下文規則
vs
決策點動態注入
```

對以下指標的影響：

- attention failure
- token burden
- compliance
- task quality

### Full Validation vs Impact-Driven Validation

比較：

```text
full suite
vs
dispatcher-selected controls
```

在以下指標上的差異：

- runtime
- detection rate
- false negative
- developer latency

### Enforcement Strength

研究不同 boundary：

```text
Prompt
Hook
CI
Release
Runtime
```

在真實 Agent workflow 中提供的實際保證強度。

### Governance Operating Cost

治理成熟度必須同時衡量成本。

長期指標包括：

```text
Runtime cost
Token burden
Human review cost
Maintenance cost
False positive rate
False negative rate
Attention failure rate
```

## Non-goals

Generation 2 明確不追求：

- 不繼續透過無限增加 Markdown policy 解決所有治理問題
- 不為每一個 incident 建立新的永久 checker
- 不把所有 judgment rule 強制機械化
- 不假設 green gate 等於語意正確
- 不追求所有 Agent runtime 完全相同
- 不把 tool-specific runtime 能力寫入 portable core
- 不為目錄、規則或抽象的形式對稱性增加無實際價值的機制
- 不以測試數量、checker 數量或規則數量衡量成熟度
- 不讓治理框架自身的複雜度增長成為預設方向
- 不為了保持 Generation-1 相容而長期維護兩套架構
- 不以正式 Release 標記已關閉的遷移 Phase 完成（ADR-0014 歷史紀律；Mode 已退出）
- 不把 ADR-0024 `later` 扁平清單當作施工順序（順序權威 = ADR-0025）
- 不跳過 Stage A–D 一次抽象出 portable skill
- 不把本倉目錄名 / CTRL 號 / Phase 劇本当 L1

## Success Criteria

Generation 2 成功不以「新增多少能力」為主要標準。2.0 門檻已在 `v2.0.0` 滿足。下列長期標準 **不是** 每一次 2.x tag 的門檻；2.x 驗收面由當時 Active Plan 寫，預設不把 H3 / CONTROL-X / PLAN-0037 全文綁死（[ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md) 決策 8）。

更重要的是：

```text
Policy can be mechanically located.
Applicability can be systematically resolved.
Execution can be dispatched without relying on Agent memory.
Evidence can be independently inspected.
Enforcement strength can be explicitly stated.
Critical controls have negative oracles.
Repo and Skill governance ownership is explicit.
Validation cost scales with change impact.
Runtime-specific enforcement remains outside the portable core.
```

長期目標是：

> 用更少的 Agent 注意力、更少的治理機制和更清晰的執行邊界，獲得更強、更可解釋、更可驗證的治理保證。

## Roadmap 與其他知識對象的關係

Roadmap 只表達長期方向，不承擔詳細問題記錄或執行計畫。

```text
Research
   ↓ provides model

Findings
   ↓ identify observed gaps

ADR
   ↓ records architectural decisions

Roadmap
   ↓ defines long-term direction

Plan
   ↓ executes a bounded phase

Implementation
   ↓

Measurement / Regression
```

具體問題進入：

```text
docs/findings/
```

系統模型、實驗和評價框架進入：

```text
docs/research/
```

長期設計決策進入：

```text
docs/design-decisions/
```

具體執行工作進入：

```text
docs/plans/
```

已完成執行計畫進入：

```text
docs/plans/archive/
```

## Roadmap 維護規則

Roadmap 是當前長期方向的聲明，不是不可修改的承諾。

在以下事件發生時重新評估：

- architecture generation transition
- major architecture finding
- major phase completion
- research evidence 推翻現有假設
- target architecture 發生實質變化

普通 patch、bug fix 或 release 不要求自動重排 Roadmap。

重大方向變化必須能夠追溯到：

```text
Finding
Research
ADR
```

Roadmap 不保存詳細歷史執行記錄，也不作為 CHANGELOG 使用。

舊路線如果具有研究價值，透過 Git history 或明確的 roadmap history snapshot 保留，而不是讓當前 Roadmap 無限累積「已完成事項」。

## 當前長期方向

```text
Generation 1 — Document-Centric Governance
        ↓
  Generation 2 migration（ADR-0018 Phase 0–8）
        ↓
P0–P7  checkpoint EXITED
         P6 = PLAN-0042（oracle 台帳 + 路由負向 + 種子 CTRL）
         P7 = PLAN-0043（Review 三類；Impl must-ship）
P8     Rebuild mandatory gates — EXITED（PLAN-0044）
        ↓
v2.0.0 skill-release — **已發佈**（2026-09-12）
        ↓
H0     文件與生命週期對帳 — EXITED / Archived（PLAN-0045）
        ↓
H1     PLAN-0037 跨專案 portable 提煉 — **current / Active**
        ↓
H2     控制面補完（ADR-0024 later 機械債）
        ↓
H3     執行期與科研（L3 / 測量；不擋 2.1）
        ↓
Generation 2 — Policy-Driven Governance Control Plane + reusable method
```
