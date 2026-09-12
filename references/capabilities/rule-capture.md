# 规则捕获（Rule Capture）

> Capability leaf (`rule-capture`). Authority projection for Phase 5c (PLAN-0040).
> Orchestration pointer: `docs/rules/lifecycle.md`.

任务中只收集开发者明确提出的持久性行为要求，不收集系统指令、问题、任务专属验收标准、临时 workaround、秘密或凭据。候选必须有唯一 ID（`rc-<task_id>-<序号>`）、规范化文本、作用域、初始分类、理由和目标章节；重复出现只能提高优先级，不能单独升级为持久规则。
 - **Phase 5a 裁定门**：在写入前给出 `persistent / one-off / unclear` 清单。明确的一次性要求只报告、不写入、不计入待决；持久和模糊项必须由开发者按 ID 确认或改判，省略项不默认同意。规则内容裁定不等于 Git 提交/推送确认。
 - **Phase 5b 写入与同步**：只有明确确认的持久项才能写入 `AGENTS.md`/`docs/rules/**`。先搜索既有规则并更新单一事实源；遵守治理文件保护、CHANGELOG、AGENTS 指针和同步组流程。
 - **Phase 5c 重新验证**：规则文件写入后重新运行受影响的治理校验、密钥扫描和同步组门禁；运行项目自己的治理校验入口（`node scripts/verify-governance.js`，或项目注册的等价命令）。写入完成后才进入 Phase 6。
 - **未裁定/中断**：把候选保存在受跟踪 `state.json.rule_capture`，任务状态为 `blocked`，下一次运行读取候选并从 Phase 5b 恢复；`activity.jsonl` 只作追加式审计记录，不单独承诺跨电脑持久化。
