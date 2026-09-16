---
id: FINDING-0034
status: Resolved
type: mechanism-gap
observed_in: gen2
resolved_in: gen2
---

# FINDING-0034：术语 Forbidden 列 + terminology 门禁——用假检查假装管住翻译，收益低

## 分类

- 严重度：低–中（日常 `check` 预算被占用；绿灯制造「三语已对齐」错觉）
- 影响范围：repo-only（`docs/glossary.md` Forbidden 列、`repo-tools/check-terminology.js`、daily check 接线）
- 研究方向：C. 执行缺口 · D. 验证调度 · E. 检查器正确性 · G05 治理自身膨胀

## 观察

`docs/glossary.md` 的 `Forbidden zh-CN` / `Forbidden zh-TW` 列与 `repo-tools/check-terminology.js`（PLAN-0020）意图是机械拦截简繁/译法串台。实际形态是：在**语义对齐很难**的问题上加一层很薄的字符串黑名单——登记约十余个互斥对、加豁免注释、焊进日常 check——仪式感强，对真实翻译串台覆盖面极窄。

## 证据

1. **覆盖面**：术语表 100+ 行，非空 Forbidden 约 11 行；绝大多数串台、漏翻、同义乱译不在名单内。
2. **机制能力**：只做字面命中，不评判整段译文质量（PLAN-0020 原文已承认）。结构 parity 与 Forbidden 同时绿灯 ≠ 三语语义对齐。
3. **执行时机**：写作当下 Agent 不查 glossary；门禁只在跑 check 时生效，拦不住生成过程中的串台。
4. **同族模式**：与 FINDING-0019（事故驱动门禁堆积）、FINDING-0005（简单规则过闸、复杂语义缺 carrier）同向——难问题 → 加列加门禁加豁免 → 占 check 预算、边际收益小。

## 根因

1. 把「翻译语义正确」误当成可用低频禁词表近似的机械问题。
2. 一旦焊进 daily allowlist，空壳门禁也难拆（绿 = 有治理感）。
3. 正向三列（英/简/繁）才是译法权威；负向列不参与定译，却占据表结构与脚本复杂度。

## 影响

- 维护者与 Agent 误读「terminology 过了 = 译文 OK」。
- 日常 `check` / `check:docs` 多一次无实质约束的进程。
- glossary 表宽、夹具与文档指针为 Forbidden 列付出同步成本。

## 关闭条件

1. `docs/glossary.md` 去掉 Forbidden 两列，仅保留 English / 简体中文 / 繁體中文；页脚禁止译法说明删除。
2. `repo-tools/check-terminology.js` 退役并从 `package.json`、`daily-check-surface.v0.json`、`script-inventory` short_lists 移除。
3. 测试夹具 / AGENTS / sub-skills 中对 Forbidden·terminology gate 的描述同步清除或改为「无机械术语串台门禁」。
4. 本 Finding 记为 Resolved，且不得声称「Forbidden 已充分解决翻译串台」。

## 解决情况

2026-09-16：按上表退役 Forbidden 列与 `check-terminology.js` 日常接线；glossary 回到三列对照表。翻译正确性继续依赖源语言同步与人工/Agent 纪律，不假装有机械语义门禁。

## 关联

- PLAN-0020（doc-translation-governance，引入 Forbidden + terminology gate）
- FINDING-0019（incident-driven checker accretion）
- FINDING-0005（gate 分配：简单过重 / 复杂不足）
- FINDING-0003 / coding.policy 工程克制（machinery test）
- ADR-0020（术语门禁拆为 REPO-ONLY 的历史；本条裁决其 **retire**）

## 回归保护

- `npm run check` / `check:docs` 不再调用 `check-terminology.js`。
- `docs/glossary.md` 表头仅三列；`check-daily-check-surface` 允许名单无 terminology 入口。
- `script-inventory` 中该脚本为 `retire` 或不存在。
