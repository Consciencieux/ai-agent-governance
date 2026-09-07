# 载荷治理教训迁移：声明-机制差距与验证反馈闭环（TASK 计划）

> **Status: implemented.**（已实现，待 Release 归档。）

**Target：both** —— `payload`：`references/policies/*.md`（lifecycle / testing / coding）、`references/workflows/ci.md`、`references/templates/agents-md.template.md`（经裁定—见下）；`repo-infra`：`CHANGELOG.md` [Unreleased] 条目、三语计划文件、目标链路断言测试（若新增，见 §验证方法 第 4 条）。

**agents-md.template.md 裁定：直接修改。** 该模板把 CHANGELOG 内容边界与结构契约写入生成项目的 AGENTS.md；与之相邻的"结论/测试要点"归纳（变更归类、测试保护指针）同样应带上本次的声明-机制一致性要点，避免生成项目 AGENTS.md 与 docs/rules/*.md 脱节。**不写"如需要则跳过"。**

### 任务目的

把 0.13.0 之后本仓库反复踩出的教训——特别是「声明一套、机制覆盖另一套」这一缺陷类——写成被治理项目可直接遵守的规则正文，而不是留为仓库内部记忆。目标：治理项目的 Agent 在写规则/测试/CI 时，能读到「机械覆盖必须与声明一致」的判断标准，并把「空洞测试」「枚举只断言子集」识别为缺陷。

### 当前问题

- 本仓库在 v0.13.1/v0.13.2/0.14.0 三次踩中同一类缺陷：规则声明了集合，机制静默只覆盖子集（5 个同步点验 2 个、hygiene 扫描漏 6 个门禁、plan-delivery 漏 2 棵树、CI 只跑 2/6 门禁、shape guard 关闭真实保护）。每次都在 AGENTS.md 记录教训，但 **AGENTS.md 是本仓库文件，不随载荷分发**——治理项目完全读不到。
- 类似的「空洞测试」（断言子集而非完整集合、移除被测功能测试仍绿）在 v0.13.2/0.12.0 各出现过，也未落进载荷的 `testing.policy.md`。
- 载荷 `lifecycle.policy.md` Phase 4 已有「证据要求：裸命令+真实输出摘录」，但比本仓库 AGENTS.md 的证据等级表（机械 / 人工背书 / 未验证）**少了三级区分**——治理项目里「✓ 通过」无法区分「机械条件满足」与「语义正确」。
- 载荷 `release.md` 已写明治理项目的四处版本同步点，但「同步点清单必须与机械验证一致」这条**判断标准本身**没有作为规则出现。

> **范围外/已完成声明**：CHANGELOG 内容边界（记录变更/影响/迁移，不记录验证过程）与 CHANGELOG 结构契约（分类标题规范、重复标题阻断、已发布节不可追加、`[Unreleased]` 重建）**已随上一轮工作写入载荷并验证落地**（`lifecycle.policy.md` §CHANGELOG 内容边界 + §CHANGELOG 结构契约；`agents-md.template.md` Content boundary；治理项目端到端：重复分类头 `--gate` exit 1，10/10 落地，CHANGELOG [Unreleased] 已记录）。**它们不属于本 plan 的待办**——本 plan 只覆盖下列未落地教训：D1 声明集合≠机制覆盖、D2 移动后复查枚举、D3 形态守卫关闭保护、D4 空洞测试、D5 断言完整集合、D6 证据等级、D7 CI 门禁完整性。

### 提议方案

治理项目已具备对应基础设施（`lifecycle.policy.md` 的 Phase 4、`testing.policy.md` 的测试保护、`coding.policy.md` 的变更归位、分发到项目 CI 的 `ci.md`）。方案是把下面四项教训**写入现有章节**，不新增章节标题、不新增脚本、不新增门禁；每条以「判断标准」形式表述，而不是复述本仓库的事故。

#### 1. 声明-机制一致性（D1 + D2 + D3 合并为一节）

写入 `references/policies/lifecycle.policy.md` Phase 4（验证序列）之后，作为一节「声明与机制的差距」；同时在 `references/policies/coding.policy.md` 的「变更归位与残留清理」加入一条。

要点：
- 规则声明的是集合（同步点、扫描目、CI 门禁、检查清单），机制必须覆盖同等范围；「声明了 5 处、机制验 2 处」与「声明覆盖所有源码树但枚举漏了 1 棵」属于同一缺陷类，修复时必须补齐声明或缩小机制，不能只改文档。
- 文件移动/重命名/目录拆分后，必须复查所有硬编码目录枚举与守卫：`SCAN_DIRS`、`SEARCH_ROOTS`、角色清单、扫描集合、路径常量。裁判标准：机械证明「声明集合 = 恢复最终覆盖集合」，不能凭印象。
- 形态守卫（「本项目不含 X 布局 → not applicable → exit 0」）不得顺带关闭真实保护：守卫的成立条件必须是声明的、窄的（例如「缺 `references/init-spec.json`」），而不是树级宽条件（例如「缺 `references/`」）。

#### 2. 测试活性（D4 + D5 合并为一条）

写入 `references/policies/testing.policy.md` 的「测试保护」之后。
- **事实源规定**：「声明集合」必须有出处，Agent 不得凭感觉判定"这就是完整集合"。声明集合的候选事实源：`init-spec.json` 的 artifacts 清单、`check-doc-consistency.js` 的簇注册表、`AGENTS.md` 门禁表、`sub-skills.md` 的子技能清单；机制集合 = 实际扫描目录 / 实际注册测试 / 实际 CI job。两者必须可对照。
- **优先级规定**：对门禁、枚举、注册表、关键路径测试，必须提供负向 fixture 或 mutation evidence，证明测试确实覆盖目标；普通业务测试不强制逐个做删除变异——避免把 mutation testing 变成新的形式主义。
- 空洞测试定义：移除被测功能后测试仍绿 = 测试未覆盖功能；断言必须针对完整目标集合，而不是子集（枚举断言、子集断言都是空洞）。
- **未机械化声明**：本计划新增的是 human-attested / unverified judgement standards，不声称它们已获得 mechanical enforcement——写入后它们是规则文字，不自动阻止错误。

#### 3. 证据等级（D6）

写入 `references/policies/lifecycle.policy.md` Phase 4 的「证据要求」段。
- 区分三级：机械（marker/结构/路径/正则/文件存在 → 「机械条件满足」，非「行为正确」）；人工背书（需要用户参与，如发布批准、翻译审查）；未验证声明（仅自述，无独立验证）。「✓ 通过」必须挂这三级之一，否则不能声称验证完成。
- **不新增机械门禁**：本次只设立证据等级的文字标准；是否升级为 mechanical enforcement 由后续观察决定，本计划不预先声称。

#### 4. CI 门禁完整性（D7）

写入 `references/workflows/ci.md`（分发到治理项目的 CI 模板文件）。
- **限定条件**：仅检查项目实际启用且适用的门禁。判定链为：若项目无 CI 维护 → 不适用；有 CI 但该门禁不可用（脚本缺失/平台限制）→ 必须明确标记 `not applicable` 或 `deferred`，**不得伪装成通过**；`echo "No <tool> configured yet"` 是警告占位，不是已执行。
- **与现有降级策略一致**：不推翻 `SKILL.md`「CI 降级策略」（项目脚本缺失时保留警告占位）；本条目只补充"可以降级，但必须声明降级"的判定标准。

### Affected Files

**payload**
- `references/policies/lifecycle.policy.md` —— 新增「声明与机制的差距」节（Phase 4 后）+ Phase 4 证据等级三级区分（有写）
- `references/policies/testing.policy.md` —— 测试保护节新增空洞测试/断言完整集合/事实源规定（有写）
- `references/policies/coding.policy.md` —— 变更归位新增枚举复查条目（有写）
- `references/workflows/ci.md` —— CI 门禁完整性说明（有写，含降级策略约定）
- `references/templates/agents-md.template.md` —— 裁定为修改：生成项目 AGENTS.md 的变更归类/测试保护指针带上声明-机制一致性要点（有写）

**repo-infra**
- `CHANGELOG.md` —— [Unreleased] 补条目（治理/机制变更 → `Changed`）
- `docs/{en,zh-CN,zh-TW}/plans/payload-governance-lessons.md` —— 本计划三语（实现后归档为单语）
- `tests/suites/` 现有目标项目测试 —— **裁定：不新增专门测试文件；** 在目标链路断言（§验证方法第 4 条）中复用已有 INIT 测试，只增加断言。若发现已有测试无法承载（例如断言位置不在现有 suite 内），再拆分新测试文件，届时更新本计划 Affected Files。

> 路径惯例：`references/` 下的 policy 文件一律是 `references/policies/<name>.policy.md`；工作流是 `references/workflows/`；模板是 `references/templates/`。无 `references/<name>.policy.md` 这种写法。

### 风险

- **范围过大**：4 处编辑可能相互纠缠。对策：每处独立提交前缀（`docs(rules)`、`docs(ci)`），单个 TASK 完成。
- **重复本仓库事故细节反而形成「复述」**，违背「规则不复述」原则。对策：全部以判断标准表述，不写「0.13.2 发生了什么」。
- **空泛无判据**：如果写的规则变成「要做对」这种口号，等于没写。对策：每条带可执行判据（如「声明集合 = 恢复最终覆盖集合」）。
- **未验证被治理项目是否受益**：治理项目可能没有 `testing.policy.md`（取决于 INIT 布局）。对策：核对 `init-spec.json` 是否安装 `testing.policy.md`；不安装的项目跳过。
- **跟 AGENTS.md 的「单语规则」冲突**：`references/` 是单语（简体中文为准），本次所有写入均用简体。en/zh-TW 只同步 commands.md 触发词——而本计划不涉及触发词，故三语同步只需保持 parity 不破坏即可。

### 验证方法

1. `npm test`（全套回归）
2. `npm run check`（parity/布局/一致性/卫生/角色门禁）
3. `npm run check:payload`（载荷范围）
4. 干净目标 INIT 一个 throwaway 项目（`--phase C`），并做**机械断言**（非人工核验）：
   - 生成的 `docs/rules/lifecycle.md` 含「声明与机制的差距」与「证据等级」——用 `fs.readFileSync` + `.includes()` 断言，纳入现有目标项目测试 suite（复用而非新增）；
   - 生成的 `docs/rules/testing.policy.md` 含「空洞测试」；
   - 生成的 `docs/rules/coding.policy.md` 含「枚举复查」；
   - 生成的 `ci` 模板含「门禁完整性」；
   - 生成的 `AGENTS.md` 含声明-机制一致性指针。
5. 边界体检：`references/` 无 `repo-tools/`、`repo-workflows/`、`npm run` 等本仓库特有路径；`check-role-completeness --gate` 绿。
6. 证据等级自检：每个写出的规则条目标注适用证据等级（机械 / 人工背书 / 未验证）；无人可以声称本次已"机械强制"。

> 写 plan 即验证：本计划所有 `references/` 引用必须逐一 `Test-Path` 通过；不存在者即为计划自身的声明-机制不一致，必须本计划先改。
