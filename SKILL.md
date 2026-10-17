---
name: ai-agent-governance
description: 日常软件开发：实现功能、诊断缺陷、重构、完整删除、维护测试与文档、重新评估工程方案、继续开发任务。交付代码或所需结论。独立只读审查使用 agent-review；项目接入、CI 与发布使用 agent-project。
license: MIT
---

# 日常开发

先按用户要的产物选择入口：独立审查进入 [agent-review](skills/agent-review/SKILL.md)，项目接入、CI 或发布进入 [agent-project](skills/agent-project/SKILL.md)。其余任务在本入口继续；设计与分析请求交付结论，实施请求修改代码。

## 加载

读取[工程核心](shared/core.md)、项目有效指令和任务相关原文。下表按本次动作取并集：

| 当前动作 | 读取材料 |
| --- | --- |
| 设计、选型、重新评估方案 | [工程判断](shared/standards/engineering.md)、[设计方法](references/design.md) |
| 写代码、改变行为或修复缺陷 | 工程判断、[变更完整性](shared/standards/changes.md)、[验证标准](shared/standards/verification.md) |
| 实现或扩展功能 | [实现方法](references/implement.md) |
| 报错、失败测试、回归或性能异常 | [诊断方法](references/diagnose.md)，重点核对 [CHG-02 根因与同类实例](shared/standards/changes.md#chg-02) |
| 重构、重命名、移动、删除或格式变更 | [重组方法](references/restructure.md)，删除重点核对 [CHG-03](shared/standards/changes.md#chg-03)，过渡核对 [CHG-04](shared/standards/changes.md#chg-04) |
| 文档编辑、说明漂移、公开用法或约束变化 | [知识维护](shared/standards/knowledge.md) |
| Git 写操作、授权歧义或外部副作用 | [授权与 Git](shared/standards/permissions.md)；提交、分发另读 [SEC-03](shared/standards/security.md#sec-03) |
| 认证、权限、不可信输入、凭据或新增外部依赖/执行 | [安全标准](shared/standards/security.md) |
| 跨轮任务、恢复或并行工作 | [上下文与交接](shared/context.md) |
| 搜索、命令选择或运行验证 | [工具使用](shared/tools.md) |

整文件链接完整读取，章节链接完整读取目标规则；“重点核对”在已读文件中定位。截断时接续，本会话未变材料复用。新的操作出现时补读对应材料。纯文案任务使用核心、知识标准和原文；修改代码时再加入实施材料。

## 工作顺序

1. 确定目标、相关实现、已有决定与验收方式。编辑前检查工作区；调查会改变方案的未知。
2. 按目标选择职责和实现。局部任务直接处理；需要跨轮协调的设计沿用一个短计划。
3. 完成授权修改，沿实际依赖处理调用者、测试与必要说明；生成物从来源更新。
4. 运行相应验证，回看完整差异与本次已知问题，交付结果、关键依据和具体待办。

检查并修复沿用同一次请求的授权；需要独立审查视角时使用 agent-review，再继续处理确认问题。
