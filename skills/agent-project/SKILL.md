---
name: agent-project
description: 明确请求的项目接入、治理巡检、CI、版本准备与发布。配置实际需要的项目指令和交付工作流。日常开发使用 ai-agent-governance，通用只读代码审查使用 agent-review。
license: MIT
---

# 项目工作流

以项目已有工具、约定与用户所需产物安排工作。配置、巡检、发行说明和实际发布分别按请求执行。

## 加载

读取[工程核心](../../shared/core.md)、项目入口和相关配置。动作按并集选择：

| 当前动作 | 读取材料 |
| --- | --- |
| 项目接入、精简指令或治理巡检 | [接入方法](references/setup.md)、[知识维护](../../shared/standards/knowledge.md) |
| 建立或调整 CI | [CI 方法](references/ci.md)、[验证标准](../../shared/standards/verification.md)、[安全标准](../../shared/standards/security.md) |
| 版本或发行说明准备 | [发布方法](references/release.md)、知识维护 |
| 打包、部署或实际发布 | 发布方法、验证标准、安全标准、[授权与 Git](../../shared/standards/permissions.md) |
| 实际代码或配置修改 | [工程判断](../../shared/standards/engineering.md)、[变更完整性](../../shared/standards/changes.md) |
| Git 写操作或范围外副作用 | 授权与 Git |
| 恢复、协作或分阶段工作 | [上下文与交接](../../shared/context.md) |
| 命令、搜索与成品验证 | [工具使用](../../shared/tools.md) |

整文件链接读全文，章节链接读完整目标规则；截断接续，已读未变材料复用。新增操作前补读对应材料。

## 执行与交付

确认本次目标、实际环境和可用命令，再实施所需配置或准备材料。验证对应该次修改：接入核对宿主发现与读取，CI 核对命令和触发，发布核对版本与资产。

只读巡检交付诊断。配置请求交付配置和实际验证，发布请求执行已授权步骤并核对远端结果。业务实现交给[日常开发入口](../../SKILL.md)；独立代码与架构审查使用 [agent-review](../agent-review/SKILL.md)。
