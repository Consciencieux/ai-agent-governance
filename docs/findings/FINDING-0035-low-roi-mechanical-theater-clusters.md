---
id: FINDING-0035
status: Resolved
type: mechanism-gap
observed_in: gen2
resolved_in: gen2
---

# FINDING-0035：为管不住的语义硬加低收益检查——日常 gate 内 cluster / 测试盘点

## 分类

- 严重度：中（占 daily `check` 预算；绿灯制造「语义已管住」错觉）
- 影响范围：repo daily gate（`check-doc-consistency` clusters + WRAP）+ 部分 `npm test` 套件；INSTALLED 同簇拷贝随 `scripts/lib/doc-consistency/`
- 研究方向：C. 执行缺口 · D. 验证调度 · E. 检查器正确性 · G05 治理自身膨胀
- 同族：FINDING-0034（Forbidden 术语门禁，已 Resolved）；FINDING-0036（标题造黑话）

## 观察

大清仓（Gen1 sunset / PLAN-0055）砍的是**吨位级脚本与 CI 作业**。残留病不在「外面还有几百个 JS」，而在**幸存 daily 门禁肚子里**：用禁词表 / 标记 regex / 标签存在性去假装解决难语义问题——与 Forbidden 术语门禁同构。

## 证据盘点（2026-09-16）

| 对象 | 日常？ | 实际证明什么 | 处置 |
| --- | --- | --- | --- |
| `numeric_claims` | 曾是 | README `N checks` vs DEFAULTS | **RETIRED** |
| changelog-narration | 曾是 / 后按需 | Unreleased 禁若干验证叙事词 | **RETIRED**（禁词表 ≠ CHANGELOG 内容边界） |
| `consent_cluster` | 曾是 | 同步组含 consent marker regex | **RETIRED**（真同意靠 CTRL-0002 / git.policy，不靠五条 regex） |
| `adr-status` 簇 + `scripts/lib/adr-status.js` | 曾跑编排、从不 fail-closed | ADR Unreleased 陈述 vs CHANGELOG | **RETIRED**（无调用方后 lib 一并删除） |
| `judgment-language.test.js` | 曾是（`npm test`） | 正文仍含子串 `judgment` 等 | **RETIRED**（标签存在 ≠ judgment 执行；I5 仍由 payload 套件守） |
| `docs:parity` / freshness | parity 日常 | 结构计数 / git 时钟 | **KEEP**（勿叙述成译文质量 OK） |

**KEEP（有真实失败面或结构契约）：** `broken-links`、`prompt-sync`、gated 半边 `version-examples`、`protected-files`、`principles-index`、`plans_status_unknown`、`layout-sync`、`role-completeness`、`daily-check-surface`、`coding-hygiene`、secrets / must-ship / verify_governance。

## 根因

1. 难问题无法用短正则证明，却被焊进 `--gate` / `npm test`。
2. 负向 oracle 存在 ≠ 日常路径有失败面。
3. 绿灯制造治理感，拆起来像「削弱防护」。

## 关闭条件

1. `numeric_claims` / `consent_cluster` / consistency 侧 `adr-status`（及无引用 lib）/ `check-changelog-narration.js` 从编排与库存移除。
2. `judgment-language` 套件从 `npm test` 移除；不得再被引用为 judgment 已机械 enforce。
3. 本 Finding Resolved；不得声称「同意语义 / ADR 持续执法 / judgment 执行 / CHANGELOG 内容边界」已由上述删除物解决。

## 解决情况

2026-09-16：上表全部 **RETIRED**；日常 `check` 与 `npm test` 不再承载这些空转/标签戏。CTRL-0002、broken-links、payload I5 等真门禁保留。changelog 内容边界改回 judgment（enforcement 义务 `changelog-narration-island` → `inherent_judgment`）。

## 关联

- FINDING-0034、FINDING-0036、FINDING-0016、FINDING-0019、FINDING-0005、FINDING-0003
- ADR-0010
- `scripts/lib/doc-consistency/*`、`repo-tools/check-doc-consistency.js`

## 回归保护

- `npm run check` / `check:docs` 不加载已删簇；`check-changelog-narration.js` 不存在。
- `tests/suites/judgment-language.test.js` 不存在。
- 入口无 `N checks` 宣称时不得再复活 numeric_claims「守护」。
