# ADR-0008: 触发词清单复制的规则冲突裁定（commands.md 例外）

状态：Accepted（2026-09-05）

## 背景

AGENTS.md 存在两条相互矛盾的规则：第 47 行“Never restate skill content into `docs/`”明确禁止把“full trigger inventories”（完整触发词清单）复制进 `docs/`——“docs reference the skill (file + section pointer), they do not copy workflows, step lists, or full trigger inventories”；而第 113 行的同步组规则要求：新增或修改子技能时，同一次变更必须更新 `docs/{en,zh-CN,zh-TW}/commands.md`（触发词——用户手册职责），且 `check-doc-consistency.js` 的 prompt-sync 检查在任一触发词缺失于三语 commands.md 时报错。

也就是说：门禁把“复制完整触发词清单”变成强制状态，而散文规则把它列为禁止。两条规则无法同时满足；且 prompt-sync 本身只是 advisory（写入 `issues.prompt_sync`，不进入 `gateIssues`），所以现状是“禁令不执行、强制不生效”——真正的失败模式是：子技能的触发词只活在 `references/templates/sub-skills.md`，用户从命令手册中无法发现新技能；或 commands.md 残留已删除的触发词，门禁只查“缺失”不查“残留”。

本 ADR 记录该冲突的裁定与后续方向，来自 2026-09-05 一次只读排查（详见 `docs/archive/gate-repair-and-ssot-alignment.md` 的 B1 与 gate-repair-and-ssot-alignment 计划的 §B，以及术语/一致性门禁运维经验）。

## 决策

1. **commands.md 是唯一受控的触发词复制地。** 触发词（trigger words）是用户手册内容——用户需从命令手册发现子技能；三语 commands.md 因此成为该复制模式的**有意豁免**，而不是违规。豁免范围严格限定为触发词清单，不扩展到工作流、步骤清单、规则正文、政策条文。
2. **修改 AGENTS.md 第 47 行的禁令措辞**，为触发词清单写入明确例外：“docs reference the skill (file + section pointer); they do not copy workflows, step lists, or rule text — the trigger-word inventory in commands.md is the one deliberate, gate-enforced exception (sync-group rule)。”
3. **受控复制，非自由复制。** commands.md 必须通过指向 `references/templates/sub-skills.md` 的指针声明其来源；不出现独立的第二份权威。任何新子技能的触发词进入 commands.md 都经由同步组规则逐条同步，而非人工整段重写。
4. **prompt-sync 升级为 fail-closed（--gate）并与“残留”检测成对。** 既然复制是受控的，那么缺失与残留都是缺陷：新增触发词缺失于三语 commands.md → gate 失败；已删除的触发词仍残留 → gate 失败（需要新增残留检测，见 gate-repair-and-ssot-alignment 计划 §B1 的配套实现）。

## 否决的替代方案

- **删除 sync-group 触发词同步要求**：用户无法从命令手册发现子技能，违背“docs 服务于手册”的定位。
- **删除 AGENTS.md 禁令中的“full trigger inventories”字样而保持豁免范围模糊**：造成“除触发词外还能复制什么”的争议，为后续类型扩大预留口子——这正是本裁定要封闭的。
- **保留两种规则并存**：现状；冲突只会在“添加子技能却忘记同步 commands.md”时以 advisory 形式出现，无法在 CI 强制，也无法引导用户。

## 后果

- AGENTS.md 第 47 行被修改（记录本 ADR 引用的语境），第 113 行保持原样——两者的“矛盾”从此转化为“规则 + 明确例外”的关系。
- prompt-sync 簇升级为 gate 类（fail-closed under `--gate`），并新增“残留触发词”检测；这属于检查器行为变化，需要 CHANGELOG 记录与测试保护（见 gate-repair-and-ssot-alignment 计划）。
- 本 ADR 不构成第三事实源：触发词的权威仍在 `references/templates/sub-skills.md`（单一事实源），commands.md 是面向用户的投影，其与源的等价性由 prompt-sync（升级后）机械保持。
- 后续新增子技能时，同步组规则中“commands.md（触发词）”从“手册职责”升级为“受控投影 + 门禁强制”。
