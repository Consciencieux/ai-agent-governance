# Review Manager（TASK 计划）

> **Status: archived.**（已归档。归档即断言完成。）（原状态：已实现（2026-08-29）。 本页保留路线图条目 `Review manager` 的设计记录；实现位于 `references/templates/sub-skills.md` 第 8 节（见 [roadmap.md](../zh-CN/roadmap.md)）。）

### 任务目的

把「多智能体深度审查」固化为规范工作流：用户说「审核一下」时，Agent 不再靠临场发挥，而是按固定程序派并行子代理、分析改动、找问题、修复。这是 AI 自改代码后质量回看的标配能力，也是本仓库与被治理项目的共同刚需。

### 当前问题

- 用户实际使用已验证需求：两次人工发起的审查分别发现 2 严重 + 6 一般 + 6 碎项真实问题——但这个效果依赖主 Agent 临场状态，**没有固化的工作流保证每次审查都有最低质量**
- 可能漏派领域（如只查脚本忘了查文档）、漏查边界情况、修复不彻底
- 与 drift-check 的边界在会话中被错误混淆过一次（"审核"被口头对应到 consistency 模式）——需要明确定义，防止再次混淆
- 现有子技能（drift-check 等）全是**机械检查**，负责防遗漏；**没有任何子技能负责深度找问题**

### 提议方案

新增第 8 个子技能 **review-manager**（审核管理器）。

触发词：`审核一下` · `审核改动` · `review the changes` · `audit recent changes` · `review my changes`

工作流（五步）：

1. **确定范围**：`git diff <基线>..HEAD` + 未提交改动；基线默认上次审查点（手动指定，v1 不做自动记录）。**范围约束：只审改动集 + 直接受影响文件（被改脚本影响的测试、被改政策影响的生成物），不做全项目审查——全项目审查仅在用户显式要求时**
2. **派并行子代理**（固定 5 个领域，每领域一个，v1 不允许动态扩展）：
   - 脚本逻辑 —— 正确性、边界情况、错误处理
   - 文档一致性 —— 三语树、链接、版本示例、CHANGELOG 对账（调用 drift-check 脚本作为输入）
   - 测试覆盖 —— fixture 真实性、断言强度、flaky 风险
   - 治理工件 —— 政策、模板与实现是否一致、受保护清单
   - 安全 —— 密钥、权限规则、敏感信息
3. **汇总**：按严重度排序（严重/一般/琐碎），每条带文件路径 + 行号 + 证据原文
4. **修复**：严重和一般必须修；琐碎项报告后由用户决定
5. **门禁验证**：修复后跑 `npm run check`（测试 + parity），记录真实输出

**与 drift-check 的边界（防混淆，明确定义）**：

| | review-manager | drift-check |
| --- | --- | --- |
| 层级 | 深度（多智能体找问题） | 机械（防遗漏） |
| 输入 | git diff + 全项目相关文件 | manifest + 8 类脚本检查 |
| 产物 | 严重度排序的问题清单 + 修复 | drift-report.json |
| 触发 | 「审核一下」 | `check governance drift` |

互补关系：review-manager 的"文档一致性"子代理**调用** drift-check 脚本，不重复实现。

被治理项目注意：review-manager 聚焦**治理工件 + 最近改动**；业务逻辑审查范围由项目自身规范决定，不强制。

### 受影响文件

- `references/templates/sub-skills.md` —— 新增第 8 节 review-manager
- `docs/{en,zh-CN,zh-TW}/commands.md` —— 触发词入 Available Prompts 表 + Prompt Details 小节
- `SKILL.md` —— Phase 1 第 13 步子技能列表加入 review-manager
- `docs/{en,zh-CN,zh-TW}/architecture.md` —— 子技能清单
- `CHANGELOG.md` —— 新增子技能条目
- prompt-sync 检查自动覆盖新触发词（现有机制，无需额外改动）

### 风险

- **与 drift-check 混淆** —— 本会话已发生一次；用上表边界定义 + 触发词完全分离缓解
- **审查深度失控** —— 子代理无限展开；v1 固定 5 领域清单，不允许动态扩展
- **修复引入新问题** —— 强制修复后跑门禁组（第 5 步）
- **子技能数量变化** —— 7 → 8，数值声明（如"7 个子技能"）需同步更新，consistency 的数值检查会提醒

### 验证方法

- sub-skills.md 含第 8 节且触发词完整（文档断言）
- commands.md 三语含新触发词（prompt-sync 测试自动覆盖）
- 实际执行一次「审核一下」：派 5 领域子代理、输出严重度排序报告（狗粮验证）
- 子技能总数声明更新（consistency 数值检查通过）
