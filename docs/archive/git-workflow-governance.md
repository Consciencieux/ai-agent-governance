# Git Workflow Governance（TASK 计划）
> **Status: archived.**（已归档。归档即断言完成。）（原状态：已实现（v0.5.0，已归档）。 本页是路线图条目 `Git workflow governance` 的 TASK 计划（见 [roadmap.md](../zh-CN/roadmap.md)）；按归档规则随 v0.5.0 发布归档于此。）

### 任务目的

让 Agent 安全地使用 Git —— 分支开发 + 人工批准门禁 —— 使项目从"AI 写什么代码"演进为"AI 如何安全地修改、提交、发布代码"。把「AI 提议，人确认」原则延伸到 Git 层——Agent 最容易造成不可逆损害的地方。

### 当前问题

治理层目前覆盖项目知识、架构、规则、CI 与发布，但不覆盖 Git 行为。典型 Agent Git 流程：

```
修改代码 → git add → git commit → git push origin main
```

- 没有隔离环境 —— Agent 直接修改主分支
- 没有人工审核点 —— push 是不可逆的公开行为
- 回滚成本高 —— 用户需要手动指导 Agent 构造安全回滚（"找到昨天那个 commit、revert 某几个文件、不影响其他修改"）
- 违背「AI 提议，人确认」原则

### 提议方案

在 `ai-agent-governance` 中新增 **Git Workflow Governance 模块**（第一版作为主 skill 内的模块，不拆独立子技能）。

#### 1. `git-policy.json`（INIT 生成）

`.governance/git-policy.json`：

```json
{
  "protectedBranches": ["main", "master"],
  "directPush": false,
  "requireReview": true,
  "allowForcePush": false
}
```

#### 2. 分支开发流程（取代直推 main）

现在：

```
Agent → main → push
```

目标：

```
Agent → 创建分支（feature/agent-<日期>-<摘要>）
      → 实现
      → 测试
      → commit
      → push 分支
      → 创建 PR
      → 人工批准
      → merge
```

#### 3. 生命周期扩展

命令生命周期从三个阶段扩为四个：

```
初始化 → 开发（Develop）→ 持续维护 → 发布
```

`Develop` 管理：分支 · commit · PR · 回滚。

（模式层面管线仍是 `INIT → Runtime → AUDIT → RELEASE` —— `Develop` 是运行期（Runtime）内的开发阶段，显式化后 Git 工作流规则有了归属。）

#### 4. 命令影响

- **不增加新的用户命令**（`git create branch` / `git rollback` / `git undo` 太底层 —— 价值是让 Agent 正确使用 Git，而非重新实现 Git）。
- 策略作为**运行期治理规则自动生效**：用户说 `implement feature xxx` 时，Agent 自动执行：

```
检查 git 策略
→ 创建分支
→ 修改
→ 测试
→ commit
→ 报告
```

- 可选（非主要）提示词：`rollback change` / `restore previous state` —— 仅辅助流程，构建在 Git 自身的 `revert` / `reset` / `restore` 之上。

#### 5. README 呈现（实现后）

在 Core Capabilities 中、Anti-Regression 之后新增：

- **Git Workflow Governance** —— 阻止直推受保护分支 · 强制分支开发 · 提供受控回滚流程

#### 6. Roadmap 优先级

```
[ ] Git workflow governance   ← 新增项中最优先
[ ] Skill 生命周期管理
[ ] 多 Agent 协调
[ ] IDE 扩展
[ ] 远程治理看板
```

### 受影响文件

计划（实现阶段）：

- `SKILL.md` —— Phase 1 增加 `git-policy.json` 生成步骤；运行期规则引用策略
- `references/policies/git.policy.md` —— 分支工作流规则、受保护分支直推禁令
- `references/templates/agents-md.template.md` —— AGENTS.md 增加 Git 策略摘要
- `references/policies/governance-files.policy.md` —— `git-policy.json` 加入受保护/跟踪清单
- `scripts/verify-governance.js`（可选）—— 策略存在性与违规检测
- `tests/run-tests.js` —— 策略默认值与违规测试
- `README.md` / `docs/commands.md` —— 能力条目（按第 5 节）与文档同步

### 风险

- 分支流程增加操作步骤，小型改动可能变慢（需要小型改动豁免规则）
- 策略过严可能促使 Agent 绕道（如本地合并后再推）
- 与既有分层 Git 权限（`git.policy.md`）的边界需理清，避免规则冲突
- 回滚辅助构建在 `revert` / `reset` / `restore` 之上，误用有数据丢失风险（需要确认门禁）
- 与托管平台（GitHub/GitLab）自身的分支保护设置重叠，职责需明确

### 验证方法

- INIT 生成带默认值的 `.governance/git-policy.json`（测试断言）
- 分支工作流写入生成的 AGENTS.md / `docs/rules/git-policy.md`（文档断言）
- Available Prompts 保持三个 —— 不新增生命周期命令（回归测试）
- 直推受保护分支可被检测（校验器/策略检查测试）
- 测试覆盖策略默认值与违规检测（`tests/run-tests.js`）
