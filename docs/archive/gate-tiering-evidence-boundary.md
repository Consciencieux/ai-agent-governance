# 验证门禁分层与机械证据边界（TASK 计划）


> **Status: archived.**（已归档。归档即断言完成。）本计划响应一次只读审计：项目存在"机械证据被表述成真实行为验证"与"门禁未按范围分层"两类问题，但不是门禁数量过多。目标是让每个门禁只在它有证据价值的范围内运行，并让输出与文档不再把"声明完整性"说成"行为验证"。

**Target：repo-infra** —— 全改动都在本仓库的验证入口、脚本输出措辞与文档；不新增 payload 规则，不改被治理项目行为。门禁本身不删、不拆，只改调用方式与表述层级。

> **Fact base（审计时实测）**：`npm test` 30.1s（90%），parity 0.25s、layout 0.25s、consistency 0.13s、hygiene 0.04s、role-completeness 0.04s、freshness 2.4s、delivery 0.26s → 其余总计约 0.7s。因此本计划的主要收益是**减少不相关失败与认知噪音**（改文档不触发与代码无关的门禁失败），而非性能优化——性能收益只有约 0.7s，可忽略。

### 任务目的

让验证门禁的**适用范围**与**承诺强度**都诚实：按变更范围分层调用（不再"一切全量"），并在输出与文档中明确区分机械证据、人工背书证据与未验证声明——通过检查只表示"机械条件满足"，不等于行为真实发生或语义正确。

### 当前问题

- `npm run check` 对任何变更都跑全套（剧本测试 193 个 + 文档 parity + layout + consistency + hygiene + role），但**测试占 30s、其余共 0.7s**——改文档触发测试失败、改测试夹具触发发布相关门禁，都是噪音而非风险信号。
- `check-doc-consistency.js` 已聚合 12 个职责簇，是"多合一治理引擎"；一个门禁失败 Agent 难以判断属于哪个领域；且新增检查的边际成本极低，容易继续膨胀成"治理单体"。
- 多个门禁（consent、principles index、plan delivery、translation freshness、doc parity）只能证明"文档声称已做某事"（标记、路径、结构存在），不能证明"行为真实发生、结果正确、用户确认过、翻译准确、根因成立"。当前文档多处把它们表述为"门禁保证"，实际是"声明完整性检查"。
- 同一事实（如分发角色）同时出现在 architecture、AGENTS、init-spec、脚本注释、glossary 六处；其中易漂移的数量（21 entries / 20 files / 10 internal）靠人工维护，几乎注定滞后。

### 提议方案

#### 1. 按范围分层的验证入口（P1）

新增 npm scripts 并**同步修改 AGENTS.md 的推荐执行规则**（否则 Agent 仍跑全量，收益落空）：

- `npm run check` —— 全量兼容入口（保持现状，别名）；用于无可辩析范围时、或用户明确要求。
- `npm run check:docs` —— `docs/`、`README.md`、`CONTRIBUTING.md` 变更时：test + parity + consistency。
- `npm run check:payload` —— `references/`、`scripts/`、`SKILL.md`、`LICENSE`、`package-skill.sh` 变更时：test + layout + role-completeness + hygiene。
- `npm run check:tests` —— `tests/`、`.gitattributes` 变更时：test + hygiene。
- `npm run check:full` —— 发布、审计或用户明确要求：与 `npm run check` 同义（当前 check:all 已是全量 + freshness + delivery）。

按 `git diff --name-only` 前缀分组，判断实现用最小匹配（无需智能调度器）。**核心规则**：范围判断**不确定时升级到更大范围**——Agent 无法确定变更属哪个范围时，必须跑 `npm run check` 而非缩小验证。此规则写入 AGENTS.md 验证节。

#### 2. 冻结 check-doc-consistency.js 职责（P1）

不拆文件（有工程克制包袱），但写入两处约束：

- 脚本头注释 + `AGENTS.md`：该脚本只做"跨文档事实一致性"检查（版本示例、受保护清单、链接、数值声明、ADR 状态、prompt 同步、plan status、consent、principles index、术语、CHANGELOG 覆盖）。
- **新检查只有在现有脚本的职责、输入与失败语义无法容纳时才创建独立脚本；否则拒绝新增。** 防"每增加一个规则就多一个脚本"的反向膨胀——在脚本头注释中声明此约束。

#### 3. 承诺强度分级（P1）

在各检查输出与文档中明确区分三种证据：

- `mechanical evidence` —— 标记、结构、路径存在、幂等（如 layout、role、plan delivery 的路径匹配、doc parity 的结构、consent 的标记）。
- `human-attested evidence` —— 需用户在环、人工审查（如 release 批准、根因、翻译语义、plan 语义）。
- `unverified claim` —— 仅有声明，无独立验证（如"修复前已失败"的陈述）。

具体改动：`check-doc-consistency.js` 的 `--json` 输出增加 `evidence` 字段（每个 cluster 标注 `mechanical` / `human-attested` / `unverified`）；`--gate` 输出与 AGENTS.md 验证节的措辞从"门禁保证"改为"机械条件满足的检查"。

#### 4. 删除架构文档中易漂移的数字（P1）

`docs/{en,zh-CN,zh-TW}/architecture.md` 的角色表中删除具体数量（"21 artifact entries / 20 unique files / 10 internal files"），改为指向"查看 `check-role-completeness.js --gate` 输出"；角色定义文字保留（稳定），图表示例保留（帮助理解），数量删掉（易变）。glossary 同理（角色名保留，数量删除）。

#### 5. 暂缓项（v0.13 评估，本计划不做）

- parity 结构约束放宽（列表数量、代码块数量降级 advisory）——需真实误报证据，不因理论风险改动。
- layout 清单简化（architecture 只列目录与关键文件，完整清单由门禁输出生成）——需谨慎，architecture 是 Agent 导航文档，不能为减维护而删关键文件说明；可先删数量与重复注释。

### 受影响文件

#### 仓库基础设施

- `package.json` —— 新增 `check:docs` / `check:payload` / `check:tests` / `check:full`（check 保持别名）
- `AGENTS.md` —— 验证节：范围入口表、不确定升级规则、承诺强度措辞、consistency 职责边界
- `scripts/check-doc-consistency.js` —— `--json` 输出 `evidence` 字段；头注释职责与"拒绝膨胀"约束
- `scripts/check-role-completeness.js` —— 头注释（若需）
- `docs/{en,zh-CN,zh-TW}/architecture.md` —— 删易漂移数量；角色定义保留；文档产出说明不变
- `docs/glossary.md` —— 角色名保留，数量删除
- `CHANGELOG.md` —— 发布边界记录

### 风险与决定

- 性能收益被高估：测试 30s 占主导，范围分层主要减噪音（改文档不触发代码失败）——风险相对低，收益是认知清晰而非提速。
- "判断不确定升级到更大范围"规则是防 Agent 缩小验证的关键；写入 AGENTS.md，明确"宁可多跑，不可漏跑"。
- consistency 冻结靠"拒绝新增"约束而非代码：约束写在注释；若未来出现必须突破的检查，走计划评审而非直接塞入。
- 证据分级可能被误读为"降级门禁"；本计划只改描述与输出，不改变门禁的 fail-closed 语义——机械证据门禁仍按原样阻断，只是不再被说成"行为验证"。
- 删除数量依赖门禁输出可查询：`check-role-completeness.js` 已输出 `counts` 字段，无需新机制。

### 验证方法

- `npm run check:docs` 在仅改 docs 时通过且不跑测试；`npm run check:payload` 在仅改 references 时通过且不跑测试——用临时改动验证分组正确后还原。
- `check-doc-consistency.js --json` 输出含 `evidence` 字段且每个 cluster 有标注。
- AGENTS.md 验证节含范围表与"不确定升级"规则；措辞不再出现"门禁保证行为发生"。
- architecture.md ×3 / glossary 中不再含易变数量（`rg "21|20|10 internal"` 无结果）。
- 回归：`npm test` 193 通过；parity、layout、consistency、hygiene、role、delivery 全绿；被治理项目形态不受影响（payload 未动）。
