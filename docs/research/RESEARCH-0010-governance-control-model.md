---
id: RESEARCH-0010
status: Active
version: 1
---

# RESEARCH-0010：Governance Control 系统模型

本 RESEARCH 是 **系统模型（System Model）**：描述 Generation-2 需要把「治理控制」看成什么对象、它与 evaluator / gate / test 的关系、Generation-1 如何把这些职责散落在 Markdown / JS / CI / tests 里、以及为什么需要显式 identity。规范裁决在 ADR-0023。KEEP / WRAP / EXTRACT / REWRITE / RETIRE 不在本文（Phase 4）。Dispatcher 不在本文（Phase 5）。

## 研究对象

```text
Control
  = 一条可引用的治理义务及其绑定关系
```

它不是一篇 policy 文件，也不是一个 JS checker。它是连接下列层的**中间对象**：

```text
identity
authoritative semantics
applicability
evaluator binding
evidence expectation
decision semantics
profile applicability
```

本文描述这些层在系统里如何分开；不锁定 YAML 字段名。

## 四层混淆（Generation-1 常态）

Generation-1 常见把下面四件事写成「一条规则」：

```text
Rule semantics     必须成立什么
Evaluator          用什么机制检查
Gate               在哪条工作流里阻断或告警
Test               如何证明 evaluator 没坏
```

它们经常同居：`check-secrets.js` 同时持有「什么算密钥」的模式表、扫描算法、exit code 决策；测试再抄一份正则。`git.policy.md` 与 `AGENTS.md` 各写一遍确认范围。`npm run check:full` 把许多 evaluator 绑成一次门禁，Agent 再靠文档记得何时该跑。

观察结论：

```text
同一文件 ≠ 同一 Control
同一脚本 ≠ 同一语义
同一 exit code ≠ 同一 decision semantics
测试绿 ≠ 语义有单一权威
```

## 概念关系

```text
Control identity
        │
        ▼
Authoritative semantics          ← 唯一事实源（义务 / invariant）
        │
        ├── applicability        ← 给定 context，这条 Control 理论上是否适用
        │                         （Phase 3：可陈述；Phase 5：可自动路由）
        │
        ├── profile binding      ← repo / skill 作为 consumer，不是第二份语义
        │
        ├── evaluator binding    ← 每个 profile 可绑不同检查机制
        │
        ├── evidence expectation ← 通过时留下什么（可缺省）
        │
        └── decision semantics   ← allow / deny / warn / require-review
                                   以及默认 vs --gate / --release-gate 分层
```

**Shared semantic authority** 只出现在 semantics 这一层：

```text
shared semantic authority
        ↓
   ┌────┴────┐
   ▼         ▼
Repo Profile  Skill Profile
   │         │
   ▼         ▼
evaluatorA   evaluatorB     ← 实现可以完全不同
```

「共享语义」若变成「共享同一个 `scripts/*.js`」，就退回 FINDING-0001 的 accidental coupling。反过来：两个 profile 各写一套语义，即使脚本互不调用，也是 duplicated authority。

## Generation-1 散落面

对照 RESEARCH-0001（prompt → 选门禁 → JS → exit code）与 RESEARCH-0009（`references/` 六类作用）：

| 层 | Gen1 常见载体 | 实际承担 |
| --- | --- | --- |
| 义务陈述 | `SKILL.md` / `AGENTS.md` / `references/policies/*.md` | 语义，常重复 |
| 适用性 | Agent 读文档后自判；偶发 `if existsSync` | 几乎无显式 identity |
| 求值 | `scripts/*.js`、`repo-tools/*.js` | 语义 + 算法 + 决策经常写在一起 |
| 门禁组合 | `package.json` scripts、CI、`skill-release.md` | 多条 Control 的编排，不是 Control 本身 |
| 证据 | 偶发 `--json` / drift-report | 无统一 evidence model |
| 测试 | `tests/suites/*.test.js` | 有的验证 evaluator，有的再实现一遍规则 |

身份今天靠**路径与函数名**（`check-secrets.js`、consent cluster）。路径一变，引用全断；同一脚本里塞进第二条 invariant 时，外部仍以为只有一个控制。

## 为什么需要显式 identity

1. **引用稳定**：Roadmap / CONTROL-X / 入口指针需要指向 Control，而不是指向某次重构后的文件名。
2. **语义只定义一次**：repo 与 skill 引用同一 identity，各自绑 evaluator。
3. **遗忘测试**：可以问「Agent 完全忘记这条 Markdown 之后，哪些 guarantee 仍成立？」——答案必须挂在 identity 上，而不是挂在「有没有读到 AGENTS」。
4. **拆分准备**：Phase 4 对 JS 做 KEEP / WRAP / … 时，拆的是 evaluator，不是偷偷改语义。

编号形态与 PLAN / ADR 同类（`CTRL-xxxx`）只是候选；权威选择见 ADR-0023。

## 设计问题矩阵

每问：Gen1 观察到的需要、候选模型、反例、裁决权威（本文不裁决）。

| Q | 问题 | Gen1 观察 | 候选 | 反例 | 裁决 |
| --- | --- | --- | --- | --- | --- |
| Q1 identity | 控制如何被引用？ | 路径 / 脚本名 / cluster 名 | 稳定 `CTRL-xxxx`；或继续用文件路径 | 一个 JS 含两条 invariant | ADR-0023 |
| Q2 semantics ownership | 义务写在哪？ | policy、入口、JS 注释、测试字符串 | 单一 semantics 引用；JS 不得自封权威 | consent：AGENTS 与 git.policy 双写 | ADR-0020 + ADR-0023 |
| Q3 applicability | 何时适用？ | Agent 自判；部分 `existsSync` | 陈述式 context（任务类 / 路径 / 阶段）；不要 Dispatcher | 「改文档」时 freshness 适用，consent 不一定 | ADR-0023；自动路由 = Phase 5 |
| Q4 profile | 与 repo/skill 关系？ | `scope = both` 或直接跑对方脚本 | consumer profiles 引用同一 identity | 术语门禁已拆出 vs freshness 仍 repo→skill | ADR-0020；绑定形态 ADR-0023 |
| Q5 evaluator | 谁检查？ | 脚本即规则 | profile 级绑定；可缺省（纯 guidance） | 无脚本的 consent 仍是 Control | ADR-0023 |
| Q6 evidence | 留下什么？ | 不稳定 | 可选 slot；无 consumer 则不建字段 | 多数 checker 只有 stderr | ADR-0023 |
| Q7 decision | pass 是什么意思？ | 同一脚本 0/1，flag 改变语义 | decision 分层写在 Control，不藏在 argv | freshness 默认 advisory、`--release-gate` 阻断译文 | ADR-0023 |
| Q8 guarantee | 忘了规则还剩什么？ | 关键保证仍靠记住 Markdown | 每条 Control 声明当前 guarantee 级（L0–L3 投影） | ADR-0022 机械优先 | ADR-0023 记录级；升级路径 Phase 4–8 |
| Q9 lifecycle | 版本怎么走？ | 无 | identity 稳定；语义变更可版本化；归档 ≠ 控制废弃 | Plan archive ≠ control obsolete（ADR-0019） | ADR-0023 最小集；细版本可后置 |
| Q10 references | 依赖谁？ | 隐式 `require` 与文档互指 | 显式 semantics / evaluator 引用；禁止入口复述变权威 | 原则索引指针合法；正文复制不合法 | ADR-0023 |

字段存在原则（观察，供 ADR 收紧）：**没有真实 consumer 或核心语义需求，就不增加 slot。** 类别、标签、优先级、severity 在 Gen1 Finding/Plan 上已膨胀过。

## Vertical slice 观察（四个真实控制）

取样来自 PLAN-0034 与 RESEARCH-0006 ownership 表。本文只观察；映射结论在 ADR-0023。不拆 JS。

### Slice A — Secret protection

- **义务（散落）**：暂存区不得出现凭证类材料。模式表写在 `scripts/check-secrets.js` 内，几乎没有独立 policy 段落。
- **Profile**：skill 安装该脚本；repo 预提交手动跑同一文件（repo→skill accidental）。
- **Evaluator**：强机械（staged diff + 模式）。
- **Decision**：命中则 exit 1；不打印秘密本身。
- **Agent 遗忘**：若仍调用脚本（hook / 清单），保证可在 L1/L2 存活；若只写在 AGENTS「提交前跑」，遗忘 = 无控制。
- **Test 风险**：套件若复制同一组正则，验证的是「两份正则仍一致」，不是独立的语义 oracle。

### Slice B — Git consent / write policy

- **义务（散落）**：一次确认覆盖 add→commit→push；独立危险操作另确认。repo：`AGENTS.md` § Git Operation Safety Protocol；skill：`references/policies/git.policy.md` § 确认范围。RESEARCH-0006：`authority: duplicated`，`owner: core` 尚无物理单一载体。
- **Evaluator**：部分机械（release-manager consent、consistency consent cluster）；大量靠 Agent 遵守。
- **Decision**：协议层阻断写操作；不是单一 JS exit。
- **Agent 遗忘**：Markdown 被忘则 L0 塌陷；机械 cluster 只覆盖已编码的同步点，不能代替确认语义。
- **跨 profile**：CONTROL-X 候选——同一 canonical 负例应同时打中两侧实现；今天没有同一 fixture。

### Slice C — Document freshness

- **同一脚本、至少两条 invariant**：`scripts/check-doc-freshness.js` 同时做（1）治理文档相对代码活动是否过旧（默认 advisory）；（2）译文相对源是否过旧（`--release-gate` 阻断）。RESEARCH-0006 还拆成「Repo 文档新鲜度 / 被治理项目文档新鲜度 / 翻译新鲜度」三行 ownership。
- **教训**：Control identity 若等于脚本名，会把不同义务、不同 profile、不同 decision 压成一个对象。
- **Agent 遗忘**：advisory 模式本来就不阻断；遗忘与「看见了但继续」在默认模式下结果相近。release-gate 路径才有工作流阻断。

### Slice D — Plan delivery

- **义务**：计划 Affected Files / 行为声明必须在工作树兑现。载体 `repo-tools/check-plan-delivery.js`（REPO-ONLY）。
- **Profile**：几乎纯 repo；被治理项目无此脚本。
- **Evaluator**：机械（路径存在、锚点、writes/wires）。
- **Decision**：`--gate` 才 fail-closed。
- **Agent 遗忘**：若 `check:all` / 发布步骤仍调用，保证不依赖记得「对账」这句话。
- **Test**：套件主要在测 extractor / 规范化规则，接近 evaluator 测试；语义「声明即交付义务」在脚本头注释，而不在独立 semantics 文件。

四问对照（slice 级，供 ADR 收口）：

| 问题 | A Secret | B Consent | C Freshness | D Plan delivery |
| --- | --- | --- | --- | --- |
| 语义是否只定义一次？ | 实际在 JS | 否，双写 | 混在脚本与 flag | 在脚本注释 + 计划格式 |
| 同语义不同 evaluator？ | 尚未；两侧跑同一文件 | 需要；尚未 | 文件共享掩盖了多语义 | 单 profile |
| 忘记 Markdown 后？ | 仅当调用链仍在 | 大部分消失 | advisory 本就弱 | 调用链在则仍在 |
| test 验证什么？ | 易变成第二份模式表 | 同步点扫描 ≠ 确认语义 | flag 行为 | extractor |

## 与已有模型的衔接

- RESEARCH-0001：缺的中间层就是 Control。
- RESEARCH-0002：existence / regex / structure / consistency / tests 是 **evaluator 机制类**，不是 Control 分类法。
- RESEARCH-0006：ownership 行是 concern 级；本模型把 concern 提升为可引用 Control。`owner: core` 仍是概念 owner，不是目录名。
- ADR-0020：共享语义单一权威、I1–I4、CONTROL-X 契约——本模型必须能表达，而不是另写一套 ownership。
- ADR-0022：机械优先 = 提高 Control 的 guarantee，不是把 Control 写进更短的入口。

## 非目标（观察边界）

```text
不实现 Dispatcher / context detector
不拆 check-doc-consistency.js 或移动 references/ 政策单体
不把 schema 默认放进 references/（会变成 payload 幻觉）
不提前建 governance-core/ 目录
不给每个 Gen1 capability 填 KEEP/WRAP
不把 Roadmap 上的 L0–L3 当成已实现的 runtime
```

## 对后续设计的影响

若采纳「Control 为一级对象、slot 最小、身份稳定、物理家后置」，Phase 3 的可检验产物是：一份规范（ADR）+ 本模型 + 四个真实控制的映射记录。机器可读 YAML 可以等到出现第二个真实 consumer（生成器、Dispatcher、或 CONTROL-X runner）再物化；过早物化会重演 Finding 元数据膨胀。
