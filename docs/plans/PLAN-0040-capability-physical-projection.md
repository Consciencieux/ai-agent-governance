---
id: PLAN-0040
status: Implemented
generation: gen2
target: both
---

# PLAN-0040：Phase 5c 按 Capability 物理投影

> **Status: Implemented**（P0–P2 完成；P3 可选未做 rename。前置：PLAN-0038 / PLAN-0039 Implemented。边冻结；Slice B 横切已迁出 lifecycle。）

纪律权威：`docs/research/routing/call-topology.md` § 物理拓扑。  
图权威：人表 `task-capability-map.md` · 机表 `graph.v0.json` · 解析 `repo-tools/lib/routing.js`。

## 目标

```text
5a 图稳定 + 5b resolve 可调用
        ↓
投影表：Capability → 当前 AuthorityRef → 目标路径
        ↓
graph / map 写入可解析 authority_ref（边不变）
        ↓
从 lifecycle 政策仓库抽出 Capability 叶（首刀）
        ↓
INIT / 生成契约同步新 INSTALLED 路径
        ↓
表征：authority 路径存在 + routing 仍绿
        ↓
（后）其余 1:1 policy 澄清 / Phase 6 oracle — 本计划外或尾声
```

## 现状（库存）

| 观察 | 含义 |
| --- | --- |
| `references/policies/lifecycle.policy.md` ≈ 290 行 | Gen1 政策仓库：Discovery Ledger / 变更归位 / 根因修复 / Rule Capture 等横切仍内嵌 Phase 小节 |
| `git` / `security` / `testing` / `coding` / `governance-files` | 近似单域文件，可先当「已接近 Capability 投影」 |
| `graph.v0.json` | 有 triggers / binds，**尚无**结构化 `authority_ref` 字段 |
| map 人表 | `authority_ref` 多为散文指针（节名 / 多文件），不足以机械对账 |
| INIT | `init-spec.json` 将 `lifecycle.policy.md` → `docs/rules/lifecycle.md` 等 |

## 范围（In）

- **投影表（施工权威）**：每个 keep Capability → `current_ref` → `target_path` → `slice`（A/B/C）
- **`authority_ref` 机读化**：写入 `graph.v0.json`（及 map 对齐）；`route-task` / 表征可断言路径存在
- **首刀抽取（Slice B）**：从 `lifecycle.policy.md` 抽出至少下列 Capability 叶到 `references/capabilities/<id>.md`（名称可微调，须与 capability id 对齐）：
  - `discovery-ledger`
  - `root-cause-repair`
  - `change-hygiene`（lifecycle 内变更归位相关节；与 coding 重叠处只搬语义不双写权威）
  - `rule-capture`
- **lifecycle 降级为编排骨架**：保留 Phase 1–6 导航与规模分级；横切正文迁出后留指针到 Capability 叶
- **INIT / role / architecture 同步**：新 INSTALLED 源进 `init-spec.json`；architecture ×3 布局；payload 表征
- **边不变证明**：routing suite 仍绿；triggers/binds 与 5b 表征夹具结果同形

## 非目标（Out）

```text
按 1.0 policies/templates 目录「对称拆文件」
改 TaskClass / Capability 边或预算算法（属 map 修订，另开）
全量重写 SKILL.md 正文 / 大规模 templates 搬家
LLM 路由 · 知识图谱
Active PLAN-0037 · 2.0 skill-release
Phase 6 正负 oracle 体系
合并 Capability 图与 Control.applicability
一次搬完所有 Capability（允许后续切片）
```

## 目标布局（裁决草案 · 批准后冻结）

```text
references/
  capabilities/           # Capability 叶（执行关注面正文）
    <capability-id>.md
  policies/               # 编排 / 仍近似 1:1 的域文件（lifecycle 骨架等）
  templates/
  workflows/
```

**不**新建第三套查找模型；目录只是 AuthorityRef 投影。  
已近似 1:1 的 `git.policy.md` → `git-write`、`security.policy.md` → `security-baseline` 等：Slice C 只澄清指针，**默认不强制改名**（改名属可选、须同步 INIT）。

## 设计裁决（本计划冻结）

| # | 裁决 |
| --- | --- |
| D1 | **先表后搬**：无投影表行不得移动文件 |
| D2 | **边冻结**：本计划不改 `always_on` / `triggers` / `facet_adds` / `binds`；要改边先改 map+表征再开搬家 PR |
| D3 | **lifecycle 非仓库**：横切叶迁出；lifecycle 只留编排 + 指针 |
| D4 | **Target: both**：payload（`references/` + init-spec）与 repo-infra（map/graph/tests/docs/architecture）同变更枚举同步点 |
| D5 | **reference-closure**：每个新 INSTALLED 路径在干净目标上可读；禁止 INSTALLED 引用 `docs/research/routing/` |
| D6 | **切片可停**：Slice A 可单独合入；Slice B 为 5c 主交付；Slice C 可选 |

## 交付阶段

### P0 — Design 批准 + 投影表

- [x] 批准本 Design → `status: Active`
- [x] 写入投影表（`docs/research/routing/projection-table.md`）
- [x] 冻结 Slice B 叶清单与目标路径

### P1 — Slice A：authority_ref 机读化（可先于搬家）

- [x] `graph.v0.json` 增加 `authorities`
- [x] map 人表与机表对账夹具（authority exists + routing 同形）
- [x] `route-task --json` 可带出 authority 列表（只读增强，不改 resolve 集合语义）
- [x] 表征：每个 keep capability 的 path 在仓库内 `exists`

### P2 — Slice B：lifecycle 横切抽出

- [x] 新建 `references/capabilities/{discovery-ledger,root-cause-repair,change-hygiene,rule-capture}.md`
- [x] 从 `lifecycle.policy.md` 迁出正文；原地留短指针
- [x] 更新 `authority_ref` → 新路径
- [x] `init-spec.json` + role-completeness / layout 所需声明
- [x] architecture ×3 列出 `references/capabilities/`
- [x] payload 表征：干净目标可读新规则文件

### P3 — Slice C（可选）：1:1 域文件指针澄清

- [ ] `git-write` / `secret-protection` / `security-baseline` / `testing-evidence` 等 AuthorityRef 写死到现有 policy 文件（+ 节）
- [ ] 不强制 rename；若 rename 则必须同 PR 更新 INIT 与全部引用

### P4 — Exit

- [x] routing suite 绿；authority exists 夹具绿
- [x] Ledger Open=0；Unaccounted=0
- [x] roadmap ×3：5c Implemented；下一入口 Phase 6（或剩余投影尾巴）
- [x] CHANGELOG（行为：INSTALLED 规则面拆分 / AuthorityRef 机读）
- [x] PLAN-0039 successor 回指本计划 Implemented

## 完成条件（exit）

- [x] P0–P2 完成（P3 可选）
- [x] 边集合与 5b 表征同形（允许 authority 路径字符串变化）
- [x] lifecycle 不再承载 Slice B 横切正文（仅指针）
- [x] 无 1.0 骨架对称拆分；无第三套查找；未 Active PLAN-0037

## Domain sync（Target: both）

| Domain | 同步点 |
| --- | --- |
| payload | `references/capabilities/*`、`references/policies/lifecycle.policy.md`、`references/init-spec.json`（及 role 声明）、必要时 templates 指针 |
| repo-infra | 本计划、roadmap、`docs/research/routing/*`、`graph.v0.json`、`repo-tools/lib/routing.js`（若暴露 authority）、`tests/suites/routing*.js`、architecture ×3、AGENTS 薄指针、CHANGELOG |

## 受影响文件（预举；实施时按投影表收敛）

- `docs/plans/PLAN-0040-capability-physical-projection.md`（本文件）
- `docs/plans/roadmap/{en,zh-CN,zh-TW}.md`
- `docs/research/routing/{call-topology,task-capability-map,README,graph.v0.json}`
- `docs/research/routing/projection-table.md`（P0）
- `references/policies/lifecycle.policy.md`
- `references/capabilities/*.md`（新建）
- `references/init-spec.json`
- `docs/product/{en,zh-CN,zh-TW}/architecture.md`
- `repo-tools/lib/routing.js` · `repo-tools/route-task.js`（可选增强）
- `tests/suites/routing.test.js` · payload/docs 表征
- `AGENTS.md` · `CHANGELOG.md`
- `docs/plans/PLAN-0039-context-detector-dispatcher.md`（successor 回指）

## 发现台账（Discovery Ledger）

| 标识（ID） | 类型 | 来源 | 问题 | 影响面 | 严重度 | 状态 | 处置 | 责任人 | 验证/证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P0 | observation | inventory | graph 无结构化 authority_ref | repo | high | closed | resolved | — | authorities in graph.v0.json |
| P1 | observation | lifecycle | 横切内嵌 Phase 小节 | payload | high | closed | resolved | — | capabilities/* extracted |
| P2 | observation | design | Capability 叶与 coding.policy 语义重叠 | both | med | closed | resolved | — | change-hygiene leaf is single body; coding keeps restraint pointer |
| P3 | observation | INIT | 新 capabilities/ 必须进 init-spec | payload | high | closed | resolved | — | init-spec artifacts added |
| P4 | observation | ADR-0020 | INSTALLED 不得引用 docs/research/routing | payload | high | deferred | deferred | — | Out；authority 用 references 路径 |
| P5 | observation | PLAN-0038 | Capability 粒度仍可能过粗/过细 | skill | med | deferred | deferred | — | revisit: map 修订 / 0037 |
| P6 | observation | FINDING-0028 | 脚本机械面无 generation/disposition 台账；与 5c 文档投影正交 | repo | med | deferred | deferred | — | revisit: script inventory Plan；非 PLAN-0040 In |

## 闭包对账

```text
Total known:  7
Resolved:     4  (P0–P3)
Deferred:     3  (P4, P5, P6)
Open:         0
Unaccounted:  0
```

## Successor

- Phase **6** Invariant-based Testing（正负 oracle）
- 或 5c 尾巴：其余 Capability 叶 / 可选 rename
- Narrow ADR：routing + projection 权威升格（若要进薄入口 / payload 指针）

## 参考

- `call-topology.md` § 物理拓扑 · PLAN-0038 / PLAN-0039 Implemented
- ADR-0022（lifecycle 非政策仓库）· ADR-0020 · RESEARCH-0012
- PLAN-0035 Phase 5 交接：由路由导出物理 topology
