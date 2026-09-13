---
id: RESEARCH-0014
status: Draft
version: 1
subject_generation: gen2
---

# RESEARCH-0014：可移植治理模式提炼（Portable Governance Patterns）

PLAN-0037 Stage A/B 的 **知识产物**（Facts → Rationale → Pattern → L1/L2/L3 候选）。**不是** Plan、不是 INSTALLED skill、不是 ADR。

- 执行状态 / 验收：只看 [PLAN-0037](../plans/PLAN-0037-governance-skill-extraction.md)
- L1 状态：Provisional-Freeze（2026-09-13）；Stage D 可回退
- L2 状态：Draft 稳定叙述（L2-01…11）；进 Stage C 须人类确认
- Stage C 才会写成 skill 文件形状；本文件不代替 SKILL.md

执行 PLAN-0037 时：**不要**把本文件当 always-on 入口。需要改候选 invariant / pattern 时才读。

## 范围与非目标

| 做 | 不做 |
| --- | --- |
| 盘点已验证 Gen2 能力并抽象 | 复制 `docs/` / `scripts/` / `CTRL-NNNN` / Phase 剧本 |
| 分类 L1 / L2 / L3 候选 | 迁移或删除旧脚本（ADR-0025 决策 9–10） |
| 为 Stage B–C 提供冻结输入 | 大规模改 `SKILL.md` / `AGENTS.md` |
| | 完整 Control Registry / 新能力去向表 |

**输入（已读）：** ADR-0020…0025 · RESEARCH-0006 · RESEARCH-0011 / 0012 · must-ship gates · oracle inventory · routing graph / task-capability-map · script-inventory · ADR-0025 2026-09-13 H1 纪律。

---

## 1. Project Facts（本仓实际怎么做 · 不抽象）

| ID | 当前实现（本仓 WHAT） | 已验证证据 | 背后通用能力（先命名，后论证） |
| --- | --- | --- | --- |
| F01 | Research / Finding / ADR / Plan（+ roadmap 索引）分目录、分职责；Finding 状态机、Plan 归档物理移动 | ADR-0016 · ADR-0013 · ADR-0019 | knowledge-object separation |
| F02 | `AGENTS.md` / `SKILL.md` 作 always-on 入口；详细规则在 references / docs 按需加载 | ADR-0022 · RESEARCH-0009 | thin entry + progressive disclosure |
| F03 | Task class + facets → Capability set → AuthorityRef / run_set；`route-task` + `graph.v0.json` | RESEARCH-0012 · PLAN-0038–0040 EXITED | contextual instruction loading |
| F04 | Control 一级对象；semantics ≠ evaluator ≠ gate ≠ test；binding 按 profile | ADR-0023 · RESEARCH-0010 | mechanical guarantee model |
| F05 | Plan 内 Discovery Ledger；发现须 disposition + closure；Unaccounted=0 | ADR-0021 · PLAN-0036 契约 | unresolved-discovery closure |
| F06 | oracle-inventory：important 义务须 positive+negative；characterization ≠ protection | PLAN-0042 · FINDING-0006 | invariant-based verification |
| F07 | repo vs skill 分发角色；shared semantic 单一 owner；禁止 `scope=both` 当 ownership | ADR-0020 · ADR-0006 · FINDING-0001 | producer/product boundary |
| F08 | must-ship 切片：密钥、git 安全、INIT、AUDIT/RELEASE 入口、validator、证据分层、子技能叶… | ADR-0024 · must-ship-gates | shippable governance core |
| F09 | 脚本 disposition 台账（keep/wrap/extract/retire）；retire=∅；WRAP CLI + evaluator | PLAN-0041 · RESEARCH-0011 · FINDING-0028 | carrier vs semantics separation |
| F10 | 2.x 顺序 = Horizon H0–H3；禁止 Phase 9；H1=提炼不迁载体 | ADR-0025 | product-path vs migration-path |
| F11 | Metadata 封闭 schema；类型专属字段在各 README；禁止投影双写 | ADR-0016 · FINDING-0024 | closed metadata + single owner |
| F12 | 关键保证优先机械路径；Git consent 协议 must-ship、机械 evaluator = later | ADR-0022 §8 · ADR-0024 | attention-independent enforcement |
| F13 | Context Economy：最小充分读集；超预算 defer；unmatched 不静默全量加载 | ADR-0022 · routing map 预算 | context economy |
| F14 | Capability 可 bind 0..n Control；禁止 Capability≡CTRL 改名 | RESEARCH-0012 Q5 | capability ≠ control |
| F15 | Roadmap 只索引，不裁决阶段顺序 | ADR-0015 · ADR-0025 | index ≠ authority |

---

## 2. Design Rationale（为何存在 · 删了会怎样）

| Fact | 解决什么失败模式 | 若删除 / 弱化 |
| --- | --- | --- |
| F01 | 问题、证据、决策、施工混在同一文件 → 无法判断「现在该信哪句」 | Agent 把历史研究当现行规则；Plan 细节渗进 ADR |
| F02 | 入口堆满规则 → attention burden；忘读 = 无控制 | 每次任务通读百科；关键规则依赖记忆 |
| F03 | 无显式路由时，拆文件只是把「记规则」变成「找规则」 | 静默全量加载或随机漏读 |
| F04 | 政策 / 脚本 / CI / 测试互相冒充权威 → 改一处漏三处 | 正则抄进测试成第二语义家；gate 被当成 Control |
| F05 | 修复中新发现只活在对话里 → focus drift，任务「完成」但问题消失 | 已知问题无 disposition 蒸发 |
| F06 | 绿测试 ≠ invariant 受保护（表征与 oracle 混淆） | 重构 checker 时假绿；负向夹具抄实现 |
| F07 | 本仓狗粮 INSTALLED 脚本 / 共享语义双写 → 产品与实验场耦死 | 用户项目被迫继承本仓目录与 CTRL 号 |
| F08 | 「指出 WRAP 文件」被当成可发布 | 干净目标跑不通仍宣称 2.0 |
| F09 | 分发角色清、代际/处置不清 → 误删在用载体或整夹隔离 | 打包仍带走「隔离夹」；或误删 must-ship WRAP |
| F10 | `later` 扁平清单 / Phase 9 会再次让路线图或迁移剧本裁决顺序 | H1 未完成就清脚本、装 router |
| F11 | frontmatter 与正文双写 → FINDING-0024 投影漂移 | 状态改一处漏一处 |
| F12 | 关键安全/同意只靠「请记住 Markdown」 | Agent 漏读即无保证 |
| F13 | 读集无预算 → 上下文膨胀与重复推理 | 为省 token 少读必要权威，或反之灌爆 |
| F14 | 每个 Markdown 都发 CTRL → 新规则库爆炸 | Control 数量失控；portable 面被本仓编号绑死 |
| F15 | 路线图复述 Plan 细节 → 双权威 | 索引与 Plan 打架 |

---

## 3. Reusable Pattern（跨项目成立的部分）

对每条 Fact 判定：**Pattern（可移植）** vs **Instance（本仓 L3）**。

| Fact | Reusable Pattern（保留 WHY + CONSTRAINT） | 本仓 Instance（不得升 L1） |
| --- | --- | --- |
| F01 | 知识对象按**用途**分型；执行对象单一 canonical；历史对象默认不进执行上下文 | `docs/research|findings|design-decisions|plans` 路径；Finding 不物理归档 |
| F02 | always-on 入口 = identity · scope · 少量 invariants · routing · fallback | 本仓 `AGENTS.md` / `SKILL.md` 现有厚度与章节 |
| F03 | Task/Context → 显式 applicable capability 集合 → 权威指针；未匹配须可见 | `task_class` 枚举名、`graph.v0.json`、`repo-tools/route-task.js` |
| F04 | 治理义务有稳定 identity；语义权威与评价机制分离；证据可指 | `CTRL-NNNN`、本仓 slot 序列化、具体 evaluator 路径 |
| F05 | 发现须持久化；完成 ⇒ 零未结算；非 resolved 须后继或 revisit | Plan 内表列名、本仓 disposition 枚举字符串 |
| F06 | 重要 invariant 须独立正/负 oracle；表征测试不得冒充保护 | `oracle-inventory.v0.json` 字段、具体 suite 名 |
| F07 | 共享语义单一 owner；实现可按 profile 分叉；产品包不含实验场专用物 | `scripts/` vs `repo-tools/` 目录名、本仓 dogfood 现状 |
| F08 | 可发布切片 = 干净目标可执行的必装语义面；指出载体 ≠ 可用 | ADR-0024 具体 must-ship 行项目（产品切片，非通用 L1 清单） |
| F09 | 载体（CLI/文件）与语义可 strangler；删除在替代→验证→观察之后 | 今日 `retire=∅`、具体 wrap 三文件 |
| F10 | 迁移路径与产品演进路径分离；提炼阶段不迁载体 | H0–H3 名称、本仓 Phase 0–8 历史 |
| F11 | 机器字段最小闭集；分类叙述进正文；单事实单 owner | 本仓 frontmatter 键名列表 |
| F12 | 保证强度可陈述；关键保证优先机械 enforcement boundary | 本仓哪些 CTRL 已机械、哪些仍 protocol-only |
| F13 | 读集有预算与 defer；扩大读取须由歧义/失败触发 | 预算「≤8」、本仓 facet 名 |
| F14 | 执行关注面（Capability）≠ 可评价保证（Control） | 本仓 capability id 表 |
| F15 | 索引文档不得覆盖权威对象的状态/顺序 | 三语 roadmap 文件布局 |

### 能力对照（用户要求的压缩视图）

| 当前实现 | 通用能力 |
| --- | --- |
| ADR / Finding / Research / Plan 分离 | knowledge ownership separation |
| Thin entry | progressive disclosure |
| Task routing | contextual instruction loading |
| Control model | mechanical guarantee |
| Discovery Ledger | unresolved discovery closure |
| Oracle inventory | invariant-based verification |
| Producer / Product separation | implementation boundary |
| must-ship + WRAP strangler | shippable core + carrier evolution |
| Context Economy / read_set budget | context economy |
| Horizon ≠ SemVer ≠ Phase | path-authority separation |

---

## 4. Skill Definition 候选（L1 / L2 / L3）

> **分层规则（ADR-0020）：** L1 = 不可违反、宜可机械检查；L2 = 推荐模式；L3 = 项目实例。  
> **本 Stage 只定候选**；Stage B 稳定 L2 叙述；Stage C 落 skill 文件形状；Stage D 干净目标验证。  
> 每条 L1 标注溯源 Fact。

### 4.1 L1 Hard Invariants（跨项目必须成立）

| ID | Invariant（约束陈述，非口号） | 溯源 | 可机械检查的方向（示意） |
| --- | --- | --- | --- |
| L1-01 | **单一权威：** 任一治理事实 / 规则语义有且仅有一个 authoritative owner；他处只能引用或摘要，不得并列全文权威 | F07 F11 F15 | 双路径声明同一语义 → fail；索引复述状态枚举 → fail |
| L1-02 | **入口不承载知识库：** always-on 入口不得成为完整政策/历史/百科；详细规则必须经由路由到达的领域对象承担 | F02 F13 | 入口体积/章节类型门禁（阈值项目定）；禁止入口内嵌完整 workflow 正文 |
| L1-03 | **关键保证不依赖记忆：** 被标为 critical 的保证不得仅以「Agent 读到 Markdown」为唯一 enforcement；须声明机械路径或显式降级为 guidance | F04 F12 | critical 项无 evaluator/binding 且未标 guidance → fail |
| L1-04 | **发现不可无 disposition 消失：** in-scope 发现必须持久表示直至显式 terminal disposition；完成判定包含 Unaccounted=0 | F05 | ledger 存在性；open 无 disposition → fail；deferred 无 successor/revisit → fail |
| L1-05 | **机械控制须有证据形状：** 若采用机械 Control，则至少具备 identity · semantic owner · evaluator（或显式 none）· binding · evidence expectation | F04 F06 | Control 记录缺 slot → fail |
| L1-06 | **能力须显式路由：** 新增可加载执行能力必须声明何时适用（task/context）、读哪些权威、如何验证；禁止「拆了文件但无 applicability」 | F03 F14 | capability 无 trigger/authority 指针 → fail |
| L1-07 | **文档类型单一职责：** 描述系统（Research）≠ 记录问题（Finding）≠ 固化决策（ADR）≠ 施工（Plan）；禁止跨类型混用职责 | F01 | 类型目录/标记与禁用章节（项目可配） |
| L1-08 | **历史非默认执行上下文：** 已归档 / superseded / 历史证据默认不进入执行读集，除非任务显式引用 | F01 F13 | routing 默认排除 archive；引用才加入 |
| L1-09 | **元数据封闭：** 文档类型 metadata schema 封闭；新增字段须经决策记录；禁止把正文已有信息复制进 metadata | F11 | schema 外字段 → fail |
| L1-10 | **验证分层：** 表征测试不得冒充 invariant 保护；对声明为 important 的义务须有独立正/负判定或显式 gap/deferred | F06 | important ∧ 无 oracle_pair ∧ 非 deferred → fail |
| L1-11 | **产品边界：** 实验场专用机制不得默认进入可安装产品面；共享语义不蕴含共享实现 | F07 F08 F09 | 打包 allow-set / role 门禁 |
| L1-12 | **未匹配失败可见：** 任务无法路由时不得静默加载全库；须 unmatched/defer 并对用户可见 | F03 F13 | router 输出强制字段 |

**明确否决为 L1（常见陷阱）：**

| 候选说法 | 否决原因 |
| --- | --- |
| 「必须使用 CTRL-NNNN」 | L3 编号方案 |
| 「必须有 `docs/findings/`」 | L3 路径；L1 只要求问题对象类型存在 |
| 「必须实现本仓 Task→Capability JSON 图」 | L2/L3；L1 只要求显式 applicability |
| 「必须跑 `npm run check:must-ship`」 | 本仓 CI 实例 |
| 「入口必须少于 N 行」 | 可作 L2 启发式；硬阈值属 L3 |
| 「先清 scripts/ 再提炼」 | 违反 ADR-0025 H1 |

### 4.2 L2 Patterns（推荐，非强制路径）

| ID | Pattern | 说明 |
| --- | --- | --- |
| L2-01 | Research / Finding / ADR / Plan 四对象分离 | 最常见的知识所有权落点；允许等价分型，不强制四名 |
| L2-02 | Task → Capability → Authority → Execution → Verification | 与 L1-06 配套的推荐链 |
| L2-03 | Context Economy / Progressive disclosure | L1 Entry → L2 Execution → L3 Reference |
| L2-04 | Capability-based organization | 按执行关注面挂权威，而不是按 Gen1 目录骨架 |
| L2-05 | Discovery Ledger 模式 | 任务内 append-only 台账；两轴 Status × Disposition |
| L2-06 | Strangler：WRAP 载体 + EXTRACT 语义 | 旧 CLI 保留，语义进 evaluator |
| L2-07 | must-ship / repo-keep / later / retire / out 产品处置词汇 | 与 checker KEEP/WRAP/EXTRACT 正交 |
| L2-08 | Horizon（产品演进）与 Migration Phase（一次性迁移）分离 | 避免 Phase 9 |
| L2-09 | Control × profile × boundary → 派生保证等级 | 不把 guarantee 写成 Control 单值 |
| L2-10 | 种子 oracle 集 + 路由完整性表征 | 全量矩阵可 later |

### 4.3 L3 Project Customization（项目选择）

| ID | 定制项 | 本仓实例（仅参考） |
| --- | --- | --- |
| L3-01 | 目录与文件布局 | `docs/{research,findings,design-decisions,plans}` |
| L3-02 | 对象编号方案 | `FINDING-xxxx` · `ADR-xxxx` · `CTRL-NNNN` · `PLAN-xxxx` |
| L3-03 | 是否采用机器 Control 文件 / 何种序列化 | 概念 slot；机器文件 later |
| L3-04 | CI 平台与门禁编排 | GitHub Actions · `check:must-ship` |
| L3-05 | 语言与翻译布局 | 产品三语 · 知识单语 zh-CN |
| L3-06 | Router 实现 | `repo-tools/route-task.js` + `graph.v0.json` |
| L3-07 | Discovery 表列名与存放位置 | Plan 内 Markdown 表 / lifecycle 契约 |
| L3-08 | 具体 must-ship 能力清单 | ADR-0024 §4（产品切片，可项目裁剪） |
| L3-09 | 脚本目录物理边界 | `scripts/` vs `repo-tools/` |
| L3-10 | SemVer / 发布流水线细节 | `v2.0.0` skill-release |

---

## 5. 与后续 Stage 的交接

```text
Stage A（本文件）  Facts + Rationale + Pattern + L1/L2/L3 候选
        ↓ 审查：复制型 / 空泛型 / 缺溯源
Stage B            稳定 L2 叙述；删并重复；标「需 Phase 证据」项
Stage C            skill 载荷形状（薄入口 + references）；每文件 Hard/Recommended/Custom
Stage D            干净目标验证（抑制百科入口、类型混用、规则复制、全量加载）
```

**H1 纪律（ADR-0025 决策 9–13）仍然适用：** 本产物不触发脚本清理、不改本仓薄入口完工、不建第三份能力去向表、不把 H1 写成 v2.1 门禁。

## 6. 审查清单（合并前）

- [x] 每条 L1 可回溯到 ≥1 条 Fact
- [x] 无本仓路径 / CTRL 号 / Phase 剧本写入 L1
- [x] 无「要有治理 / 保持清晰」类空泛 L1
- [x] L2/L3 边界显式
- [x] 未修改 `SKILL.md` / `AGENTS.md` 正文结构（仅允许指针级同步，另案）
- [x] 未迁移/删除 scripts
- [x] **人类推进：** 「执行任务」(2026-09-13) → L1 provisional freeze，进入 Stage B；Stage D 前仍可回退

## 7. 开放项（不阻塞 Stage A 稿，阻塞升格）

| ID | 问题 | 建议归属 |
| --- | --- | --- |
| O1 | ADR-0024 must-ship 具体行是否部分升 L1，或整体留作「产品剖面」L2/L3？ | **已裁定（Stage B）：** 剖面=L2-07/L3-08；原则留 L1-11 |
| O2 | Git consent：协议 L1 vs 机械 evaluator L2/later | **已裁定（Stage B）：** 协议进产品剖面；机械 later |
| O3 | 语言 ownership（canonical vs projection）是否单独 L1 | **已裁定（Stage B）：** L2-11；不升 L1 |
| O4 | X2（无 extraction 产物）在 Stage A 落地后如何记账 | X2 保持 open；子状态 stage-a+b-draft；Stage D 关闭 |

## 参考

- PLAN-0037 · ADR-0020（L1/L2/L3 边界）· ADR-0021…0025
- RESEARCH-0006 · 0011 · 0012
- `repo-tools/{routing-graph,oracle-inventory,script-inventory}.v0.json`


## Stage B 稳定稿（L2）

## 1. 相对 Stage A 的变更摘要

| 项 | 处置 |
| --- | --- |
| L1-01…12 | **provisional freeze** — 不增不删；Stage D 验证可回退 |
| O1 must-ship 行项目 | **不升 L1**；具体清单 = L3；「可安装面须可执行」原则已由 L1-11 覆盖 |
| O2 Git consent | **协议义务**可进产品剖面（L2-07 / L3-08）；**机械 evaluator** = later（非 L1、非本 Stage 实现） |
| O3 语言 ownership | **新增 L2-11**（推荐模式）；不升 L1（缺跨项目失败证据强度，留 Stage D 观察） |
| L2-01…10 | 合并叙述重复；每条补「何时用 / 何时不用 / 反模式」 |
| L2-06 vs L2-07 | 保留正交：载体演进（checker disposition）≠ 产品处置（must-ship/…） |

## 2. L1 Provisional Freeze（只读回指）

权威陈述仍在本文件 §4.1。本 Stage **不修改** L1 条文。调用方应视其为：

```text
L1-01 单一权威
L1-02 入口不承载知识库
L1-03 关键保证不依赖记忆
L1-04 发现不可无 disposition 消失
L1-05 机械控制须有证据形状
L1-06 能力须显式路由
L1-07 文档类型单一职责
L1-08 历史非默认执行上下文
L1-09 元数据封闭
L1-10 验证分层（表征 ≠ 保护）
L1-11 产品边界（实验场 ≠ 默认安装面）
L1-12 未匹配失败可见
```

## 3. L2 Patterns（稳定叙述）

每条格式：**意图 · 做法 · 何时不用 · 反模式 · 溯源 · 支撑的 L1**。

### L2-01 知识对象分型（Research / Finding / ADR / Plan）

| | |
| --- | --- |
| **意图** | 用对象用途隔离「证据 / 问题 / 决策 / 施工」，避免单文件身兼数职 |
| **做法** | 四类（或等价分型）各有单一职责；执行只信 canonical 决策与 Active 计划；索引文档（roadmap）不裁决状态 |
| **何时不用** | 极小个人仓可合并存储，但仍须能回答「这句话是事实、问题、决策还是待办」 |
| **反模式** | ADR 里写未验证长研究；Plan 里改写已 Accepted 决策正文；Finding 当 bug tracker 无限开票 |
| **溯源** | F01 F15 · ADR-0016 |
| **支撑** | L1-01 L1-07 L1-08 |

### L2-02 Task → Capability → Authority → Execution → Verification

| | |
| --- | --- |
| **意图** | 任务先映射可加载关注面，再读权威、再执行、再验证 |
| **做法** | 显式 applicability；输出 read_set / run_set / defer_set / unmatched；Capability 可 bind 0..n Control |
| **何时不用** | 单文件玩具项目可手工列「本次只读这三页」——仍须显式，禁止默契全库 |
| **反模式** | 无路由拆文件；Capability 1:1 改名为 Control；未匹配时静默加载全树 |
| **溯源** | F03 F14 · RESEARCH-0012 |
| **支撑** | L1-06 L1-12 |

### L2-03 Progressive disclosure / Context Economy

| | |
| --- | --- |
| **意图** | 最小化完成授权目标所需的预期上下文，同时保留正确性与证据 |
| **做法** | always-on 薄入口 → 按任务加载执行面 → 参考/历史按需；读集有预算，溢出进 defer |
| **何时不用** | Safety-critical 二次意见或上下文已污染时，允许扩大读取（仍记录原因） |
| **反模式** | 入口变百科；每次任务重读全部 ADR；为省 token 跳过必要权威 |
| **溯源** | F02 F13 · ADR-0022 |
| **支撑** | L1-02 L1-08 L1-12 |

### L2-04 Capability-based organization

| | |
| --- | --- |
| **意图** | 按「执行关注面」挂权威，而不是按历史目录骨架生长政策 |
| **做法** | 每个 Capability 有明确 Authority leaf；横切能力用 applicability 挂多节点，不塞进单一 lifecycle 章节 |
| **何时不用** | 引导型文档树仍可存在，但不得充当唯一 dispatcher |
| **反模式** | 按 Gen1 文件夹「细切」冒充能力模型；lifecycle 文件当政策仓库无限追加 |
| **溯源** | F03 F14 · ADR-0022 / RESEARCH-0012 |
| **支撑** | L1-06 |

### L2-05 Discovery Ledger

| | |
| --- | --- |
| **意图** | 修复/施工中的发现不因注意力转移而消失 |
| **做法** | 持久 workset；Status × Disposition 两轴；完成 ⇒ Unaccounted=0；非 resolved 须后继或 revisit |
| **何时不用** | 一次性问答无 in-scope 发现可省略；一旦登记则不得静默删除 |
| **反模式** | 只靠对话记忆；deferred 无后继；每个小发现都新建 Plan/Finding |
| **溯源** | F05 · ADR-0021 |
| **支撑** | L1-04 |

### L2-06 Strangler：载体 WRAP + 语义 EXTRACT

| | |
| --- | --- |
| **意图** | 演进实现时不破坏已安装入口；语义迁入 evaluator 后再薄化 CLI |
| **做法** | 旧路径保留为 WRAP；新语义进独立评价机制；删除仅在替代→验证→观察之后 |
| **何时不用** | 绿场项目可直接新形状，仍须 L1-05 证据形状 |
| **反模式** | H1 清脚本；整夹隔离仍进包；无台账的「先删后补」 |
| **溯源** | F09 · PLAN-0035/0041 · ADR-0025 |
| **支撑** | L1-05 L1-11 |

### L2-07 产品处置词汇（must-ship / repo-keep / later / retire / out）

| | |
| --- | --- |
| **意图** | 回答「发什么产品」与「本仓还留什么」，避免把文件存在当成可发布 |
| **做法** | 能力恰好一档；must-ship 须在干净目标可执行；retire/out 不得回潮 |
| **何时不用** | 不治理「发布切片」的内部工具仓可只用 repo-keep/later |
| **反模式** | 指出 WRAP 文件 = 已发布；later 清单当施工顺序；与 L2-06 的 KEEP/WRAP/EXTRACT 混用同一词 |
| **溯源** | F08 F10 · ADR-0024 |
| **支撑** | L1-11 |

### L2-08 产品演进路径 ≠ 一次性迁移剧本

| | |
| --- | --- |
| **意图** | 迁移 Phase 关闭后，用产品 Horizon/SemVer 演进，不重开 Phase N |
| **做法** | 顺序权威单一（本仓 = ADR-0025 Horizon）；Roadmap 只索引；提炼阶段不迁载体 |
| **何时不用** | 绿场无迁移历史则可直接 SemVer；仍禁止用版本号冒充未写明的阶段表 |
| **反模式** | Phase 9；把 H1/H2/H3 写成 v2.1/v2.2/v2.3 门禁；路线图裁决顺序 |
| **溯源** | F10 F15 · ADR-0025 · ADR-0015 |
| **支撑** | L1-01 |

### L2-09 Control 分层：semantics ≠ evaluator ≠ gate ≠ test

| | |
| --- | --- |
| **意图** | 义务、检查机制、门禁编排、测试各一层，避免正则/脚本成第二语义家 |
| **做法** | Control 有稳定 identity + semantics_ref + evaluation_binding；guarantee 由 profile×boundary **派生** |
| **何时不用** | 纯 guidance 可 `evaluator: none`，但不得标 critical（见 L1-03） |
| **反模式** | 测试复制义务原文；gate 字段写进 Control 单值 decision；无 binding 的 CTRL 编号狂欢 |
| **溯源** | F04 F12 · ADR-0023 |
| **支撑** | L1-03 L1-05 |

### L2-10 种子 oracle + 路由完整性表征

| | |
| --- | --- |
| **意图** | 对 important 义务维持可独立翻红的正/负判定；路由图防静默全表 |
| **做法** | important → oracle_pair 或显式 gap/deferred；路由表征覆盖命中/未命中/orphan |
| **何时不用** | 全量矩阵可 later；种子集不可空口「以后再补」却勾完成 |
| **反模式** | N/N passed = 受保护；负向夹具抄 checker 正则 |
| **溯源** | F06 · PLAN-0042 · oracle-inventory |
| **支撑** | L1-10 L1-12 |

### L2-11 语言 ownership（canonical vs projection）— *本 Stage 新增*

| | |
| --- | --- |
| **意图** | 执行对象单一 canonical 语言；面向人的边界对象可多语投影且 projection ≠ authority |
| **做法** | 先定哪类对象是 canonical；译文滞后不得改写源语义；门禁可分「源新鲜」与「译文新鲜」 |
| **何时不用** | 单语项目可省略投影层，仍须有 canonical |
| **反模式** | 三语正文三份权威；靠入口堆叠双语全文当 SSOT |
| **溯源** | ADR-0020 语言边界示例 · 本仓产品三语/知识单语实践 |
| **支撑** | L1-01（弱）；**不升 L1** 直至 Stage D 有跨项目失败证据 |
| **证据状态** | `needs-broader-evidence` |

## 4. L2 ↔ L1 覆盖矩阵

| L1 | 主要 L2 |
| --- | --- |
| L1-01 | L2-01 L2-08 L2-11 |
| L1-02 | L2-03 |
| L1-03 | L2-09 |
| L1-04 | L2-05 |
| L1-05 | L2-06 L2-09 |
| L1-06 | L2-02 L2-04 |
| L1-07 | L2-01 |
| L1-08 | L2-01 L2-03 |
| L1-09 | （原则面；落地形状 → Stage C metadata-policy） |
| L1-10 | L2-10 |
| L1-11 | L2-06 L2-07 |
| L1-12 | L2-02 L2-03 L2-10 |

无 L2 支撑的 L1：**无**（L1-09 的「模式」是封闭 schema 本身，Stage C 落文件）。

## 5. 明确延后 / 非本 Stage

| 项 | 归属 |
| --- | --- |
| 本仓 `SKILL.md` / `AGENTS.md` 瘦身 | 非 PLAN-0037 完成条件；Stage C 只定义**产物**薄入口 |
| 脚本 retire / 整夹清理 | ADR-0025 H2；今日 retire=∅ |
| 完整 Control Registry / CTRL 编号 portable 化 | H2c；L3-03 |
| 安装面 Task router | H2d；须 Stage C–D 后 |
| 全量 oracle 矩阵 | later；L2-10 种子即可 |
| Git consent 机械 evaluator | later / H2d |

## 6. Stage C 输入合同（预告，不在本文件展开目录）

Stage C 写 skill **形状**时，每个 references 文件内部三节对齐：

| 节 | 取自 |
| --- | --- |
| Hard Rules | L1-01…12（provisional） |
| Recommended Patterns | L2-01…11 |
| Project Customization | Stage A §4.3 L3-01…10 |

建议文件映射（可在 Stage C 改名，不得变成复制本仓 `docs/`）：

```text
instruction-architecture.md  ← L1-02,03,12 + L2-02,03,04
document-model.md            ← L1-07,08 + L2-01,11
metadata-policy.md           ← L1-09
capability-model.md          ← L1-06,14 + L2-02,04,09
decision-records.md          ← L1-01 + L2-01
discovery-and-verification.md← L1-04,10 + L2-05,10
migration-method.md          ← L1-11 + L2-06,07,08
```

## 7. 审查清单

- [x] L2 均有意图/做法/反模式，非口号
- [x] L2 不把本仓路径/CTRL/Phase 写成强制
- [x] O1/O2/O3 有书面裁定
- [x] L1↔L2 覆盖无空洞
- [x] 未改 INSTALLED 入口、未迁脚本、未建 Control Registry
- [ ] **人类确认：** provisional L1 freeze + L2-01…11 可进 Stage C

## 参考

- PLAN-0037（执行合同）· ADR-0020…0025 · RESEARCH-0012
