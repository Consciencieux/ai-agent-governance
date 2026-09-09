---
id: ADR-0016
status: Accepted
generation: gen2
---

# ADR-0016：文档结构从「语言树」转向「用途分层」


## 背景

当前 `docs/` 采用「整个文档树按语言复制」的结构：`docs/{en,zh-CN,zh-TW}/` 下各自拥有 product 文档（architecture / governance-model / commands / validator / lifecycle / anti-regression / skill-discovery / bootstrap-output）+ roadmap + plans。

三语树适合产品文档（用户需要多种语言），但随着 knowledge 体系扩展（findings、research、ADR、archive、plans 带 ID），每新增一个文档类型都要维护 3 份目录、3 套链接、3 套同步规则、3 套索引——而大量内部知识根本没有三语需求。

关键观察：**findings / research / design-decisions / archive 已经在 `docs/` 根下单语**（ADR-0013、0014、0015 确立），只有遗留的三语树（product 文档 + roadmap）仍是旧模型。当前结构是「部分按用途分层、部分按语言分层」的过渡态。

## 决策

**1. 语言不是第一层分类维度，文档用途才是。**

```text
docs/

├── product/                # 用户 facing——多语言
│   ├── en/
│   ├── zh-CN/
│   └── zh-TW/
│
├── plans/                  # 执行计划——单语（zh-CN canonical）
│   ├── roadmap/            # roadmap 是边界对象——三语
│   │   ├── en.md
│   │   ├── zh-CN.md
│   │   └── zh-TW.md
│   └── PLAN-xxxx.md
│
├── findings/               # 单语（已在 docs/ 根下，维持）
│   └── FINDING-xxxx.md
│
├── research/               # 单语（已在 docs/ 根下，维持）
│   └── RESEARCH-xxxx.md
│
├── design-decisions/       # 单语（已在 docs/ 根下，维持）
│   └── ADR-xxxx.md
│
└── archive/                # 历史保存——单语 zh-CN canonical
    ├── plans/
    ├── findings/
    ├── research/
    └── adr/
```

**2. 语言策略由受众决定：**

| 知识类型 | 受众 | 语言 |
| --- | --- | --- |
| 面向用户（user-facing；README / 使用指南 / skill 指南 / 安装说明） | 用户、贡献者、外部开发者 | en + zh-CN + zh-TW |
| 路线图（roadmap；边界对象） | 对外：项目方向；对内：架构迁移计划 | 三语 |
| 执行计划（execution plans） | 项目维护者 | 单语（zh-CN canonical） |
| 研究 / 发现 / 架构决策（research / findings / ADR） | 维护者、研究者、架构设计者 | 单语 |
| 归档（archive） | 历史保存 | 单语（zh-CN canonical） |

**3. roadmap 保留三语**（它是边界对象，对外表达方向、对内承载迁移计划），但位置从 `docs/{en,zh-CN,zh-TW}/roadmap.md` 移到 `docs/plans/roadmap/{en,zh-CN,zh-TW}.md`。

**4. 迁移规则：所有迁移记录到 change-hygiene，不破坏既有引用。**

## 后果

- 正面：每类知识只维护一份（除非用户 facing）；findings/research/ADR/archive 的三语负担消除；结构语义与「用途」对齐。
- 代价：**gate 脚本对三语树路径有深度硬编码**，需要同步适配：
  - `repo-tools/check-doc-parity.js`：解析 `docs/en/ docs/zh-CN/ docs/zh-TW/` 平行结构
  - `scripts/check-doc-freshness.js`：翻译对推导（zh-CN 源 → en/zh-TW 译）
  - `repo-tools/check-roadmap-sync.js`：硬编码 `docs/en/roadmap.md` + `docs/en/plans`
  - `scripts/check-doc-consistency.js`：principles index / plan-status 扫描 `docs/{en,zh-CN,zh-TW}/plans`
  - 大量测试 fixture 引用 `docs/en/**` / `docs/zh-CN/**` / `docs/zh-TW/**`
- 遗留风险：这是一次大爆炸式路径迁移，若一次性完成会破坏大量引用。**必须在 ADR-0014 Migration Mode 下分阶段实施**，每阶段用 checkpoint 验证，不追求一次性到位。

## 实施阶段（Migration Mode 内）

**以下 D1–D5 是 ADR-0016 当时的局部文档迁移实施序列，不属于 Gen2 phase numbering（全局 Phase 0–8 以 ADR-0018 为准）；已由后续文档迁移与相关 Plan 执行，历史保留。**

1. **D1**：把 product 文档（9 个：architecture / governance-model / commands / validator / lifecycle / anti-regression / skill-discovery / bootstrap-output）从 `docs/{en,zh-CN,zh-TW}/` 移到 `docs/product/{en,zh-CN,zh-TW}/`，更新 gate 脚本路径。
2. **D2**：roadmap 移到 `docs/plans/roadmap/`（保留三语），适配 `check-roadmap-sync.js`。
3. **D3**：plans 从三语树合并为单语 `docs/plans/`。
4. **D4**：archive 按类型分子目录（plans / findings / research / adr）。
5. **D5**：清理旧路径引用、gate 脚本、测试 fixture。

每个 D 步骤是一个独立 checkpoint（ADR-0014），gate 在 Migration Mode 下为观测性。

## 后续修正（2026-09-09）：归档（archive）只保留 `plans/`，且位置在 `docs/plans/archive/`

本 ADR 原决策的 archive 子树（`plans/` / `findings/` / `research/` / `adr/` 四类）与后来确定的生命周期语义冲突，予以部分修正：

- **只有 Plan 物理归档**，位置为 `docs/plans/archive/`（不是 `docs/archive/`）。
- **Finding / Research / ADR 永不物理归档**：`Resolved` / `Superseded` / `Deprecated` 都只在原目录内更新状态（ADR-0013 已确立 Finding 不归档；ADR-0019 确认 `docs/plans/archive/` 是 archived Plans 的永久位置）。
- 原「Phase 4：archive 按类型分子目录（plans / findings / research / adr）」修正为：**archive 仅含 `plans/` 一个子目录，位于 `docs/plans/archive/`**；不再创建 `archive/findings/`、`archive/research/`、`archive/adr/`。

目标结构修正如下（archive 部分）：

```text
docs/plans/
├── README.md                  # plans 目录管理规则
├── roadmap/                   # 三语，持续维护，不归档
├── PLAN-xxxx-*.md             # 当前执行计划
└── archive/                   # 已完成计划（只有 Plan 物理归档到此处）
    └── PLAN-xxxx-*.md
```

原正文（含 archive 四类子目录的树与 Phase 4 条文）保留作为历史决策记录；本修正以明确的接受日期 supersede 其中冲突的部分。

## 后续补充（2026-09-09）：知识对象模型规范（边界、路由与生命周期）

将 `docs/` 固化为一套稳定的**知识对象模型**（七类：Product / Research / Finding / ADR / Roadmap / Plan / Glossary；Archive Plan 是 Plan 的生命周期状态，不是独立类型）。完整系统模型（描述层）见 `docs/research/RESEARCH-0007-documentation-knowledge-architecture.md`；本条只规定**必须遵守的规范决策**：

**1. 内容路由测试。** 每个知识对象按 **primary authoritative responsibility** 判定归属（描述系统→Research / 记录问题→Finding / 长期选择→ADR / 长期未来→Roadmap / 当前施工→Plan / 用户当前事实→Product）。对象允许包含必要的 supporting context（如 ADR 的 Background/Consequences、Finding 的 Resolution）；**只有 forming 独立、长期维护的知识时才拆成独立对象并引用**，不是「同时回答两个问题就必须拆」。

**2. 目录决定知识类型，不决定重要程度；状态决定生命周期，引用决定关系。** 不得因对象「重要 / 影响未来 / 已完成」而跨目录复制内容；关系通过链接表达（Research→informs→Finding→motivates→ADR→constrains→Roadmap→sequences→Plan→implements→Code/Tests），不通过复制。

**3. "must not" 是权威。** 每种知识类型有禁止内容（ADR 禁止 implementation checklist / bug inventory / roadmap scheduling；Roadmap 禁止 completed feature inventory、事实复制与**裁决阶段顺序**（归 ADR-0018）；Finding 禁止详细施工方案；Research 禁止宣布必须采用某方案；Plan 禁止重新定义长期架构）。边界靠禁止项锚定，不靠描述。

**4. 当前知识与历史知识隔离。** 当前/历史对象的分类清单统一维护在 `docs/README.md` §「当前 vs 历史（隔离）」；本 ADR 只规定两者不得混用：历史可被读来理解 provenance，**不得直接成为当前执行指令**。对象是否当前仍须结合其 canonical `status` 与 generation/applicability metadata 判断。

## 后续补充（2026-09-09）：知识对象表示法归一（Representation Normalization）

统一 Plan / Finding / Research / ADR 四类对象的**表示层**（YAML envelope、字段命名与排列、空字段处理、H1 格式、中文章节/表头），**不改变生命周期语义、不强制四类业务字段相同**。

**公共外壳**：四类对象 YAML frontmatter 统一、公共必填仅 `id` + `status`；不得添加 `kind`（ID/路径已知）、`title`（H1 已有）、`created`/`updated`（Git 已有 provenance）。**Sparse metadata**：没有真实机械消费需求或确实发生时才写入字段；空 optional 字段一律省略（禁止 `resolved_in:` / `github_issue:` / `supersedes: []` / `related:` 等空值占位）。frontmatter 通常 4–8 行，超 10–12 行为 smell。

**类型专属字段**（各目录 README 定义 status enum 与专属字段；此处不复制 schema）：Plan `generation`+`target`；Finding `type`+`severity`+`affected`+`observed_in`（+按需 `direction`/`root_cause`/`resolved_in`/`github_issue`）；Research `version`（+按需 `subject_generation`/`supersedes`/`superseded_by`）；ADR `generation`（+整篇 supersede 时 `supersedes`/`superseded_by`）。

**H1 与正文**：简中 canonical 对象 H1 = `# <ID>：<简体中文标题>`（英文 slug 留文件名）；正文章节与表格头以中文为主，技术术语首次出现允许 `术语（English）`，其后用 canonical 词。

**Representation authority moves now。** Plan / Finding / Research / ADR 的 canonical metadata 从本次迁移起统一为 YAML frontmatter；正文旧的 `> **Status:**` / `- 状态：` 一律删除。Gen1 checker 若仍解析正文旧格式，其失败属于**已知 compatibility divergence**，Migration Mode 下不反向约束新 representation（不因旧 parser 双写）。Parser migration 属 Phase 4。**不迁移 archived Gen1 Plans 的历史正文内容**（representation-only：只改 envelope/H1/章节，不改历史事实；已统一 envelope）。

## 参考

- Migration Mode（重构期间 gate 观测化、checkpoint 验证）：ADR-0014
- 知识对象五分类（findings/research/ADR/plan/archive 边界）：ADR-0013
- Roadmap 重新定位（架构演进视图）：ADR-0015
- 三语拆分原决策（将被本 ADR 的 product 子集延续）：ADR-0005
- 知识对象模型系统描述（七类、四字段、路由、当前/历史）：`docs/research/RESEARCH-0007-documentation-knowledge-architecture.md`
