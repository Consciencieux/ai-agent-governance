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

## 后续修正（2026-09-10）：知识对象权威矩阵（authoritative / supporting / forbidden）

本修正是对「后续补充」决策 3 的 **Narrow amendment**。高层分类（Research = 描述系统，Finding = 记录问题，ADR = 长期决策，Plan = 当前施工）保留；自本修正起，**正文级权威**以本矩阵为准。FINDING-0023 区分了 primary vs supporting；本条把 supporting 从「可以出现」收紧为「不得变成第二种权威」。完整因果描述见 RESEARCH-0007；本条只规定必须遵守的合同。

**检查机制不能替代本矩阵。** 未定义清楚的边界，checker 不知道什么算错。本阶段不增加 JS authority gate。Phase 2 用下方五问 review 执行；词级扫描与语义分类是否机械化，由后续阶段的 ADR / Plan 决定，不在本修正预填实现。

**权威矩阵**（可权威声明 = 该类型的 primary authority；支持上下文 = 可简述、必须能指向真正权威；不得权威声明 = 写了也不构成规范）：

| 类型 | 可以权威声明 | 只能作为支持上下文 | 不得权威声明 |
| --- | --- | --- | --- |
| Research | 模型、观察、比较、测量、解释 | 已接受目标 / 已接受约束的描述（指针指向 ADR） | MUST、最终架构选择、执行 disposition（Preserve / Redesign / keep / wrap 等） |
| Finding | 问题、证据、根因、影响、outcome closure（failure mode 消失后的不变式） | 候选修复方向 | 具体实现架构、长期规范、目录/机制处方 |
| ADR | Accepted decision、constraint、MUST / MUST NOT | 背景、后果、被否决方案 | 当前任务 checklist、发布日程 |
| Plan | 当前施工、步骤、验收 | 背景 / ADR 约束摘要（指针指向 ADR） | 长期架构重新裁决 |
| Roadmap | 当前战略投影与里程碑索引 | 一条摘要 | 详细设计、计划正文复述、阶段顺序裁决 |
| Product | 当前用户事实与用法 | 简短 rationale | 内部计划、研究、未实现目标 |
| Glossary | 术语叫什么（三语对照） | 一句释义 | 业务规则、架构决策 |

**邻接问题归属（本矩阵的操作性问答）：**

```text
Research 能不能写「目标架构」？
  → 可以描述已接受目标（supporting + 指向 ADR）；不能裁决目标。

Finding 能不能写「关闭条件」？
  → 可以。关闭条件 = outcome invariant，不是施工方案。

关闭条件能不能指定 Rule Registry / 某目录形态？
  → 不能作为权威。那是实现架构，归后续 ADR / Plan。

Research 能不能给每个 Gen1 capability 写 Preserve / Redesign？
  → 不能作为权威。那是执行 disposition，归后续 ADR / Plan。

Plan 能不能复述长期 invariant？
  → 只能摘要 + 指针。复述若与 ADR 冲突，以 ADR 为准；Plan 不得靠复述改写 ADR。
```

一段文字若删掉后必须由另一类对象承担，说明它已不是 supporting context，应拆出或降为指针。引用 ADR 的「必须」仍是引用，不是 Research/Finding 自己立法。

**Phase 2 结构化 review（新增或大改知识对象时必答，人工 / Agent，不进 JS gate）：**

```text
1. 这个文件唯一 primary authority 是什么？
2. 哪些段落是 supporting context？
3. 是否有一段如果删掉，必须由另一类对象承担？
4. 是否新增了此前不存在的 MUST / architecture choice / implementation commitment？
5. 如果有，权威对象在哪里？
```

四条答不出或第 4 问为是且第 5 问为空 → 先改文档，再继续施工。

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
- 正文级权威矩阵（FINDING-0027）：本 ADR 2026-09-10 修正
