---
name: agent-project
description: 项目接入与交付工作：配置 Agent 项目指令、审查治理漂移、建立或调整 CI、准备版本和发布。用于明确的初始化、项目工作流、治理巡检或 release 请求。日常功能与缺陷处理使用 ai-agent-governance；通用代码审查使用 agent-review。
license: MIT
---

# 项目工作流

按项目实际工具和用户要求，接入必要的工作约定、检查与发布能力。

## 加载

读取[工程核心](../../shared/core.md)、项目现有入口和相关配置。只读巡检以诊断交付；配置、修复与发布按对应授权执行。

| 当前动作 | 读取材料 |
| --- | --- |
| 新项目接入、精简项目指令、治理巡检 | [接入方法](references/setup.md)、[知识维护](../../shared/standards/knowledge.md) |
| 建立或调整 CI | [CI 方法](references/ci.md)、[验证标准](../../shared/standards/verification.md)、[安全标准](../../shared/standards/security.md) |
| 版本、发行说明、打包、部署或发布 | [发布方法](references/release.md)、知识维护、验证标准、安全标准 |
| 实际配置和代码修改 | [工程判断](../../shared/standards/engineering.md)、[变更完整性](../../shared/standards/changes.md) |
| Git 写操作、权限或外部副作用 | [授权与 Git](../../shared/standards/permissions.md) |
| 跨会话或分阶段执行 | [上下文与交接](../../shared/context.md) |
| 搜索、检查命令和成品验证 | [工具使用](../../shared/tools.md) |

各行条件叠加，读取截断时接续。有关内容已读且没有变化时复用。

## 执行与结束

先确认当前工具、项目用途及可执行命令，再确定本次需要的文件或操作。合并现有指令，保持责任与实际来源清楚。完成后检查目标客户端发现路径、实际命令及相应产物。

交付用户请求的配置、巡检结论或发布结果，附真实验证。需要修改业务行为时交给[日常开发入口](../../SKILL.md)；独立代码或架构审查使用 [agent-review](../agent-review/SKILL.md)。
