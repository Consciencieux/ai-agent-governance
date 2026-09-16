# 密钥扫描

## Trigger

暂存区/提交前/CI；用户说「扫密钥」「secret scan」；发布预检。

## Authority

语义边界：`docs/rules/security.md`（若存在）。**机械载体（RUN，勿当阅读权威）：** `scripts/check-secrets.js`（INSTALLED；CTRL-0001）。

## Invoke

在仓库根执行：`node scripts/check-secrets.js`（或项目注册的等价入口）。Agent 不得回显匹配到的 secret 原文。

## Verify

退出码 0；报告不含明文 secret。伪造密钥夹具必须被拦（表征/门禁证据）。

## Non-goals

不负责密钥轮换、Vault 集成；读本叶 ≠ 已加载扫描算法语义。
