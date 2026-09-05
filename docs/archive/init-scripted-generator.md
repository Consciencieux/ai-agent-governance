# INIT Scripted Generator（TASK 计划）

> **Status: archived.**（已归档。归档即断言完成。）

### 任务目的

把 INIT 生成逻辑固化为**确定性、可快照测试的脚本**，让 100 次 INIT 产出逐字节一致——这是 skill 规模化之前的可靠性前提。

### 当前问题

- INIT 由 LLM 按 SKILL.md 散文执行 → 产出随运行、模型、Agent 漂移（措辞、顺序、遗漏）
- 没有快照测试；生成工件的回归由用户发现，不由 CI 发现
- MIGRATE 依赖校验器，但校验器无法发现"存在但错误"的文件
- 本 skill 的反虚构承诺（"绝不伪造内容"）目前只是提示词级承诺，不是机器属性

### 提议方案

`scripts/generate-governance.js` —— 零依赖 Node 生成器（与校验器同一纪律）：

1. **消费** `references/templates/**` + 机器可读的初始化规范（从 SKILL.md Phase 1 提炼为结构化数据，即 `references/init-spec.json`）
2. **输入**：仓库根、成熟度（L0–L3）、检测事实（语言、包管理器、CI 平台、文档根）——**判断仍由人/Agent 做，写文件变为机械动作**
3. **输出**：完整引导骨架（rules → AGENTS.md → 模板 → `.governance/` 状态 → scripts 复制 → CI），占位符由检测事实机械解析
4. **SKILL.md 的 INIT 变为**：Agent 运行生成器 + 只处理确认门禁（依赖、git 身份、CI 推送）——负责"人工批准"部分，不负责"写文件"部分
5. **快照测试**：fixture 仓库（L0 空仓库 / L1 仅代码 / L3 已有文档）→ 断言完整文件树 + 内容一致

分期交付：

- Phase A（v0.9.0）：静态骨架 —— rules、AGENTS.md、CHANGELOG、README 引导、Feature 占位策略 —— **已交付**
- Phase B：配置文件（.gitignore、.env.example、.gitmessage）、按栈/平台选择 CI、`.governance/` 状态文件、脚本复制 —— **已交付**
- Phase C：结构适配（成熟度策略 L0/L1 全量、L2 增量、L3 仅审计；既有文档根经 `--doc-root`）、子技能生成、建议性脚本 —— **已交付**

### 受影响文件

- `scripts/generate-governance.js` + `references/init-spec.json` —— 新增
- `SKILL.md` Phase 1 —— 重写为"运行生成器 + 处理门禁"
- `tests/run-tests.js` —— 快照 fixture 套件
- `docs/zh-CN/bootstrap-output.md` —— 输出规格改由生成器为源

### 风险

- **单一事实源漂移** —— spec 与 SKILL.md 散文不得分叉（规则：SKILL.md 引用 spec，不复述）
- **工作量大** —— 与全部 13 步完全对齐是大工程；分期（A → B → C）保证每版可发布
- **模板占位符** —— 模板保留 `{{...}}`；由生成器机械解析（确定性正来源于此）

### 验证方法

- 相同 fixture 输入两次运行 → 逐字节一致（确定性测试）
- fixture 快照：L0 / L1 / L3 期望文件树（快照测试）
- 全部 fixture 生成产物通过 `verify-governance.js` exit 0（端到端测试）
- SKILL.md 的 INIT 章节引用生成器而非复述步骤（文档断言）
