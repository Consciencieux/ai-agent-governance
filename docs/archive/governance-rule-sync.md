# 治理规则同步与元治理（TASK 计划）

> **Status: archived.**（已归档。归档即断言完成。）

**Target：both** —— 本仓库基础设施（`AGENTS.md`、`package.json`、`tests/`、ADR、本计划）与 skill 载荷（`scripts/check-doc-consistency.js`）。跨域同步义务见「受影响文件」；本计划是 Target 字段的首个用例。

### 任务目的

把本仓库的"轻量级治理"从默认状态升级为**被设计的系统**：同一规则跨两个域（本仓库 / skill 载荷）的同步由机械门禁保障，而非靠人工找齐；治理原则的划分标准与索引落成明文；"为何不狗粮"冻结为 ADR，不再每次口头解释。

### 当前问题

- 四个共享规则簇（consent 条款、受保护文件概念、语言政策、发布路径映射）跨两个域各自表达，同步靠人工。已有两次事故史：v0.5.1 保护文件摘要漏 3 项；v0.9.1 consent 例外只修了 4 个同步点中的 3 个，漏掉 SKILL.md，本次会话才发现。
- 载荷边界缺门禁的后果已实证：`_lib.js` 重构让 82/82 全绿的测试套件放行了"下游全崩"的载荷（已 revert，已补 payload 门禁）。但同一类"跨域一致性"问题在其余规则簇上没有机械防线，下一次事故只是时间问题。
- 治理原则的划分标准从未写明：为什么权限矩阵在 SKILL.md 而 git 策略细则在 references/policies/，只能靠读文件角色推断；也没有原则索引，"有哪些原则、各在哪"每次都要重拼。
- "本仓库为何不狗粮"没有记录，每次讨论都要重新论证；AGENTS.md 只用一句话带过（"skill distribution repository, lightweight governance"），不足以支撑决策。

### 提议方案

分三个递进阶段，按必要性排序：

**P1 · 共享规则簇机械门禁（必须）**

- 扩展 `scripts/check-doc-consistency.js`，新增 `--gate` 模式（沿用 `check-plan-delivery.js` 先例：默认 advisory exit 0，`--gate` 时 fail-closed）。
- gate 模式只包含两个可机械判定的簇：consent 簇与受保护文件簇；其余启发式检查（版本示例、链接等）保持 advisory。**前置条件**：现有 protected_lists 检查会对"仅顺带提到保护流程"的文档误报（本计划初稿即触发 12 项，因为正文提到了治理文件保护流程），升为 gate 前必须先收紧触发条件——只对**声称列举清单**的文档要求列全，不对引用流程的文档要求。完整清单见 `references/policies/governance-files.policy.md`（单一事实源）。
- consent 簇断言：四个同步点（`AGENTS.md` / `references/policies/git.policy.md` / `references/templates/agents-md.template.md` / `SKILL.md`）每处必须声明例外 A、例外 B、"只免追问不免回显"三项。
- 关键设计——**对存在的同步点做一致性断言**：skill 仓库形态下检查全部 4 处；被治理项目形态下只检查存在的 2 处（生成的 AGENTS.md + `docs/rules/git-policy.md`），缺失的同步点自动跳过。这样 `--gate` 在被治理项目里同样有意义，而不是误报。
- `package.json` 的 gate 组接入 `check-doc-consistency.js --gate`；`--gate` 模式同时输出启发式报告，因此 `check:all` 移除原有的重复调用（同一脚本不得跑两遍）。注意该脚本在 init-spec.json 的 copy 清单里，属载荷脚本，改动走治理文件保护流程。

**P2 · 明示化（建议）**

- 计划格式新增 `Target: payload | repo-infra | both` 字段；`Target=both` 时必须列举每个域的同步点。本计划即为首例。
- 影响面核对（Impact-face check）收尾时用 Target 判断越界：改了声明域之外的文件 → 报告说明。保持人工核对，不做 fail-closed；机械 advisory 留待实际违规出现后再硬化。
- 划分标准（judge rule）写入 AGENTS.md：SKILL.md 策略层 = 每次执行必须读的 skill 执行者规则；references/policies/ = 被治理项目的内容工件；AGENTS.md = 本仓库规则。判据：执行具体任务时，agent 不读这条会不会做错。
- 原则索引写入 AGENTS.md：每条原则 ×（名称 | 权威所在 | 适用对象），只做指针不复述内容。条目数**按实际清点**，不预设——清点是 P2 的第一步（SKILL.md 策略层现为 13 节，另需并入 release.md、init-spec、lifecycle 里的原则，口径在清点时确定）。

**P3 · ADR-0006「本仓库为何不狗粮」（建议，P1/P2 完成后写）**

- 三条理由：风险错配（validator 校验软件项目风险，本仓库四种真实失败模式它一个不覆盖）；循环依赖（生产者的治理不得依赖产品，否则产品 bug 先摧毁自己的治理）；形态错配（无 src/features 对象，强上会制造空壳工件，违反自己的反虚构原则）。
- 后果声明：本仓库治理 = release flow + plans/archive + ADR + tests + 门禁；`verify_governance.js` 在此 exit 1 是特性不是缺陷。

### 受影响文件

- `scripts/check-doc-consistency.js` —— 新增 `--gate` 模式；载荷脚本，走治理文件保护流程
- `package.json` —— gate 组接入 `--gate` 步骤
- `tests/run-tests.js` —— `--gate` 模式测试（含被治理项目形态下同步点缺失自动跳过、consent 簇回归测试）
- `AGENTS.md` —— Target 字段定义、judge rule、原则索引
- `docs/design-decisions/adr-0006-no-dogfooding.md` —— 新增，不狗粮决策记录（共享单语简体中文；文件名沿用现有 ADR 的小写编号加短横线惯例，不得用通配符——交付门禁只认字面路径）
- `CHANGELOG.md` —— Added（--gate）+ Changed（protected-files 升格为 gate）
- `docs/{en,zh-CN,zh-TW}/plans/governance-rule-sync.md` —— 本计划（三语）

同步组复核（非交付声明）：本次改动不新增提示词、不改 validator 检查项，按 sync group 规则核对后预期无需更新用户手册与校验器文档；实施时确认。此处刻意不写文件名——交付门禁会把「受影响文件」区块内的每个反引号 token 当作交付声明。

关于交付门禁的语义：本计划是实施计划（非纯设计计划），不带 `Status: design plan` 标记，因此 `check-plan-delivery.js --gate` 会扫描它。**在 P3 完成前，ADR 文件尚不存在，`--gate` 会 exit 1 并挡住 release——这是预期的 fail-closed 行为**，不是缺陷；归档由 release 流程在实施完成后执行。

### 风险

- `--gate` 扩大 `check-doc-consistency.js` 职责（建议层 + 局部 gate 混合）：缓解——gate 只含两个机械判定簇，启发式检查仍归 advisory，两个模式共享解析代码。
- consent 簇同步点在文件重命名或路径调整后误报：缓解——同步点清单集中为脚本顶部常量，单处维护。
- 原则索引随文件移动而漂移：缓解——gate 增加"索引指针必须解析"断言。
- Target 字段只在计划被写时生效（本会话 13 文件大改动根本没写计划）：缓解——Target 不解决执行纪律问题，但把越界从"事后惊讶"变成"计划里就可见"。

### 验证方法

- 回归验证（consent 簇）：人为移除四个同步点任一一处的例外 A 标记 → `--gate` exit 1 并指名文件；恢复后 exit 0。
- 被治理项目形态：Phase-C INIT 产物中跑 `--gate` → 缺失的同步点自动跳过，不误报。
- `npm run check` 全绿（含新 gate 步骤）；不带 `--gate` 的 advisory 模式保持 exit 0（建议层契约不变）。
- 原则索引的每个指针可解析（由 gate 断言，而非人工核对）。
- `adr-0006-no-dogfooding.md` 存在于 `docs/design-decisions/`，状态 Accepted；此时本计划的全部声明可解析，`check-plan-delivery.js --gate` 对本计划 exit 0，release 不再被挡。

---
