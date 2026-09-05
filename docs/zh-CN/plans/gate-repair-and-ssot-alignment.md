# 门禁修复与单一事实源对齐（TASK 计划）

[English](../../en/plans/gate-repair-and-ssot-alignment.md) · [简体中文](gate-repair-and-ssot-alignment.md) · [繁體中文](../../zh-TW/plans/gate-repair-and-ssot-alignment.md)

> **Status: implemented.**（状态：已实现。）已在当前工作树交付；发布时归档。响应 2026-09-05 一次只读审计：多个门禁存在但失效、接线错误或强于其声称——受保护文件簇解析出 0 行、`check:payload` 漏掉守护 payload 编辑的那个门禁、CI 只跑 6 个门禁中的 2 个、`plans:delivery` 不带 `--gate` 运行、SKILL.md frontmatter `version` 永不被检测、归档计划携带非规范 Status 行。同次审计还确认了五处单一事实源违规（三份相互矛盾的发布流程、zh-CN/zh-TW 反向的未决声明、无人消费的 README 模板块、残缺的验证器检查清单、权限矩阵行不一致）。

**Target: both** —— `payload` 修复 INSTALLED 脚本行为（`scripts/check-doc-consistency.js`、`scripts/generate-governance.js`）与 `references/` 内容完整性（`references/templates/sub-skills.md`、`references/policies/governance-files.policy.md`、`SKILL.md`）；`repo-infra` 修复测试夹具、npm 接线、CI、仓库文档与归档状态。两个域分别列在“受影响文件”中。

### 任务目的

让现有门禁集真正兑现 AGENTS.md 已宣称的内容，并在审计证实存在多重权威之处恢复单一事实源。对于已知规则完全没有兜底的地方，添加成本最低的机械检查并用反向测试证明——不超出发现所要求的新门禁类别。

### 当前问题（2026-09-05 确认）

- **受保护文件簇已失效。** `scripts/check-doc-consistency.js` 将政策表限定为 `policy.slice(0, policy.search(/\n## /))`；真实文件中第一个 `## ` 标题（字节 217）在表格（字节 470）之前，因此 `protectedPaths` 恒为空，整个完备性循环从不执行。该簇唯一的反向测试使用无标题夹具，证明的是一条生产中从不执行的代码路径。
- **范围分级 npm 入口组合错误。** `check:payload`（文档指定给 `references/` + `SKILL.md` 编辑的档位）漏掉了 `check-doc-consistency --gate`——即守护恰好位于这些文件中的 consent 标记与受保护清单的门禁。`check:docs` 对称地漏掉 `docs:layout`。两者都与 AGENTS.md 范围表矛盾。
- **CI 只跑 6 个门禁中的 2 个。** `.github/workflows/ci.yml` 只运行 `npm test` + `docs:parity`；layout、consistency、hygiene 与 role-completeness 从不使 CI 失败。AGENTS.md 的“fails CI”表述目前不成立。
- **`plans:delivery` 从不设门禁。** `npm run plans:delivery` 不带 `--gate` 运行 `check-plan-delivery.js`，所以 `check:all` 不强制计划交付，尽管 AGENTS.md 与 release.md 都要求。
- **SKILL.md frontmatter `version:` 不可达。** 版本正则要求带引号的 `"version"`/`"governance_version"` 形式；YAML 的 `version: 0.13.0` 永不匹配。三个版本同步点中有一个没有任何机械兜底。
- **归档计划携带非规范 Status 行。** `docs/archive/` 共 21 个文件：仅 anti-patch-development 与 gate-tiering-evidence-boundary 携带 `Status: archived`；若干仍写“已实现（待 Release 归档）”或“状态：…”，5 个以上根本没有 Status 行。plan-status 簇只扫描 `docs/*/plans/`，从不扫描 `docs/archive/`。
- **发布流程标记存在三个覆盖不一致的版本。** `references/workflows/release.md`（权威）携带 6 个需求标记；`references/templates/sub-skills.md`（安装进被治理项目的副本）只带 3 个——`docs.parity_passed`、`sync.passed`、`plan.delivery_verified` 缺失，release.md Phase 4 第 3 步（三个 release-gate）与第 11 步（打包与上传）也不见。
- **zh-CN/zh-TW 架构页断言一个已过时、反向的事实。** 两者都说角色完备门禁“保持红色直到裁定——目前是 governance-files.policy.md 与 feature-doc.template.md”；英文页说两者已解决。`init-spec.json` 显示 `undecided: {}`。
- **`.governance/README.md` 有两个模板且 policy 那份是死的。** `governance-files.policy.md` § .governance/README.md 生成模板 定义了一个无人消费的 Tracked/Ignored 块；生成器实际输出 `references/init-spec.json` 中的 `static content` 变体。
- **验证器检查清单在其安装副本中残缺。** `scripts/verify_governance.js` `DEFAULTS` 列出 21 项检查，含 Lock check、Git policy、Git policy check、Secret scan gate、Sync groups check；`sub-skills.md` 的 `governance-validator` Checks 行只列产物类别，漏掉这五个工具检查与 `.governance/git-policy.json`。
- **权限矩阵不一致。** `references/templates/agents-md.template.md` 携带“Modify 3+ Files at Once | confirmation required”行，而 `SKILL.md` § Agent Permission Model（索引中的权威）没有，尽管该规则真实存在（`lifecycle.policy.md` § 规模分级）。

### 提议方案

#### A. 门禁修复（payload + repo-infra）

##### A1. 受保护文件解析器——在政策自身范围内提取表格

将 `slice(0, search(/\n## /))` 窗口替换为提取政策**第一个内容段内部**的第一张 Markdown 表格（更简单也更稳：解析文件中第一张表格，其匹配落在引言段之后；不要在第一个 `## ` 标题处截断，因为政策自己的标题先于其表格）。把现有反向测试夹具重塑为真实文档形态（标题 + 表格），使回归测试覆盖生产路径。单一事实源豁免保持限定在同一段。

##### A2. npm 范围分级组合

使 `package.json` 与 AGENTS.md 范围表一致：
- `check:docs` = test + parity + consistency `--gate` + layout
- `check:payload` = test + layout + consistency `--gate` + hygiene `--gate` + role-completeness `--gate`

##### A3. CI 接线

`.github/workflows/ci.yml` 增加一步运行 `npm run check`（全部 fail-closed 门禁）。`verify_governance.js` 徽章步骤保留 `|| true`（ADR-0006）。更新 AGENTS.md 相应表述以反映新事实（门禁在 CI 中运行）。

##### A4. `plans:delivery --gate`

将 `package.json` 的 `plans:delivery` 改为 `node scripts/check-plan-delivery.js --gate`，使 `check:all` 强制交付。

##### A5. SKILL.md frontmatter 版本检查

扩展版本簇以解析 SKILL.md 的 YAML frontmatter 块（无引号 `version: X.Y.Z`）并与仓库当前版本比对。反向测试：仅改 frontmatter → 门禁失败。

##### A6. 归档计划 Status 规范化

- 将每个 `docs/archive/*.md` 的 Status 行改写为规范归档形式（`> **Status: archived.**（已归档。归档即断言完成。）` 风格，按生命周期策略）。凡是承载交付信息的旧状态文本，作为嵌套说明保留（anti-patch-development 已是如此）。
- 扩展 plan-status 簇（或按冻结责任规则增加 archive-status 兄弟簇——优先扩展现有簇，因为同属 plan-status 域）以扫描 `docs/archive/` 中缺失或非规范的 Status 行，`--release-gate` 时 fail-closed，配反向测试。

#### B. 单一事实源对齐（payload + repo-infra）

##### B1. 子技能发布流程对齐

在 `references/templates/sub-skills.md` 中，将 release-manager 需求清单补至与 `release.md` 相同的 6 个标记，并恢复 Phase 4 第 3 步（三个 release-gate）与第 11 步（打包 + 上传），措辞结构一致。新增一致性测试复现审计的方法：从两文件提取标记集，断言 sub-skills ⊇ release.md 的需求标记，fail-closed。

##### B2. zh-CN/zh-TW 架构未决声明

将 `docs/zh-CN/architecture.md` 与 `docs/zh-TW/architecture.md` 中“当前是 X 与 Y”的过时句替换为已解决的事实（两者现为 INSTALLED 产物；`undecided` 为空），与英文页一致。

##### B3. 删除无用的 README 模板块

删除 `references/policies/governance-files.policy.md` § .governance/README.md 生成模板（或缩减为指向 `init-spec.json` 产物 `content` 的指针），保留政策的 tracked/ignored 表完好。为该节加入测试，断言它不重复第二个 .governance/README.md 模板。

##### B4. sub-skills.md 验证器检查清单

补全 `governance-validator` Checks 行，使其按 `DEFAULTS` 顺序枚举全部 21 项检查（采用权威清单的格式；无计数漂移）。

##### B5. 权限矩阵行

将“Modify 3+ Files at Once | confirmation required”行补入 `SKILL.md` § Agent Permission Model，与 `references/templates/agents-md.template.md` 及 `lifecycle.policy.md` § 规模分级 一致。

### 已裁定不做 / 延后

- **C5 `.gitattributes` 机械校验 —— 不做。** 存在性检查证明不了内容（一个没有 `text=auto eol=lf` 的 `.gitattributes` 照样通过），内容校验则越界成不成比例的机制；且该规则本身已声明 INIT 不生成、被治理项目自行添加。机制测试不通过，维持散文规则。
#### C6 评审证据绑定 —— 延后的决策，不是遗忘

**问题。** `release-manager.js execute` 对高风险发布的把关，依据是提案里的
`reviewStatus` 等于 `completed` 或 `explicitly-approved`。该值读自调用方提供的
提案 JSON。`plan` 从不产出这两个值（它只产出 `required` / `suggested` /
`not-required`），所以走到该分支的提案必然经人手编辑——这正是 human-in-the-loop 的
预期形态，但也意味着这道门禁校验的是一句**声明**，而非"评审发生过"。审计已实测：
手写一份 `reviewStatus: "completed"` 的提案即可产出带签名的 annotated tag，退出码 0，
全程没有任何评审。对照同一函数里的 `headSha` 绑定——它真的执行 `git rev-parse HEAD`
并在漂移时中止。

**当前风险。** 低到中等，受威胁模型限制：行为者必须已有写权限、手写 JSON、并传入
`--yes`。这是"Agent 抄近路"的自证漏洞，不是外部攻击面。残余危害是一个断言"已评审"
而评审从未发生的签名标签。

**本轮不做的原因。** 真正的绑定需要两样尚不存在的东西：评审证据工件（review-manager
产出、绑定到具体 commit 的记录）与 `execute` 据以核对的工作流。两者都是新机制，机制
测试不通过：本变更集的需求是修复失效门禁，该需求不足以独立证成"发明一套证据格式加一
条校验流程"。本轮做的是诚实最小集——`execute` 现在明确打印该值为自证声明，签名标签
不再隐含"已评审"。

**不采用提案摘要签名的原因。** 审计给的更廉价方案是让 `plan` 对提案签名或哈希，使
`execute` 能识别手写文件。否决：它检测的对象不对。手工编辑提案正是**已文档化的批准
路径**——开发者在逐项确认后写入 `explicitly-approved` 是在遵循流程，不是在绕过它。
摘要签名会把这条合规路径变成门禁失败，同时仍然无法证明评审是否发生。它买到的是"文件
来自 `plan`"，而这不是本问题要证明的性质。

**重新评估的触发条件**（任一成立）：发布批准需要证明**评审者身份**；评审证据必须绑定
到具体 commit；合规要求高风险发布留存审计轨迹；或 review-manager 因其他原因开始产出
持久工件（届时校验侧的成本很低）。在此之前维持诚实声明。触发时创建独立 TASK 计划——
不要把它塞进无关的变更集。

### 验证（证据等级）

- 每项修复都配备机械反向测试，能在真实文件/真实夹具上复现原始失效模式（测试证明门禁能变红——不只是它是绿的）。
- `npm test`（全部套件）+ `npm run check` + `npm run check:all` 退出 0。
- plan-status/archive-status 簇的 release-gate 行为用变异副本以 `--release-gate` 验证。
- 除 plan-status 扩展外不新增门禁类别；责任表其余不变。

### 受影响文件

**payload（INSTALLED / SKILL-INTERNAL 行为与内容）：**

- `scripts/check-doc-consistency.js` —— A1（受保护文件表格提取）、A5（frontmatter 版本）、A6（archive-status 扫描）
- `scripts/generate-governance.js` —— A5 仅核实：哨兵已与 package.json / init-spec 一致（0.13.0），无需改动。
- `references/templates/sub-skills.md` —— B1（发布流程标记 + Phase 4 步骤）、B4（验证器检查清单）
- `references/policies/governance-files.policy.md` —— B3（无用 README 模板块移除）
- `SKILL.md` —— B5（权限矩阵行）；版本 frontmatter 必须保持同步（A5）

**repo-infra（docs、测试、接线）：**

- `package.json` —— A2（范围分级组合）、A4（`plans:delivery --gate`）
- `.github/workflows/ci.yml` —— A3（运行 npm run check）
- `AGENTS.md` —— A3 措辞、A2 表格核对（已正确——仅核实）
- `docs/en/architecture.md` —— B2（陈旧工件计数措辞；该修复涉及三语树）
- `docs/zh-CN/architecture.md` —— B2
- `docs/zh-TW/architecture.md` —— B2
- `docs/archive/` —— A6：21 份归档计划的 Status 行全部规范化（目录级改动，非单文件）
- `tests/suites/consistency.test.js` —— A1 夹具重塑、A5 反向测试、A6 反向测试、B1 标记集测试
- `tests/suites/docs.test.js` —— A2 组合测试（package.json 入口等价）
- `tests/support/helpers.js` —— 未改动：新夹具助手只被单个套件使用，提取进共享层属于过早抽象（工程克制）。
- `CHANGELOG.md` —— 发布条目
