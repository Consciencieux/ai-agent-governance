# Rule Capture（TASK 计划）

[English](../../en/plans/rule-capture.md) · [简体中文](rule-capture.md) · [繁體中文](../../zh-TW/plans/rule-capture.md)

> **状态：已实现（2026-08-30，待 Release 归档）。** 本计划已在当前工作树交付；发布时按仓库规则归档。
>
> **Target: both** —— `payload` 交付给被治理项目（`references/`、`scripts/`）；`repo-infra` 维护本仓库的 `AGENTS.md`、测试和开发者文档。两类交付点分列在“受影响文件”中。
>
> **目标版本：v0.11.0（暂定）**。实现范围若缩减为内部机制修补，发布时由 Release Proposal 按 SemVer 重新判定；实现阶段不直接改版本或创建发布。

### 任务目的

让**经开发者确认的长期要求**成为被治理项目的持久运行期契约，而不是只存在于一次对话中。确认后的规则必须进入目标项目的 `AGENTS.md` 或 `docs/rules/**`，从而在换开发者、换电脑、换会话后仍可被新 Agent 读取。

本计划不把未确认候选伪装成持久规则：`activity.jsonl` 只是审计轨迹，当前未决候选由 `state.json` 保存以便同一任务恢复；只有已确认并写入规则文件的内容才是正式治理契约。未提交的本地状态不承诺跨电脑保留。

### 当前问题

- Agent 会在当前会话遵守开发者提出的要求，但现有生命周期没有规定如何把“开发者要求”分类、确认并写入规则文件。
- 现有活动审计只记录 Agent 的动作；它没有规则候选、裁定结果或未决候选的结构化字段。
- `activity.jsonl` 是被忽略的运行期输出，不能单独承担跨机器的持久化职责；当前状态应由受跟踪的 `state.json` 承担。
- 原稿提到“本次会话的 5 条要求”和“漏掉的两条规则”，但没有给出原文、来源和适用范围。它们**不作为本计划的隐式回填交付**；若要回填，必须在实现前逐条列出候选 ID、原文/可审计摘要、作用域、目标章节，并取得开发者明确确认。

### 交付边界与非目标

**适用范围：** 被治理项目中由生成的 `AGENTS.md`、`docs/rules/**` 和 `.governance/generated/skills/` 执行的开发任务；本仓库自身只增加同等的开发者操作说明，不会把某个被治理项目的规则自动写入本仓库。

**只收集开发者的持久性行为要求：**

- 收集明确的通用约束、对 Agent 行为的纠正，以及“以后/始终/不要再”等持久化信号。
- 不收集系统/平台指令、问题和建议、仅用于本任务的验收标准、绑定具体文件或本次提交的指令、临时 workaround、秘密和凭据。
- “重复出现”只能提高候选优先级，不能单独把一次性要求升级为持久规则。

**非目标：** 不自动把候选写入规则文件；不自动把已有项目升级到新模板；不修改既有规则的语义来“合并相似项”；不把规则裁定确认当作 Git 提交/推送授权。

### 提议方案

#### 1. 在任务中收集候选

从任务开始到 Phase 3，Agent 对符合边界的开发者要求创建候选。每个候选必须有唯一 ID（建议 `rc-<task_id>-<序号>`），并在写入前搜索现有 `AGENTS.md` 和 `docs/rules/**`，优先更新已有单一事实源，不得重复创建同义规则。

候选的最小结构如下；`text` 使用可审计的规范化表述，不复制秘密或无关的整段对话：

```json
{
  "id": "rc-t-123-01",
  "text": "所有治理文件变更都必须先说明原因并运行验证",
  "scope": "governed-project",
  "classification": "persistent|one-off|unclear",
  "reason": "通用行为约束；适用于后续任务",
  "target": "docs/rules/lifecycle.md#governance-file-changes",
  "status": "proposed|confirmed|reclassified|discarded|pending"
}
```

分类规则：

| 信号 | 初始分类 | Agent 行为 |
| --- | --- | --- |
| 通用祈使句（“以后都”“任何时候”“不要再”）；约束行为模式；明确要求作为项目规则 | `persistent` | 放入待裁定清单；不得先写入 |
| 绑定具体对象或本次任务；含“先”“暂时”“就这一次”；执行完即失效 | `one-off` | 报告分类和理由；不写入、不计入待决候选 |
| 证据不足或信号冲突 | `unclear` | 放入待裁定清单；默认不写入 |

涉及权限、安全、删除保护、校验门禁或 Git 策略的候选，始终按高风险治理变更处理；即使分类为 `persistent`，也必须经过开发者对具体条目的明确确认。

#### 2. 把规则捕获放在 Phase 5 的同步子流程

不能在最终报告发出后才写入规则，否则写入后没有验证闭环。执行顺序改为：

1. **Phase 4 完成后**，Agent 生成规则沉淀清单；清单同时列出 `persistent`、`one-off` 和 `unclear`，对前两类给出结论和理由，不把分类本身写成开放式问题。
2. **Phase 5a 裁定门**，开发者用一轮回复按候选 ID 裁定。例如：`确认 rc-t-123-01；rc-t-123-02 改为 one-off；rc-t-123-03 暂缓`。省略的候选视为未裁定，不得默认同意；明确“确认全部持久项”可以作为批量回复。
3. **Phase 5b 写入与同步**：只有明确确认的候选可以写入目标规则文件。Agent 按规则文件保护流程处理，更新必要的 CHANGELOG，并完成 AGENTS 摘要/`@` 引用、规则文件和同步组的联动。
4. **Phase 5c 重新验证**：只要写入了受保护文件，必须重新运行受影响的治理校验、密钥扫描和同步组检查；被治理项目运行其 `verify-governance.js`，本仓库运行 `npm run check`，不得用本仓库的默认 validator 冒充被治理项目验证。
5. **Phase 6 最终报告**：只报告最终状态、已捕获规则、一次性要求、未决候选和验证证据。Phase 6 不再触发新的规则写入。

若开发者没有完成裁定，Agent 将 `state.json` 的任务状态标为 `blocked`，保留候选并在报告中明确阻塞原因；下一次运行先读取候选，得到裁定后从 Phase 5b 继续。规则裁定确认只是内容授权，仍不覆盖仓库现有的提交前 Git 命令回显和提交确认。

#### 3. 当前状态与审计轨迹

`state.json` 增加可选的 `rule_capture` 对象，用于中断恢复和当前未决状态；缺少该字段的旧项目按 `status: none` 兼容：

```json
{
  "rule_capture": {
    "status": "none|collecting|awaiting_adjudication|resolved",
    "task_id": "t-123",
    "candidates": []
  }
}
```

`activity.jsonl` 继续是追加式、被忽略的审计日志。每个任务执行结束点追加一行；同一 `task_id` 的恢复执行可以追加新行，但绝不改写旧行，候选 ID 负责关联这些记录。每条任务执行记录可增加以下可选字段，旧记录没有这些字段时按空数组处理：

```json
{
  "rules_captured": ["rc-t-123-01"],
  "rules_pending": ["rc-t-123-03"],
  "rules_resolved": [
    {"id": "rc-t-123-02", "decision": "one-off"}
  ]
}
```

`rules_pending` 只包含未裁定的 `persistent`/`unclear` 候选，不包含明确的一次性要求。候选 ID 是跨恢复记录的关联键；drift-check 以当前 `state.json` 的未决候选为准，并用活动记录展示历史和最终裁定，不把历史上已解决的候选重复计数。所有新增字段都必须遵守现有日志脱敏规则，必要时只记录类别和摘要。

#### 4. 规则落点

- 通用、短小、需要每次会话立即看到的入口规则：写入 `AGENTS.md`，详细内容放在对应规则文件并用 `@` 引用。
- 生命周期、Git、安全、测试等已有主题：更新对应的 `docs/rules/<topic>.md` 单一事实源。
- 新主题：先搜索是否已有规则；确实没有时才创建 `docs/rules/<topic>.md`，并在 `AGENTS.md` 添加指针，而不是复制正文。
- 作用域为本仓库的贡献者规则只写本仓库 `AGENTS.md`；作用域为被治理项目的规则不能反向写入本仓库。

#### 5. 已有项目的迁移

新项目由生成器得到新的状态字段和子技能内容。已有项目不会因源模板变化而自动更新，因为生成器对已有文件采用跳过策略；开发者明确要求升级时，按 MIGRATE 流程：

- 更新目标项目的 `docs/rules/lifecycle.md`、`AGENTS.md` 摘要、`state-manager` 和 `drift-check` 子技能；保留既有规则内容并合并，不覆盖。
- `state.json` 缺少 `rule_capture` 时惰性初始化，不要求一次性重写所有旧状态。
- 校验 `activity.jsonl` 的旧记录兼容、候选字段脱敏和治理版本；更新 manifest 的 `governance_version` 并运行目标项目 validator。
- 不自动迁移或自动裁定已有对话内容。

### 受影响文件

#### Payload（交付给被治理项目）

- `references/policies/lifecycle.policy.md` —— 增加 Phase 5a/5b/5c 的规则捕获子流程、阻塞/恢复条件、Phase 6 最终报告字段和确认边界
- `references/templates/agents-md.template.md` —— 增加规则捕获摘要、规则落点和“裁定确认不等于 Git 授权”的指针
- `references/templates/sub-skills.md` —— state-manager 管理 `state.json.rule_capture` 与活动字段；drift-check 按候选 ID 汇总当前未决项
- `scripts/generate-governance.js` —— 新项目生成 `rule_capture` 的兼容初始状态；保持旧项目“存在即跳过”行为
- `references/init-spec.json` —— 更新 `state.json` 工件描述/契约

#### Repo-infra（本仓库维护）

- `AGENTS.md` —— 增加本仓库自身的规则捕获操作指针；不在未给出原文和范围前回填所谓“两条遗漏规则”
- `tests/run-tests.js` —— 状态字段、活动字段、脱敏、旧记录兼容、候选解决/计数、生成输出和中断恢复测试
- `docs/en/commands.md`、`docs/zh-CN/commands.md`、`docs/zh-TW/commands.md` —— 同步 state-manager/drift-check 的用户可见职责说明
- `CHANGELOG.md` —— 在 `[Unreleased]` 记录 Added；不把每一次业务任务的规则写入都变成独立版本条目
- `docs/{en,zh-CN,zh-TW}/roadmap.md` —— 发布归档时将 Near-term 条目移至 Done 并按仓库维护规则重排；实现提交阶段只在内容需要时更新

发布边界另按 Release 流程同步 `package.json`、`SKILL.md` frontmatter、CHANGELOG 和 tag；这不是本计划授权的自动版本操作。完成后按规则将本计划归档到 `docs/archive/rule-capture.md`，不删除三语设计副本，且先通过计划交付门禁。

### 风险与缓解

- **生命周期阻塞**：没有裁定不能宣称完成；用 `state.json.rule_capture` 保存断点，下一次从 Phase 5b 恢复。
- **误分类/误写入**：明确 ID、未裁定默认不写、模糊偏向 `unclear`，且先搜索既有规则。
- **确认混淆**：规则内容裁定、治理文件保护确认和 Git 提交确认分别标示，不能用一句普通“完成”互相替代。
- **日志泄露**：不记录原始整段对话；候选文本和新增字段沿用脱敏规则，秘密/凭据只记录类别，不记录值。
- **待决项堆积**：只统计当前 `state.json` 中的未决候选；drift-check 报告数量和候选 ID，但不把报告本身变成新的硬门禁。
- **模板版本漂移**：已有项目只通过明确的 MIGRATE 更新；迁移前后都验证旧状态和旧活动记录。
- **多 Agent 竞争**：遵循既有 lock 检查；候选 ID 必须包含 `task_id`，同一文件的规则写入不得并行。

### 验收与验证方法

#### 自动测试/契约测试

- 新生成项目的 `state.json` 含可选 `rule_capture` 初始结构；旧 `state.json` 和无新增字段的旧活动记录仍能读取。
- 活动记录的新增字段接受合法数组/对象，保持 JSONL 追加式；候选 ID 可关联 `pending → resolved/captured`，已解决项不会被重复计数。
- 含秘密样式文本的候选不会把秘密写入 `state.json` 或 `activity.jsonl`；一次性候选不会进入 `rules_pending`。
- 生成的 state-manager/drift-check 子技能包含上述状态、确认、恢复和报告契约；`activity-report` 能区分当前未决项与历史已解决项。
- 中断恢复 fixture：裁定前任务为 `blocked`，下一次运行读取候选并在裁定后完成写入、重新验证和最终报告。

#### Agent 行为验收（狗粮场景）

构造一项明确持久要求、一项明确一次性要求和一项模糊要求，检查：

1. Phase 5a 清单有三项、每项有 ID、分类、理由和目标章节；一次性项不进入待决计数。
2. 开发者确认前，`AGENTS.md`/`docs/rules/**` 不发生规则写入。
3. 开发者按 ID 确认/改判后，只写入确认的持久项；模糊项若暂缓则任务为 `blocked`，若改判为一次性则不写入。
4. 规则写入后重新运行目标项目 validator、`check-secrets`、`check-sync`；最终 Phase 6 报告列出真实命令和结果。
5. 重复运行不会创建重复规则；drift-check 报告当前未决数量而不是历史累计数量。

#### 本仓库门禁与迁移验收

- 本仓库运行 `npm test`、`npm run check`；不运行或伪造本仓库默认 `scripts/verify_governance.js` 的通过结果。
- 修改 `references/`、脚本或三语 docs 后运行对应的 `docs:parity`、`docs:layout` 和一致性门禁；真实输出写入任务报告。
- 通过一次目标项目 MIGRATE fixture：旧项目不被覆盖，显式升级后新增行为可用，旧状态/活动记录仍可读取。
- 本次会话提到但未提供原文的“两条规则”不作为自动验收项；只有在实现前补齐候选记录并获明确确认后，才加入相应文档断言。

---
