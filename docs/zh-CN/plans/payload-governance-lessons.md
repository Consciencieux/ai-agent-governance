# 载荷治理教训迁移：声明-机制差距与验证反馈闭环（TASK 计划）

> **Status: Active.**（进行中，创建时的初始状态。）

**Target：payload** —— 仅修改 `references/` 下的规则/模板正文，让治理项目获得与本仓库已证实的防线同类的教训；不新增门禁脚本、不修改测试架构（`repo-infra` 部分零改动）。若实现中出现新的可判定规则且需要机械执行（需新增脚本/测试），将拆分为 `both` 并重新对本计划修订。

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

写入 `references/lifecycle.policy.md` Phase 4（验证序列）之后，作为一节「声明与机制的差距」；同时在 `references/coding.policy.md` 的「变更归位与残留清理」加入一条。

要点：
- 规则声明的是集合（同步点、扫描目、CI 门禁、检查清单），机制必须覆盖同等范围；「声明了 5 处、机制验 2 处」与「声明覆盖所有源码树但枚举漏了 1 棵」属于同一缺陷类，修复时必须补齐声明或缩小机制，不能只改文档。
- 文件移动/重命名/目录拆分后，必须复查所有硬编码目录枚举与守卫：`SCAN_DIRS`、`SEARCH_ROOTS`、角色清单、扫描集合、路径常量。裁判标准：机械证明「声明集合 = 恢复最终覆盖集合」，不能凭印象。
- 形态守卫（「本项目不含 X 布局 → not applicable → exit 0」）不得顺带关闭真实保护：守卫的成立条件必须是声明的、窄的（例如「缺 `references/init-spec.json`」），而不是树级宽条件（例如「缺 `references/`」）。

#### 2. 测试活性（D4 + D5 合并为一条）

写入 `references/testing.policy.md` 的「测试保护」之后。
- 空洞测试：移除被测功能后测试仍绿 = 测试未覆盖功能；断言必须针对**完整**目标集合，而不是子集（枚举断言、子集断言都是空洞）。
- 变更涉及门禁/守卫/清单枚举时，测试必须证明条件非空洞（例如注入一个真实 marker/标识符，证明检查真的在跑），不能只断言退出码或空输出。

#### 3. 证据等级（D6）

写入 `references/lifecycle.policy.md` Phase 4 的「证据要求」段。
- 区分三级：机械（marker/结构/路径/正则/文件存在 → 「机械条件满足」，非「行为正确」）；人工背书（需要用户参与，如发布批准、翻译审查）；未验证声明（仅自述，无独立证据）。「✓ 通过」必须挂这三级之一，否则不能声称验证完成。

#### 4. CI 门禁完整性（D7）

写入 `references/workflows/ci.md`（分发到治理项目的 CI 模板文件）。
- 若项目维护 CI，CI 必须运行与 AGENTS.md 声明的门禁集合等价的命令，不能只运行子集（例如只 `npm test` 但声称「fails CI」）。

### Affected Files

- `references/policies/lifecycle.policy.md` —— 新增「声明与机制的差距」节（Phase 4 后）+ Phase 4 证据等级三级区分
- `references/policies/testing.policy.md` —— 测试保护节新增空洞测试/断言完整集合
- `references/policies/coding.policy.md` —— 变更归位新增枚举复查条目
- `references/workflows/ci.md` —— CI 门禁完整性说明
- `references/templates/agents-md.template.md` —— 若上述规则在 AGENTS.md 模板有对应归纳（变更归类/测试保护指针）则同步；无则跳过
- `docs/{en,zh-CN,zh-TW}/plans/` —— 本计划的三语存在（实现后归档为单语）
- `docs/en/architecture.md`、`docs/zh-CN/architecture.md`、`docs/zh-TW/architecture.md` —— 布局树若新增文件（预计无）

> 注：载荷变更必须附带 `CHANGELOG.md` [Unreleased] 条目（治理/机制变更 → `Changed`）。

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
4. 干净目标 INIT 一个 throwaway 项目（`--phase C`），核对：
   - 生成的 `docs/rules/lifecycle.md` 含「声明与机制的差距」「证据等级」；
   - 生成的 `docs/rules/testing.policy.md` 含「空洞测试」；
   - 生成的 `docs/rules/coding.policy.md` 含「枚举复查」；
   - 生成的 `.github/workflows/` 或 `ci` 模板含「门禁完整性」；
   - 生成的 `AGENTS.md`（若模板有对应归纳）含对应指针。
5. 边界体检：`references/` 无 `repo-tools/`、`repo-workflows/`、`npm run` 等本仓库特有路径；`check-role-completeness --gate` 绿。
