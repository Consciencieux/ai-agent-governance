# 审查后备积压（TASK 计划）


> **Status: archived.**（已归档。归档即断言完成。）（原状态：已完成（2026-08-29）。 交付对账（`scripts/check-plan-delivery.js`）现在会审计本计划声明的文件。既有缺陷与可选钩子重新实现要求均已落地，并由下方验证矩阵覆盖。）

**Target：both** —— 载荷侧运行时行为已在 `scripts/`、`references/init-spec.json` 及钩子模板/策略中落地；仓库侧同步已在 `docs/`（归档链接与布局）、`SKILL.md`、`CHANGELOG.md` 及三语计划副本中完成。钩子条目现已实现，不再延期。

### 任务目的

把 v0.10.0 深度审查（五个领域：脚本逻辑 / 文档一致性 / 测试覆盖 / 治理工件 / 安全）发现的两类待办固定为可追踪清单，作为后续版本的工作蓝图：**（一）既有缺陷**——v0.9.1 之前就已存在、非本版本引入；**（二）钩子重新实现待办**——`.githooks/pre-commit` 撤出 v0.10.0 后，未来若要重做，必须做对的全部要点。

### 边界说明

本计划**不承载**本版本引入的发布阻断项（第 5 同步点 `lifecycle.policy.md` 未接入 `CONSENT_SYNC_GROUPS`、载荷模板 push 权限矛盾、`stash`/`pull` 净损失、空转测试、`--doc-root` 路径穿越、`check-plan-delivery.js` 自身的证据空洞、protected-files 集群强制 0 文档、CHANGELOG/roadmap/AGENTS.md 计数漂移）。这些属于 v0.10.0 发布前立即修复，另行处理。此处只记录**既有缺陷**与**钩子 B 待办**两类。

### 一、既有缺陷（v0.9.1 前已存在）

按文件列出，每条带行号与证据。

1. `scripts/verify_governance.js:202` —— `{ name: "Sync groups check", ok: isFile }` 传入函数引用而非调用结果。函数对象恒真，该检查**永久空过**，且 JSON 结果的 `ok` 字段被 `JSON.stringify` 丢弃。实证：从被治理项目删除 `scripts/check-sync.js`，validator 仍报 `7/7 passed`。SEVERE。
2. `scripts/check-sync.js:47` —— porcelain 解析 `/^..\s+(.+)$/` 遇 git 引号路径（`core.quotepath` 默认开启，中文/空格文件名被转义）静默漏检；rename 行的 `->` 混入捕获路径。SEVERE。
3. `scripts/check-sync.js:47,:91` —— 未跟踪新文件被 git 折叠为父目录名（`?? docs/`），导致已满足的 `require` 被误判为未同步。需 `--porcelain -uall`。GENERAL。
4. `scripts/check-lock.js:24` —— 仅 `null`/`undefined` 释放锁，`locked: false` 与 `locked: ""` 被当作锁持有；JSON 输出 `{"locked": true, "lock": false}` 自相矛盾。GENERAL。
5. `scripts/check-lock.js:18`、`scripts/check-sync.js:21`、`scripts/check-git-policy.js:19` —— `catch { return null }` 把「文件不存在」与「JSON 损坏」合并为同一分支，损坏时静默按安全态处理（锁文件损坏放行第二 agent；sync-rules 损坏禁用门禁）。应区分 `ENOENT` 与 `SyntaxError`，后者 fail-closed。SEVERE。
6. `scripts/check-secrets.js:11-17` —— 仅 5 个模式；漏 Slack/Google/Stripe/Azure/JWT/base64/PEM 主体/带标点密码；credential 赋值的字符类排除 `/+=!@$%`；`.env` 在 IGNORED_PATHS 中被整体跳过（`git add -f .env` 通过）；`:59` 报 `line: "staged-diff"` 占位符而非真实行号。GENERAL。
7. `scripts/check-doc-consistency.js:110` —— `mdFiles` 用 `rel.startsWith("archive/")` 判定，与 Windows 的 `path.relative` 结果 `archive\a.md` 永不相等，`docs/archive/` 的链接永不扫描。GENERAL。
8. `docs/archive/` —— 因第 7 条的盲点，10 个死链从未被报告：`sync-groups-mechanical-check.md`、`governed-project-sync-groups.md`、`review-manager.md`、`tiered-review-gate.md` 内指向语言树的返回链接（`../../en/plans/...`）及 `../roadmap.md` 均不解析。GENERAL。
9. `scripts/generate-governance.js:288` —— `governance_version` 硬编码为 `"0.9.0"`，比 `package.json` 落后一个版本。每次 INIT 生成的 `.governance/manifest.json` 都自报 0.9.0；release 版同步流程不更新它，因此由 v0.9.1 初始化的项目各自报到旧版本。SEVERE（版本一致性）。

### 二、钩子重新实现（B 方案，已完成）

1. `.governance/consent.json` 加入生成的 `.gitignore` 与 `references/policies/governance-files.policy.md` 的 `.governance/` 追踪表——模板宣称「git-ignored」，生成的 `.gitignore` 却没有它。
2. fail-open 改为 fail-closed——`consent.json` 缺失时 exit 1 报错，而非 `[ -f ] || exit 0` 静默放行（删除凭据即禁用检查）。
3. 校验 commit message——`consent.json` 已记录 `message` 字段，现钩子解析后丢弃；message 是用户实际读取的唯一字段，偏离未被约束。
4. 「脆弱性」章节注明 `--no-verify` 与 `git config --unset core.hooksPath` 两条绕过路径——目前模板诚实说明「不能防完全绕过」，但未点名这两个最直接的动词。
5. 修复空格/中文文件名假拒——改 `git -c core.quotePath=false diff --cached --name-only -z`；不用 `tr -d ' '` 删除文件名内部空格、不用逗号作分隔符。
6. 提取逻辑改 fence-count——`generate-governance.js:86-94` 从首个 ``` 切到末个 ```，模板加第二个代码块即静默破坏钩子。
7. `references/init-spec.json` 的 artifact type 从 `documentation` 改为正确类别——提交门控钩子被归类为文档。
8. 生成的 `.githooks/pre-commit` 纳入 governance-file-protection 保护清单——目前只有模板受保护，生成进目标项目的钩子是普通文件。
9. 测试用真 sh 执行——废除「JS 重写指纹逻辑」的恒真测试，改为 `sh -n` 语法校验 + 真实 git 提交（匹配/不匹配/缺凭据）验证。
10. 可执行位 755——生成产物当前 mode 666，POSIX 目标下不可执行。

### 三、验证方法（修复后逐项对照）

- 第 1 条：删除被治理项目 `scripts/check-sync.js` 后 validator 必须报失败并保留 `ok` 字段。
- 第 2/3 条：构造中文、空格、rename 文件名的暂存改动，`check-sync.js` 必须正确命中/不误报 watch 组。
- 第 4/5 条：`locked:false`、`locked:""`、损坏 state.json 各自的行为须可区分，损坏态 fail-closed。
- 第 6 条：对已知真实密钥形状（Slack/Google/Stripe/JWT/PEM 主体/带标点密码/force-added `.env`）逐一验证阻断。
- 第 7/8 条：`npm run check` 现在会扫描 `docs/archive/`；已发现的死链均已修正，一致性门禁干净通过。
- 第 9 条：新生成的 manifest 的 `governance_version` 须与 `package.json` 一致；重跑 INIT 后的 manifest 报当前版本而非 0.9.0。
- 钩子 1-10：全部落地后，在真 sh 环境用真实 git 提交矩阵验证；`npm run check` 与 `npm run check:all` exit 0，测试数上调且无恒真断言。

### 受影响文件

- scripts/verify_governance.js —— 第 1 条
- scripts/check-sync.js —— 第 2、3、5 条
- scripts/check-lock.js —— 第 4、5 条
- scripts/check-git-policy.js —— 第 5 条
- scripts/check-secrets.js —— 第 6 条
- scripts/check-doc-consistency.js —— 第 7 条
- docs/archive —— 第 8 条（死链内容修正）
- references/templates/githooks-template.md —— 钩子 1-10
- references/init-spec.json —— 钩子 1、7
- references/policies/governance-files.policy.md —— 钩子 1、8
- scripts/generate-governance.js —— 钩子 6、第 9 条
- tests/run-tests.js —— 钩子 9 及第 1-6 条回归测试
- `docs/{en,zh-CN,zh-TW}/architecture.md` —— 恢复模板后的 Repository Layout 同步
- `docs/{en,zh-CN,zh-TW}/bootstrap-output.md` —— Phase C 钩子产物文档
- `docs/{en,zh-CN,zh-TW}/plans/post-review-remediation.md` —— 完成状态及三语受影响文件声明同步
- `SKILL.md` —— 生成钩子的受保护文件摘要
- `CHANGELOG.md` —— Unreleased 行为变更记录
- `references/policies/git.policy.md` —— 被治理项目保护清单
- `references/templates/agents-md.template.md` —— 生成 Agent 的保护清单

### 风险

- **批次过大**：既有缺陷横跨 7 个脚本，一次修复面广；建议按 SEVERE 优先分批，每批独立跑门禁。
- **钩子保持可选启用**：管理员必须显式配置 `core.hooksPath`，并确保确认凭证持续被忽略；提交时依赖 Node.js。
- **check-secrets 模式扩展**：新增模式有误报风险，需配真实样本与阴性样本双向验证，避免把普通文本当秘密阻断。

---
