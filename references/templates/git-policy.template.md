# .governance/git-policy.json 模板（INIT 生成）

INIT 时复制为 `<project>/.governance/git-policy.json`，替换 `{{...}}` 占位符。**Git 工作流治理的单一事实源**（见 `references/workflows/release.md` 与 `references/policies/git.policy.md`）。

```json
{
 "protectedBranches": ["main", "master"],
 "directPush": false,
 "requireReview": true,
 "allowForcePush": false
}
```

## 字段说明

| 字段 | 默认 | 含义 |
| --- | --- | --- |
| `protectedBranches` | `["main", "master"]` | 受保护分支；`directPush` 为 `false` 时 Agent 不得在这些分支上直接提交/推送，必须先创建特性分支 |
| `directPush` | `false` | 是否允许直推受保护分支（默认禁止；与分支工作流联动） |
| `requireReview` | `true` | 是否要求人工审核（PR 批准）后才能合入受保护分支 |
| `allowForcePush` | `false` | 是否允许 force push（默认禁止——不可逆操作） |

## 生成规则

- 分支命名服从**当前仓库约定**（写入生成的 AGENTS.md / `docs/rules/git-policy.md` 时引用项目 CONTRIBUTING 或既有模型；禁止把某一固定模式写成跨项目硬规则）
- 小型改动豁免：单文件、纯文档/typo 级修改且不涉及受保护分支的，可跳过分支直接提交，但必须在报告中说明（见 `references/policies/git.policy.md`「分支工作流」）
- 运行时门禁：`scripts/check-git-policy.js` 读取本文件，在受保护分支且 `directPush=false` 时退出码 1（提示先建分支）；`scripts/verify-governance.js` 校验本文件存在且字段合法
- 修改本文件属于治理文件变更（走「治理文件保护」流程），并同步更新 `docs/rules/git-policy.md` 的对应描述