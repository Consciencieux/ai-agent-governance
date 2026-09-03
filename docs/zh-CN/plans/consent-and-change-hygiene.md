# 确认凭证与变更卫生自动化（TASK 计划）

[English](../../en/plans/consent-and-change-hygiene.md) · [简体中文](consent-and-change-hygiene.md) · [繁體中文](../../zh-TW/plans/consent-and-change-hygiene.md)

> **状态：设计计划，未实现。** 本计划定义用户确认、删除、重命名与迁移的可验证证据，不推断人的真实意图。

**Target：both** —— `payload` 增加运行时校验与被治理项目生成契约；`repo-infra` 增加测试、文档和发布接线。两个域分别列在“受影响文件”中。

### 任务目的

让高影响 Git 操作以及删除/重命名变更具备机器可审计证据，同时保留那些无法从仓库状态判断的决策的人工作用。

### 当前问题

- 当前规则要求提交前回显，但系统无法证明确认覆盖了精确的暂存变更集和命令范围。
- 删除、重命名、迁移、API 和生成物卫生主要依赖文档，没有与实际 diff 自动对账。
- 现有密钥、Git 策略、同步组和治理检查没有形成持久且绑定变更集的证据记录。
- 脚本可以验证证据和一致性，但不能证明人理解了后果，也不能证明迁移在语义上足够。

### 提议方案

#### 1. 绑定变更集的确认凭证

扩展 `.governance/consent.json`，包含 `changeSet`、`scope`、`commandDigest`、`approvedAt` 和 `approvedBy`。提交钩子与发布执行器拒绝缺失、格式错误、过期或不匹配的凭证。凭证绑定暂存 diff 或 Release Proposal 的 HEAD；之后任何变更都会使凭证失效。

确认范围区分 `add`、`commit`、`tag`、`push` 和 `release`。用户说“push”可以触发确认提示，但本身不是批准凭证。

#### 2. 结构化变更卫生声明

在 TASK 计划或 `.governance/change-hygiene.json` 中增加机器可读记录。每项删除或重命名声明操作、原因、受影响符号/路径、引用搜索词、兼容性决定、迁移或回滚证据以及允许的历史命中。

检查器把声明与 `git diff --name-status --find-renames` 对照，执行声明的搜索，验证迁移/ADR/CHANGELOG 文件真实存在，并报告未说明的删除、重命名、当前层残留引用和缺失迁移证据。

#### 3. 按风险分级执行

- `advisory`：没有公开 API/配置/数据格式信号的内部变更。
- `gate`：公开 API/配置/数据格式、安全、权限或破坏性变更。
- `human-required`：迁移是否语义充分、不可逆数据变更和模糊的兼容性决定。

检查器不能把文档存在当成内容充分的证明，只报告证据状态，最终语义决定仍由开发者作出。

#### 4. 接线

在提交、tag、发布写操作前立即校验确认凭证；在 Phase 4 和发布归档/tag 前运行变更卫生校验。只有完成独立运行和被治理项目兜底测试后，才把脚本加入 INIT 载荷。

### 受影响文件

#### Payload

- `scripts/check-consent.js` —— 校验绑定变更集的确认凭证
- `scripts/check-coding-hygiene.js` —— 将删除/重命名/迁移声明与 Git 状态对账
- `references/init-spec.json` —— 复制并声明新的独立脚本与确认凭证格式
- `references/templates/githooks-template.md` —— 写操作前强制确认校验
- `references/templates/agents-md.template.md` —— 记录证据与风险分级
- `references/policies/git.policy.md` —— 定义确认凭证范围
- `references/policies/coding.policy.md` —— 定义结构化删除/重命名卫生
- `references/policies/governance-files.policy.md` —— 保护新增门禁脚本
- `references/workflows/release.md` —— 接入 Phase 4 与发布门禁
- `SKILL.md` —— 更新载荷契约与验证顺序

#### 仓库基础设施

- `tests/run-tests.js` —— 覆盖摘要绑定、范围不匹配、删除、重命名、迁移与兜底
- `scripts/check-doc-consistency.js` —— 验证同步文档标记
- `docs/{en,zh-CN,zh-TW}/commands.md` —— 记录用户触发词
- `CHANGELOG.md` —— 在发布边界记录行为变化

### 风险与决定

- 哈希只能证明身份，不能证明理解；确认仍保持人在环中。
- 每次内部重命名都强制迁移文件会造成误报，执行强度必须按风险分类。
- 导出副本可能没有 Git 历史；历史不可用时降低保证度并明确报告，不能伪造证据。
- CHANGELOG、ADR、归档、兼容别名和测试中的历史引用需要显式白名单，不能采用全局零命中规则。
- 不启用自动 tag/push/release；本计划只加强写操作前校验。

### 验证方法

- 针对一次暂存 diff 的确认凭证，在暂存行发生任何变化后失败。
- 确认范围不完整时，在对应写操作前失败。
- 未声明的高风险删除和重命名使门禁失败，并指出缺失声明。
- 声明的迁移路径不存在时失败；路径存在只算证据，不算语义批准。
- 只有显式声明后才允许历史层命中。
- 无 Git 和被治理项目的兜底行为稳定且报告清晰。
- 更新三语树和 payload 复制不变量后，`npm test`、`npm run check`、`npm run check:all` 通过。

---
