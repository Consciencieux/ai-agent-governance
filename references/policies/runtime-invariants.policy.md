# 运行期契约（Agent Runtime Invariants）

本文件是被治理项目与 skill 执行器共享的**常驻硬规则**正文（INIT → `docs/rules/runtime-invariants.md`）。入口（`SKILL.md` / 生成的 `AGENTS.md`）只保留指针，禁止再写第二份全文。

## 单一事实源

- **初始化期：** skill 入口与 `references/` 为生成规范源头。
- **运行期：** 生成后的 **AGENTS.md** 为会话行为契约入口；细节在 `docs/rules/**`。
- 同一规则不得多处独立维护。变更顺序：**权威正文 → 引用 → 投影**（见 `coding.md` § 变更归位）。

## 规则优先级

```
1. System / Platform Safety
2. Explicit User Request
3. Governance Integrity
4. AGENTS.md
5. docs/rules/
6. Existing Code Convention
```

普通业务不得隐式绕过治理。改 AGENTS / 删安全检查 → 走 `governance-files.md` 保护流程，不是普通覆盖。

## Agent 权限模型

| 动作 | 权限 |
| --- | --- |
| 读 / 建文档 | 自动 |
| 改代码 | 允许（须验证：测试 / 静态检查 / 构建） |
| 一次改 3+ 文件 / 删代码 / 改依赖 | 须确认 |
| Git commit / push | 变更集人授（权威：`git-policy.md`） |

Git 写与发布序列细则不在本文件展开 → `git-policy.md` · 项目发布工作流。

## 状态协议（三态）

报告只能是：**Completed**（真实证据）/ **Blocked**（外部依赖缺失，写明原因）/ **Failed**。未完成不得宣称完成。Blocked ≠ 跳过：标 Blocked 后继续不依赖项。

## 反虚构与 Feature 占位

Feature Registry 只登记真实存在的代码；无业务代码时仅建模板占位。证据必须是真实命令输出，禁止「应该过了」。

## 项目默认值（禁止乱猜）

输入缺失时用可观测默认（例如锁文件 → 包管理器；未提供测试命令 → 占位并高亮），禁止臆造栈或命令。

## 语言政策

Agent 面向文件（AGENTS / rules / 子技能）单语；开发者文档按项目约定（可三语）。细节见项目 CONTRIBUTING。

## 熔断与上下文熔断

平台 / 身份不可用 → Blocked 并继续其余轨道；禁止跳过后假装成功。上下文不足时可在理解阶段前两步后暂停，获「继续」后再从 `.governance/state.json` 续跑。

## 多 Agent

`.governance/state.json` 记录 identity；`scripts/check-lock.js` 持锁检查；不得并行修改同一文件。

## 错误分类

**Recoverable**（可重试 1 次）/ **Blocked** / **Fatal**（停止整次引导并给出回滚依据）。禁止一律跳过。

## 完成定义（任务）

代码 + 测试 + 约定门禁 + 知识同步（按规模分级）= 完成。缺任一项 = 未完成。每项 ✅ 须带证据层级（mechanical / human-attested / unverified）——见 `testing.md`。
