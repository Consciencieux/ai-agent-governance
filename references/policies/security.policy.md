# 安全规范（Security）

## 密钥与敏感信息

- 真实密钥（API key、token、password）**永远不**写入代码、文档、提交或 CHANGELOG
- 使用 `.env` 存储本地机密，`.env` 必须被 `.gitignore` 忽略
- 模板值放在 `.env.example`（占位符，无真实值）
- 提交前检查 `git diff --cached` 是否含机密；怀疑泄漏 → 立即报告并建议轮换密钥
- **Agent 勿回显：** 扫描命中或用户粘贴的疑似密钥，报告时只给路径 / 变量名 / 类型，**不得**把完整 secret 原文写进聊天、日志或 CHANGELOG；机械扫描入口为 `scripts/check-secrets.js`（退出码以脚本为准）

## 敏感文件类型（一律 gitignore）

- `.env` / `.env.*`（保留 `.env.example`）
- `*.key`、`*.pem`、`*.p12`、`*.pfx`
- `id_rsa`、`credentials.json`、`secrets.*`
- 构建产物、依赖目录、日志、覆盖率报告

## 依赖安全

- 用项目包管理器锁文件（lockfile 必须提交）
- 新依赖需说明用途；重型/高风险依赖需用户确认
- 配合 CI 平台的依赖漏洞扫描（如 Dependabot），高危漏洞需人工评估

## 代码安全基线

- 不硬编码凭据；用环境变量或 secret 管理
- 不 `eval` 用户输入；不把用户输入拼进 shell 命令
- 日志不打印敏感字段
- 发现漏洞 → 记录到 CHANGELOG 的 Fixed 段；治理检查应提供修复建议，而非限制开发者进行必要的本地修复，公开披露遵循项目政策

## 违规处理

任何违反本规范的行为 → 立即停止相关操作，报告给用户，说明证据与修复建议。
