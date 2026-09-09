---
id: PLAN-0030
status: Archived
generation: gen1
---

# PLAN-0030：领域级测试入口

> （已归档。归档即断言完成。）（原状态：已实现，待 Release 归档。本计划是反补丁计划 `anti-patch-development.md` §3「拆分采用基线递减策略…并在每次迁移后保留领域级可运行入口」的**既批准承诺尾款**，不是新机制；工程克制「机制测试」不触发，受「已批准需求优先」边界保护。）

**Target：repo-infra** —— `run-tests.js` 是本仓库测试运行器（REPO-ONLY，不随 INIT 分发），改动只影响本仓库的开发循环与测试架构。

### 任务目的

测试拆分（v1.0.1 已完成 11 个领域套件）之后，开发循环只能使用全量入口：改一个 README 标点也要跑 `npm test`（实测 42.9s，占 `npm run check` 44.6s 的 96%）。反补丁计划 §3 承诺的「领域级可运行入口」从未交付。本计划交付一个**手动**快速入口，使迭代环路可以只跑相关套件，同时保持发布/审计环的全量回归不变。

### 当前问题

- 全量测试 42.9s，成本集中在 4 个套件：security 10.8s + docs 9.9s + consistency 6.3s + payload 5.9s = 33s（76%）。
- `tests/run-tests.js` 无 CLI 参数：SUITES 硬编码、不读 `process.argv`，单套件运行无入口。
- 这是开发体验缺口，**不是**全量回归本身错误——发布/审计/提交前全量是正确设计。

### 提议方案

`tests/run-tests.js` 增加两个 CLI 参数：`--suite <name>` 与 `--list`。

行为规格（严格收窄，不超出）：

1. **无参数** → 现有全量行为，逐字不变（`npm test`、`npm run check` 继续全量）。
2. **`--suite <name>`** → 只注册并运行指定的单个套件。
3. **未知套件名** → `process.exit(1)`，并在标准错误列出可用套件（提示 `--list`）。
4. **`--list`** → 按 `SUITES` 声明顺序打印 canonical name（每行一个），exit 0。
5. **`--suite all`** → 等同无参数（全量），语义明确，文档可写。
6. **不传参数时 `npm test`/`npm run check` 输出不变**——不改变既有调用方的任何行为。

#### 套件 canonical name（唯一命名规则）

`<name>` 是去掉路径与 `.test.js` 扩展名后的名字，**不接受 `docs.test.js` 这类别名**——避免产生第二套命名规则：

```text
validator
security
consistency
docs
release
generator
payload
hygiene
narration
sync
plan-delivery
```

`--list` 严格按 `SUITES` 数组声明顺序输出（不排序），使输出同时充当注册顺序的可见事实。

### 隔离性（已实测基线，作为计划证据，不作为默认测试）

| 证据 | 结果 |
| --- | --- |
| 11/11 套件独立运行（单独 require + 执行） | 全部通过,无失败 |

实测（2026-09-08 基准）：`consistency(68) docs(51) generator(33) hygiene(16) narration(12) payload(41) plan-delivery(15) release(18) security(35) sync(11) validator(26)` 各自独立运行均通过。helpers 的 `TMP_ROOT` 每次运行独立创建，套件间无共享初始化状态。

**决定**：不要把隔离性回归接入默认 `npm test`（会放大测试成本到约 90s，本末倒置）。隔离性由以下方式保持：(a) 本计划记录基线证据；(b) 单套件运行入口本身是隔离性的一次性使用证明。若未来出现依赖全局状态的回归，由具体测试失败显式暴露。

### 验证方法

1. `node tests/run-tests.js --list` → 按 `SUITES` 顺序输出 11 个 canonical name，exit 0。
2. `node tests/run-tests.js --suite unknown` → exit 1，stderr 列出可用套件。
3. `node tests/run-tests.js --suite hygiene` → 只执行 hygiene 套件（实现后 21 个：原 16 + 本计划新增 5 条 CLI 断言），不含其他套件输出。
4. 无参与 `--suite all` 的全量语义：**用不递归的方式验证**（见下）。
5. `npm run check` → 全量门禁 exit 0（既有脚本不受影响）。

#### 递归防护（测试设计约束）

CLI 回归测试**不得**在测试体内执行会重新加载当前套件的形式——`--suite all` 与无参都会拉起整个 runner，若从测试内 spawn 就会递归启动（自身套件被再次注册执行）。约束：

- 允许 spawn 的形式：`--list`、`--suite unknown`、`--suite <不含本测试的单个套件>`（例如从 hygiene 测试里 spawn `--suite narration`）。
- 无参与 `--suite all` 的等价性**不用 spawn 验证**，改为读源断言：解析 `run-tests.js`，确认 `all` 与「无参」走同一分支，不构造第二条全量路径。
- 现状核实：现有测试对 `run-tests.js` 的引用全部是写入临时夹具文件，无一 spawn 真 runner；本计划保持该性质。

### 受影响文件

- `tests/run-tests.js` —— 增加参数解析 + 分派
- `tests/suites/hygiene.test.js` —— CLI 行为回归断言（runner 机制归 hygiene 套件，与现有 mutation-probe 断言同址）
- `CHANGELOG.md` —— `Added` 段记录
- `docs/{en,zh-CN,zh-TW}/plans/run-tests-suite-entry.md` —— 本计划（三语）

### 明确不做（与工程克制 §3 对齐）

- **不做自动 scope routing**：不根据 `git diff` 自动选择测试子集；`--suite` 是手动明确入口，不冒充"自动范围门禁"。
- **不做 `--changed`**：门禁脚本（check-doc-consistency 等）保持全局语义，不受此改动影响。
- **不做门禁范围选择**：`check:docs`/`check:payload` 等仍以全量测试开头，除非另有独立证据证明映射安全（本计划不提供该证据，不请求批准）。
- **不做资格矩阵/评分/审查阶段**：无新增治理机制。

### 风险与决定

- **`--suite` 会不会被误用于绕过全量回归？** 规避：`npm run check` 与 `--suite` 解耦——`check` 系列永远全量；`--suite` 只作为开发迭代入口。文档在 CHANGELOG 与计划中明确，不做自动化拦截。
- **单套件运行是否可能因缺少其他套件的初始化而假绿？** 规避：已实测 11/11 独立通过（见隔离性）；本计划把该证据记录为基线，不把 11 遍套件接入测试（成本不可接受）。若未来出现套件间隐式依赖，其失败由 CI 全量基线捕获。
- **约定冲突：** 反补丁计划 §3 承诺「每次迁移后保留领域级可运行入口」，本计划是尾款——若被内部审查认为"新机制"，引用工程克制「已批准需求优先」边界，冲突时升级决策、不本地裁决。

### 已知限制

- 手动入口，性能改善有限（开发迭代 42.9s → 单套件最快 0.4s hygiene）。
- 不改变全量测试的绝对成本。
- CI 不带该参数（CI 继续全量）。

### 验证完成条件

- `npm run check` exit 0
- `npm test` exit 0 —— 实现后基线 **330/331，失败 0**；差值 1 是既有 honest skip（`validator: symlinked generated SKILL.md`，Windows EPERM 无法创建符号链接），非本计划引入，非失败
- 5 条 CLI 行为全部有回归断言，且断言在退化时变红（变异验证 5/5 全部被杀死）
- 三语文档 parity 通过
