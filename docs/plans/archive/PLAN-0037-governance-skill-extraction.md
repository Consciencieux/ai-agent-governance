---
id: PLAN-0037
status: Archived
generation: gen2
target: both
---

# PLAN-0037：可复用治理 Skill 提炼（Governance Skill Extraction）

**解冻记录（2026-09-12）**：人类解冻（「归档，解冻」）。Gate 1–3 已满足；[ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md) H1 现为当前产品主线。过滤层约束仍生效：禁止把本仓 `docs/`、CTRL 编号、Phase 剧本当 portable invariant。按提取协议 Stage A→D 施工，禁止一次抽象出 skill。

**闭包记录（2026-09-13）**：Stage C/D 完成。可复用原则包落地为 `references/principles/`（SKILL-INTERNAL）；干净目标表征见 `tests/suites/principles-extraction.test.js`（4/4）。X2 关闭。exit review 通过 → **Archived**。未改写 INSTALLED 规则面；未发布平行 skill 包；未迁脚本载体。

将 `ai-agent-governance` 中**已验证**的 Gen2 治理原则提炼为可复用 Agent Governance Skill，并显式划分 **L1 invariants / L2 patterns / L3 project customization**。权威边界见 ADR-0020（2026-09-10 修正）。

## 目标

```text
本仓库（实验场 + 参考实现）
        ↓ 验证 Gen2（含 Phase 5 Task→Capability routing）
        ↓ 提炼不可变原则（L1）与推荐模式（L2）
        ↓ 形成可复用 governance skill
        ↓ 治理其他项目（L3 由目标项目定制）
```

**一句话：** 把已验证的 Gen2 治理原则提炼为可复用 skill，并定义哪些内容属于 invariant、哪些属于 project customization。

## 范围（In）

- Instruction architecture（thin entry · progressive disclosure · Context Economy）
- Document type boundaries（Research / Finding / ADR / Plan · Policy/Workflow/Template）
- Metadata governance（封闭 schema · budget）
- Canonical ownership（单事实单 owner）
- Capability-based organization
- Routing contract（Task → Capability → Authority → Execution → Verification）
- Discovery disposition 语义（可追踪 + disposition + closure；**不**强制本仓表列 schema）

## 非目标（Out）

```text
创建「万能 AI 治理 Skill」或通用治理平台
复制本仓 docs/ 树 / 全部 ADR·Finding·Research
硬编码本仓目录名、CTRL-NNNN、Phase 0–8 / PLAN-003x 剧本
实现自动治理系统 / 全自动 Dispatcher / 知识图谱
现在立刻改写 INSTALLED 载荷规则面或新建平行 skill 包并发布
把未验证的 Phase 5 早期模型固化进 skill
清理 / 删除 / 整夹隔离 Gen1 脚本（ADR-0025 决策 9–10）
给 check-doc-consistency.js 加规则、例外或 flag（属 H2b）
把本仓 router 写入 INSTALLED 默认面（属 H2d）
把本仓 AGENTS.md / SKILL.md 瘦身当作本计划完成条件
新建「Gen1 能力 → 2.x 去向」权威表（消费 script-inventory，不另建 ledger）
```

## 前置条件（Gate — 转 Active 前须满足）

1. Phase 4 EXITED（PLAN-0035 / PLAN-0036）— **已满足**（已归档）
2. Phase 5 **Task→Capability routing** 已验证（RESEARCH-0012 → PLAN-0038 → 5b Dispatcher）— **已满足**（Phase 5 EXITED）
3. Phase 8 阻断权威已交接，且已退出 Migration Mode / 完成 2.0 skill-release — **已满足**（`v2.0.0`）
4. ADR-0020 L1/L2/L3 分层仍为 Accepted；无 Narrow 撤销 — **仍成立**

## 最终状态（2026-09-13）

| Stage | 状态 | 权威 / 说明 |
| --- | --- | --- |
| A — L1 invariants | **done** | ADR-0020 § L1；不另建 skill 侧重复清单 |
| B — L2 patterns | **done** | ADR-0020 § L2；不另建 RESEARCH 过程稿 |
| C — Skill 结构落地 | **done** | `references/principles/{entry,+6}.md`；SKILL-INTERNAL；`SKILL.md` 薄指针 |
| D — 干净目标验证 | **done** | `tests/suites/principles-extraction.test.js` 4/4：tarball 含原则包；INIT 不安装；反模式契约 |

2026-09-13 级联 unwind（`be0d079`）：撤回 RESEARCH-0014、`working/`、Plan 百科与 repo-tools 施工 md。Stage A/B 以 **ADR-0020** 为唯一 L1/L2 权威。

## 执行阶段（摘要）

### Stage A / B

交付权威：ADR-0020 § L1 / § L2。禁止为 Stage 产物新建 `RESEARCH-xxxx` 或 `working/`。

### Stage C — Skill 结构（载荷形状，非 docs/ 拷贝）

```text
references/principles/          # SKILL-INTERNAL（随包；INIT 不写目标）
  entry.md                      # 薄入口 + L1 总表
  instruction-architecture.md
  document-model.md
  metadata-policy.md
  capability-model.md
  decision-records.md
  migration-method.md
```

每个专题文件 internally 分：**Hard Rules / Recommended Patterns / Project Customization**。

### Stage D — 验证证据

- 打包：`repo-tools/package-skill.sh` → tarball 含全部 principles 文件
- INIT：干净目标无 `principles/`、无专题 basename 泄漏
- 契约：五类失败模式（metadata 膨胀 / 入口百科 / 类型混用 / 规则多处复制 / 启动全量读树）+ Facts→Rationale→Pattern 协议有正文锚点
- 套件：`node tests/run-tests.js --suite principles-extraction` → 4/4

## Domain sync（Target: both）

| Domain | 同步点 |
| --- | --- |
| payload | `references/principles/*`；`references/init-spec.json` skillInternal；`SKILL.md` 指针；architecture ×3 |
| repo-infra | characterization suite；CHANGELOG；roadmap 索引；本计划归档 |

## 完成条件

- [x] 前置条件全部满足后才曾转为 Active（含 2.0 / Phase 8）
- [x] L1 invariants 成文（ADR-0020 § L1）且与分层一致
- [x] L2 / L3 边界显式（ADR-0020）；无本仓目录/CTRL/Phase 剧本硬编码进 L1
- [x] Facts / Rationale / Patterns 有审查记录（ADR-0020 2026-09-10 修正 + 前置 Research）；无「一次抽象」独立文件交付
- [x] Skill 结构落地并可打包（Stage C：`references/principles/`）
- [x] Stage D 干净目标验证有真实证据（`principles-extraction` 4/4）
- [x] Discovery Ledger：Open=0
- [x] 未越权实现「万能平台」或自动治理系统
- [x] 未把脚本清理、INSTALLED routing、本仓入口瘦身或第三份能力去向表当作本计划交付（ADR-0025 决策 9–13）

## 受影响文件

- ADR-0020（权威边界；已含 2026-09-10 修正）
- RESEARCH-0012（前置；routing 验证）
- `docs/plans/archive/PLAN-0035-checker-primitive-restructuring.md`
- `docs/plans/archive/PLAN-0036-payload-discovery-ledger.md`
- `docs/plans/archive/PLAN-0038-task-capability-routing.md`
- `references/principles/entry.md`
- `references/principles/instruction-architecture.md`
- `references/principles/document-model.md`
- `references/principles/metadata-policy.md`
- `references/principles/capability-model.md`
- `references/principles/decision-records.md`
- `references/principles/migration-method.md`
- `references/init-spec.json`
- `SKILL.md`
- `docs/product/en/architecture.md`
- `docs/product/zh-CN/architecture.md`
- `docs/product/zh-TW/architecture.md`
- `tests/suites/principles-extraction.test.js`
- `tests/run-tests.js`
- CHANGELOG.md
- roadmap ×3

## 发现台账（Discovery Ledger）

| 标识（ID） | 类型 | 来源 | 问题 | 影响面 | 严重度 | 状态 | 处置 | 责任人 | 验证/证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| X0 | observation | design | 过早抽取会固化未验证 routing | skill | high | closed | resolved | — | Phase 5 EXITED + 2.0 后解冻（2026-09-12） |
| X1 | observation | review | 「不写死」易被读成软建议 | skill | high | closed | resolved | — | ADR-0020 L1 硬约束修正 |
| X2 | migration_gap | design | Stage C/D 未交付（skill 包 + 干净目标验证） | both | med | closed | resolved | — | principles/ + principles-extraction 4/4（2026-09-13） |
| X6 | observation | review | 提炼级联：working/RESEARCH-0014/Plan 百科/repo-tools md | both | high | closed | resolved | — | be0d079 unwind；A/B→ADR-0020 |
| X3 | observation | review | 一次抽象会复制实现或空泛口号 | skill | high | closed | resolved | — | 本计划 § 提取协议；产物分层 ≠ 提取流程 |
| X4 | observation | review | 全文 0037 作 2.0 必达项过大且与产品定义重叠 | both | high | closed | resolved | — | 2.0=本仓 Gen2 载荷已发布；A–D 为 2.x H1 |
| X5 | observation | review | H1 清脚本 / 装 router / 瘦本仓入口 / 新建去向表会偏离提炼 | both | high | closed | resolved | — | ADR-0025 2026-09-13 决策 9–13 |

## 闭包对账

```text
Total known:  7
Resolved:     7  (X0–X6)
Deferred:     0
Open:         0
Unaccounted:  0
```

## 参考

- ADR-0020（skill 提炼边界 · L1/L2/L3）· ADR-0025 H1（含 2026-09-13 决策 9–13）
- ADR-0018 Phase 5 · ADR-0022 · ADR-0023
- RESEARCH-0012（前置）
- PLAN-0035 / PLAN-0036（Phase 4 EXITED；已归档）
