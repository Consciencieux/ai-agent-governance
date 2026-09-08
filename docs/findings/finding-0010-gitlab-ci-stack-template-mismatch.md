---
id: FINDING-0010
status: Confirmed
type: defect
direction: E
root_cause: R3
severity: High
affected:
  - skill
github_issue: 6
opened: 2026-09-08
resolved:
related:
  plans: []
  adrs: []
---

# GitLab 多栈 CI 模板存在真实生成缺陷：Python/Go/Java/C++/docs-only 段内仍跑 npm 命令

## 观察 Observation

`references/workflows/ci.md` 的 GitLab CI 各栈段（python / go / rust / java / cpp / docs-only）虽然已有独立的 `## GitLab CI (<stack>)` 段（v0.15.0 修了 stack-aware 选段），但**段内的 image 与 script 命令仍是错的**——非 Node 栈用 Node 镜像跑 npm 命令，或 Node 镜像配错。

## 证据 Evidence

```text
## GitLab CI (python)
  image: python:3.11
  script:
    - npx prettier --check .    # Python 镜像跑 Node 命令
    - npm run lint              # ❌
    - npm test                  # ❌
    - npm run build             # ❌
```

python 段用 `python:3.11` 镜像却执行 `npx` / `npm`（node 命令），生成的 GitLab CI 在真实环境中必然失败。段注释虽写了「按栈替换」，但默认生成的命令就是错的。go / rust / java / cpp 段需逐一核验。

## 根因 Root cause

v0.15.0 只修了「generator 选对段」（`gitlab-<stack>` 匹配），没修「段内模板的命令本身」。栈段标题存在，但各栈的正确命令没有真正写进模板。

## 影响 Impact

- 被治理项目用 `--ci-platform gitlab --stack python|go|java|cpp|docs-only` INIT 后，生成的 GitLab CI 无法运行（镜像与命令不匹配）。
- CI 声明运行治理门禁，但主流水线即失败。

## 关闭条件 Resolution criteria

1. 各栈段内 image + script 用该栈的真实命令（python → ruff/pytest，go → gofmt/go vet/go test，java → mvn spotless:check/verify，cpp → clang-format/ctest，docs-only → markdownlint）。
2. 生成测试覆盖「每个平台×每个栈」组合，断言生成的命令与该栈匹配（v0.15.0 已为 GitHub Actions 侧生成全组合测试，GitLab 侧缺）。

## 解决 Resolution

（待填。）

## 回归保护 Regression protection

一个负向测试：生成 `--ci-platform gitlab --stack python`，断言结果不含 `npm`/`npx`/`node` 命令（除非栈确实是 node）。这是 E06「fix ≠ protected」的直接应用。
