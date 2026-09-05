# Secret Scanning Gate（TASK 计划）
> **Status: archived.**（已归档。归档即断言完成。）（原状态：已实现（v0.6.0，已归档）。 本页是路线图条目 `Secret scanning gate` 的详细设计（见 [roadmap.md](../zh-CN/roadmap.md)），按 `docs/plans/TASK_<name>.md` 六字段模板组织。目标版本：v0.6.0（已实现）。）

### 任务目的

让安全基线**机器可执行**：只读、零依赖的门禁脚本，阻止包含密钥材料的提交——完全镜像已验证的 `scripts/check-git-policy.js` 模式。

### 当前问题

- `references/policies/security.policy.md` 只是**文档规则**；提交前清单是 Agent 可以跳过的口头约束
- 治理失败中最致命的一种——凭据泄漏——目前没有任何自动化门禁
- `check-git-policy.js` / `check-lock.js` 已证明该模式可行：只读脚本 + 退出码 + 校验器/CI 集成

### 提议方案

`scripts/check-secrets.js`（INIT 复制到项目，与校验器并列）：

- **只读**扫描 `git diff --cached`（仅暂存区）
- v1 保守模式表：AWS `AKIA[0-9A-Z]{16}`、GitHub `ghp_` / `github_pat_`、OpenAI 风格 `sk-`、私钥头（`-----BEGIN ... PRIVATE KEY-----`）、非 `.env` 文件中的 `password=`/`token=` 赋值
- 干净 → exit 0；命中 → exit 1，报告 `文件:行号` + 模式类别——**绝不打印密钥本身**
- v1 无白名单（误报好过静默泄漏）；逃生注释（`# nosecrets`）推迟到 v1.1（确有需求时）

集成（全部机械性）：

- 校验器默认检查 19 → 20：要求 `scripts/check-secrets.js` 存在（与另两个 check 脚本一致）
- CI 治理 job 每次 push/PR 运行
- `references/policies/git.policy.md` 提交前清单："`git commit` 确认前必须 `node scripts/check-secrets.js` 且 exit 0"
- `references/templates/agents-md.template.md` —— Git Write Policy 增加一行提及

### 受影响文件

- `scripts/check-secrets.js` —— 新脚本（本仓库）+ SKILL.md Phase 1 复制步骤
- `scripts/verify_governance.js` —— 默认检查 +1
- `references/policies/git.policy.md` / `references/templates/agents-md.template.md` —— 策略同步
- `references/policies/governance-files.policy.md` —— 脚本列入受保护文件清单
- `tests/run-tests.js` —— 新增用例

### 风险

- **误报**阻断正常提交 —— 用保守模式表缓解；收到误报反馈时加窄异常，**绝不关闸**
- **模式表维护** —— v1 固定清单；可配置模式超出范围
- **性能** —— 暂存区扫描可忽略

### 验证方法

- 暂存区植入假密钥 → exit 1，报告 `文件:行号` + 模式类别（测试）
- 干净暂存区 → exit 0（测试）
- 输出**不得**包含密钥本身（测试断言 stdout 中无该 token）
- 缺少 `check-secrets.js` 时校验器失败（回归更新：19 → 20）
