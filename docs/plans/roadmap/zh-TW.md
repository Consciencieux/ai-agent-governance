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

## 當前狀態：Generation 1

當前穩定版本屬於 **Generation-1 Document-Centric Governance**。

它已經具備較完整的治理能力，包括：

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

## Generation 2 開發階段

### Phase 0 — Architecture Migration Mode

目的：

> 為 Generation-1 → Generation-2 的架構遷移建立安全但不至於過度阻礙重構的開發環境。

遷移期間：

- Generation-1 大部分 gate 降級為觀察性證據
- 不再擴展舊 checker / policy 體系，除非涉及安全、資料損失或 release corruption
- 使用 targeted validation 與 architecture checkpoint
- 保留最小 Refactor Safety Kernel
- 禁止正式發佈不完整的 2.0 架構
- `main` 保持 1.x stable baseline
- 破壞性重構在 `migration/2.0-governance-architecture` 上進行

退出條件：

- 新控制架構具備可執行基線
- 關鍵 Generation-1 regressions 已遷移
- 新 release path 可以獨立證明完整性

### Phase 1 — Producer / Product Governance Separation

這是 Generation 2 的第一項核心架構工作。

目標：

```text
Governance Core
      │
 ┌────┴────┐
 ▼         ▼
Repo       Skill
Profile    Profile
```

重點解決：

- repo governance 與 skill governance ownership
- 清理模糊的 `scope = both`
- 共享語意與具體實作分離
- shared control 明確消費者
- repo-only 與 skill-only control 獨立
- cross-profile contract tests

原則：

> Shared semantics does not imply shared implementation.

產品程式碼可以成為測試對象，但本倉庫關鍵治理不能完全依賴正在被修改的 working-tree 產品實作。

### Phase 2 — Governance Core

建立中立的 Governance Core。

Core 負責：

- control identity
- control schema
- evaluator contracts
- evidence semantics
- decision semantics
- shared primitives
- profile contracts

Core 不直接決定某個規則是否屬於 repo 或 skill。

Profile 決定：

- applicability
- implementation
- enforcement boundary
- runtime adapter
- profile-specific policy

### Phase 3 — Rule / Control Registry

把治理執行語意從 Markdown 中抽離為 machine-readable controls。

最小控制模型需要明確區分：

```text
Applicability
Evaluator Type
Mechanism
Effect
Enforcement Boundary
```

Evaluator 類型包括：

```text
mechanical
heuristic
review
guidance
```

Decision effect 包括：

```text
allow
deny
warn
require-review
observe
```

二者不能混為同一維度。

Markdown 繼續承擔：

- rationale
- explanation
- examples
- human-readable policy

但不再作為唯一執行事實來源。

### Phase 4 — Checker Primitives 與 Evidence Model

不刪除成熟 checker，而是重新定位。

現有 checker 中穩定、可靠的能力應逐漸抽象為 reusable primitives，例如：

```text
required-file
forbidden-pattern
structured-value
cross-file-equality
projection-sync
command-result
negative-oracle
package-boundary
```

每個執行結果產生結構化 Evidence，而不是僅剩：

```text
exit 0
exit 1
```

Evidence 應能夠回答：

- 哪個 control 被執行
- 為什麼適用
- 使用了什麼 mechanism
- 檢查了什麼對象
- 得到什麼結果
- 哪個 boundary 使用了該結果

### Phase 5 — Context Detector 與 Dispatcher

這是 Generation 2 控制平面的核心執行層。

目標：

```text
Event / Change Context
        ↓
Context Detector
        ↓
Applicable Controls
        ↓
Dispatcher
        ↓
Minimal Required Mechanisms
```

系統應逐漸從：

```text
Agent chooses npm command
```

遷移到：

```text
System resolves required controls
```

Dispatcher 應支援：

- file / path impact
- control ownership
- profile
- lifecycle event
- release context
- explicit task context

並以最小充分驗證為目標，而不是預設全量執行。

### Phase 6 — Invariant-Centric Testing

測試體系從 suite 數量轉向 control protection。

重要 mechanical control 應具備：

```text
positive oracle
+
negative oracle
```

核心指標逐步轉向：

- declared control count
- executable carrier coverage
- negative oracle coverage
- trigger coverage
- blocking boundary coverage
- false positive rate
- false negative rate

測試數量本身不再作為治理成熟度代理指標。

### Phase 7 — Review Architecture

現有 review-manager 保留並重新定位為：

**Implementation Review**，關注：

- logic bug
- test weakness
- security
- regression
- fixture realism
- checker correctness
- documentation inconsistency

同時增加：

**System Review**，關注：

- responsibility boundaries
- control topology
- duplication
- architecture coherence
- trigger / enforcement gaps
- governance complexity
- producer / product coupling

以及：

**Research Review**，關注：

- hypotheses
- measurements
- experimental validity
- false positive / false negative
- attention dependence
- long-term effectiveness

系統性 review 預設：

```text
Find
→ Collect Evidence
→ Classify
→ Search Siblings
→ Determine Root Cause
→ THEN Remediate
```

避免直接把所有問題降級為局部 patch。

### Phase 8 — Runtime Adapters

Repository-level governance core 必須保持工具中立。

執行時 hard enforcement 透過 adapter 層實現：

```text
Portable Governance Core
        ↓
Adapter Protocol
        ↓
Codex
Claude Code
Cursor
opencode
Other runtimes
```

可能支援：

```text
before_write
before_shell
before_commit
before_release
```

但 runtime-specific enforcement 不得污染 portable core。

不同執行時可以提供不同 guarantee level。

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

## Success Criteria

Generation 2 成功不以「新增多少能力」為主要標準。

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
Generation 1
Document-Centric Governance
        ↓
Architecture Migration
        ↓
Producer / Product Separation
        ↓
Governance Core
        ↓
Control Registry
        ↓
Evidence + Primitives
        ↓
Context Detector + Dispatcher
        ↓
Invariant-Centric Validation
        ↓
Review Architecture
        ↓
Runtime Adapters
        ↓
Generation 2
Policy-Driven Governance Control Plane
```
