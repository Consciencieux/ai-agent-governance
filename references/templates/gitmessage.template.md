# .gitmessage.txt 模板（生成到目标项目根目录）

INIT 时复制为 `<project>/.gitmessage.txt` 并配置为仓库级默认（`git config commit.template .gitmessage.txt`）。替换 `{{...}}` 占位符；遵循项目提交信息语言约定（默认英文 Conventional Commits）。

```
# <type>(<scope>): <subject>
# |<---- Using a Maximum Of 50 Characters ---->|
#
# type: feat / fix / docs / refactor / test / ci / chore
# scope: optional module name (e.g. auth, ci, docs)
#
# Example:
# feat(auth): add login endpoint
#
# Body: explain WHAT and WHY, not HOW (wrap at 72 chars)
#
# Rules:
# - CHANGELOG.md updated when required (doc-only changes excepted)
# - tests pass, no secrets, no unrelated files staged
```

## 生成规则

- 提交信息语言遵循项目默认值约定（`{{CONVENTION}}`：默认英文 Conventional Commits；项目约定另指时跟随）
- 必须与 `references/policies/git.policy.md` 的提交信息约定一致（单一事实源是 git.policy.md，此处为模板）