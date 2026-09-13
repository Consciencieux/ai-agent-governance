---
id: PLAN-0050
status: Active
generation: gen2
target: both
---

# PLAN-0050：H2d 载荷调度与可移植性

**状态：** Active（2026-09-13；人类「开始H2d」= Active 授权。前置 H2c [PLAN-0049](archive/PLAN-0049-h2c-machine-controls.md) 已 Archived。Stage 0 冻结已记录）。

**归属：** [ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md) **H2d**（决策 5 + 决策 14：H2-0 → PLAN-0046 → a→b→c→**d**）。下一步 = **H3**（本带未完成前不得当作必装门槛）。

**问题（已对齐）：** 判断型 MUST 仍无机械载体（FINDING-0003）；触发/校验路由与 INSTALLED 默认面边界未 Narrow（FINDING-0004 / 0005）；可移植执行边界与 adapter 矩阵未收（FINDING-0007）；GitLab 栈模板与锁原子性、Git consent 机械 evaluator、MIGRATE 独立入口、L0–L4 工具面、示例≠约束与 ADR 持续执行缺口仍在 later 清单（FINDING-0010 / 0012 / 0014 / 0016 / 0017）。H2c 已交付本仓机读 Control + CONTROL-X；本带做**载荷调度与可移植性**，不把 opt-in githooks 或 L3 当作 2.1 必装。

**不是：** 把 opt-in githooks / L3 写成 2.1 必装（决策 5 Out）；升 Gen1 全量 `npm run check` 为 CI 阻断；重开 H2c Control 编号进 portable；新建第三份能力去向表；把本计划等同一次 SemVer 发布；一次吃完 H2d 全部 Finding 而不切片。

## 一句话目标

让判断型义务有可检查载体、consent/锁/MIGRATE 有机械入口、INSTALLED 调度边界经 Narrow ADR 可陈述——**不**把 hooks/L3 钉成必装，**不**一次重写全世界。

## Stage 0 冻结（Design 定稿；Active 后窄修须入 Ledger）

| 项 | 裁决 |
| --- | --- |
| 切片序 | **先** Git consent 机械 evaluator（CTRL-0002）+ 锁原子性（FINDING-0012）+ 一条判断型 MUST 载体（FINDING-0003 最小切片）；**再** MIGRATE 入口 + GitLab 模板（0010）；**再** adapter 矩阵（0007）与 L0–L4 工具面（0014）；0004/0005 进 INSTALLED **必须先** Narrow ADR，禁止口头装 router |
| INSTALLED router | 本仓 Task→Capability router 默认仍 REPO-ONLY；写入 INSTALLED 默认面须独立 Narrow ADR（ADR-0025 决策 9/14），本计划 Stage 内只允许「契约 + 可选 opt-in 实验路径」，不默认必装 |
| Enforcement 语义 | FINDING-0003：至少统一 allow / deny / warn / require-review 词汇表（可落 principles 或 policy 一节）；规范语言对判断型规则不得继续与可判定 MUST 混用无标记 |
| Consent | CTRL-0002 语义家仍是 `references/policies/git.policy.md`；本带补机械 evaluator（非把 AGENTS 变第二权威） |
| Lock | FINDING-0012：只读 `check-lock` 不足以称并发安全；最小 CAS/lease 或显式降级声明 + 测试 |
| CI | 唯一阻断仍 = `npm run check:must-ship`；Gen1 `npm run check` 保持观测 |
| 消费 | 只消费 ADR-0024 + `script-inventory.v0.json` + H2c controls；不发明第三份去向表；新 CTRL 仅 EXTRACT 时分配 |
| Out 硬禁 | opt-in githooks / L3 ≠ 2.1 必装；不把 H2d 全文当作下一次 tag 门槛（决策 8） |

## 范围（In）

1. **FINDING-0003（切片）** — 至少一条判断型规则有可判定 carrier；enforcement 四值语义可陈述；规范语言分层开始落地（不要求一次清完 8 类 judgment）。
2. **Git consent 机械 evaluator** — CTRL-0002：可运行 evaluator + 表征；binding 写入机读 Control 投影（H2c registry）。
3. **FINDING-0012** — 锁：原子拿锁或诚实降级 + 负向/并发表征。
4. **FINDING-0004 / 0005** — 若进 INSTALLED：先 Narrow ADR；否则保持 REPO-ONLY / 文档边界，不偷偷装 router。
5. **FINDING-0010** — GitLab 多栈模板与治理 job 边界对齐（延续既有回归面，收残留）。
6. **MIGRATE 独立入口** — 可发现的 migrate/upgrade 入口（脚本或 capability），不靠口头。
7. **FINDING-0007** — adapter / portability 边界矩阵最小可对账表（机读或 architecture 指针；不扩成百科）。
8. **FINDING-0014** — L0–L4 工具面：repo-keep 分类可陈述；不强制装 L3。
9. **FINDING-0016 / 0017** — 示例≠约束、ADR 持续执行：最小门禁或表征切片（可 defer 到本带末刀，但须入 Ledger）。
10. **Layout / inventory / 测试** — 新脚本进 architecture ×3 + inventory；表征进 suites。

## 非目标（Out）

```text
把 opt-in githooks 或 L3 当作 2.1 必装
把 Gen1 全量 npm run check 改成 CI 阻断
无 Narrow ADR 就把本仓 router 写入 INSTALLED 默认面
把本仓 CTRL-NNNN 写成 portable invariant
新建 Gen1→2.x 能力去向权威表
一次关闭 FINDING-0003 全部 8 类 judgment / 完整 Evidence Model
把本计划等同一次 SemVer 发布
开工 H3 运行时拦截当本带完成条件
```

## 阶段

### Stage 0 — 契约冻结 — **完成**

- [x] 切片序 / INSTALLED 边界 / Out 硬禁（上表）
- [x] 人类 Active（「开始H2d」；H2c 已 Archived）
- [x] 首刀文件落点：`scripts/evaluators/ctrl-0002-git-write-consent.js` · `scripts/check-git-consent.js` · `scripts/check-lock.js` acquire/release · `references/principles/enforcement-semantics.md`

### Stage 1 — Consent + Lock + MUST 载体 — **完成**

- [x] CTRL-0002 机械 evaluator + Control 投影更新 + 表征（`h2d-portability`）
- [x] FINDING-0012 锁：`agent.lock` wx acquire/release + 测试
- [x] FINDING-0003 切片：`enforcement-semantics.md` 四值 + judgment/mechanical 分层
- [x] FINDING-0003 切片：sibling-closure 合同 + `check-sibling-closure.js` + 负向 fixture（Finding 仍 Confirmed：其余 judgment / 条件 3 全表未收）

### Stage 2 — MIGRATE + GitLab + portability 边界 — **进行中**

- [x] MIGRATE 独立入口：`scripts/migrate-governance.js` + SKILL.md 指针 + 表征
- [ ] FINDING-0010 残留收口
- [ ] FINDING-0007 最小 adapter 矩阵（可对账）

### Stage 3 — INSTALLED 边界 Narrow + L0–L4 + 0016/0017 切片

- [ ] FINDING-0004 / 0005：Narrow ADR **或** 明确保持 REPO-ONLY 的可验证声明
- [ ] FINDING-0014 L0–L4 工具面陈述（repo-keep）
- [ ] FINDING-0016 / 0017 最小切片或 Ledger defer（须有 successor）

### Stage 4 — 验证与闭包

- [ ] Discovery Ledger Open=0（terminal defer 须 successor）
- [ ] 本带承诺 Resolved 的 Findings 有证据；未承诺的保持 Confirmed 并写明
- [ ] exit review → Implemented → Archived（Plan archive ≠ Release）
- [ ] Roadmap / AGENTS / ADR-0025 现在时 → 下一步 H3（远）或下一次 2.x Plan
- [ ] 确认未把 hooks/L3 钉成必装；未升 Gen1 check；未无 ADR 装 INSTALLED router

## 完成条件（outcome）

- [x] CTRL-0002 有机械 evaluator 证据（非仅协议）
- [x] 锁行为诚实（原子或显式非原子）可测
- [x] 至少一条判断型义务有 carrier；enforcement 词汇可陈述（FINDING-0003 整体仍 Confirmed）
- [x] MIGRATE 入口可发现
- [ ] 0007 边界可对账
- [ ] 0004/0005 要么 Narrow 后进 INSTALLED，要么可验证地未装
- [ ] 未把 githooks/L3 当作 2.1 必装；must-ship 仍唯一 CI 阻断
- [ ] 证据真实（tests + 相关 scope gate / `check:must-ship`）

## Discovery Ledger

| ID | 类型 | 问题 | 状态 | 处置 |
| --- | --- | --- | --- | --- |
| D0 | constraint | 禁止 hooks/L3 钉成 2.1 必装；禁止升 Gen1 check | open | observe through Stage 4 |
| D1 | constraint | 无 Narrow ADR 禁止装 INSTALLED router | open | observe |
| D2 | architecture_gap | FINDING-0003 judgment MUST carrier（切片） | resolved | enforcement vocab + sibling-closure checker/contracts; Finding remains Confirmed for remaining judgment classes |
| D3 | mechanism_gap | CTRL-0002 Git consent evaluator | resolved | evaluator + CLI + CTRL-0002.json + tests |
| D4 | defect | FINDING-0012 lock 非原子 | resolved | wx agent.lock acquire/release + tests |
| D5 | architecture_gap | FINDING-0004 / 0005 INSTALLED 边界 | open | Stage 3 Narrow or REPO-ONLY proof |
| D6 | portability_gap | FINDING-0007 adapter 矩阵 | open | Stage 2 |
| D7 | defect | FINDING-0010 GitLab 模板残留 | open | Stage 2 |
| D8 | product_gap | MIGRATE 独立入口 | resolved | migrate-governance.js + SKILL MIGRATE pointer + tests |
| D9 | architecture_gap | FINDING-0014 L0–L4 工具面 | open | Stage 3 |
| D10 | architecture_gap | FINDING-0016 / 0017 切片 | open | Stage 3 or defer+successor |
| D11 | constraint | 禁第三份去向表；禁 CTRL 号进 portable | open | observe |

```text
Total known:  12
Resolved:     4
Open:         8
Unaccounted:  0
```

## 受影响文件（预告；交付时按实改修订）

### repo-infra

- `repo-tools/`（若有 repo-profile consent/lock 门禁）· `script-inventory.v0.json` · `controls/CTRL-0002.json`
- `tests/suites/`（h2d 表征）
- `docs/design-decisions/`（INSTALLED router Narrow ADR，若做）
- `docs/findings/FINDING-0003-*` · `0004-*` · `0005-*` · `0007-*` · `0010-*` · `0012-*` · `0014-*` · `0016-*` · `0017-*`
- `docs/plans/roadmap/{en,zh-CN,zh-TW}.md` · `AGENTS.md` · `CHANGELOG.md`
- `docs/product/{en,zh-CN,zh-TW}/architecture.md`

### payload

- `scripts/evaluators/`（consent / lock 相关）· `scripts/check-lock.js`（或后继）
- `references/policies/git.policy.md`（指针/绑定；语义家不搬家）
- `references/principles/`（enforcement 语义词汇，若落 portable）
- MIGRATE 入口（scripts 或 capabilities；路径 Stage 2 定）

## Target: both — 同步点

| 域 | 同步点 |
| --- | --- |
| repo | inventory、architecture、findings、roadmap、可选 repo CLI |
| payload | consent evaluator、lock、MUST carrier、MIGRATE、GitLab 模板 |
| 两侧 | CTRL-0002 binding 更新后，若双 profile 均有 CLI 则考虑 CONTROL-X（不强制本带首刀） |

## 参考

- ADR-0025 决策 5 / 8 / 9 / 11 / 14 · ADR-0023 · ADR-0024 · ADR-0020
- PLAN-0049 Archived（H2c）· PLAN-0048 / 0047 / 0046 Archived
- FINDING-0003 · 0004 · 0005 · 0007 · 0010 · 0012 · 0014 · 0016 · 0017
