# Oracle Inventory v0（施工权威 · PLAN-0042 / FINDING-0006）

机读源：[`oracle-inventory.v0.json`](oracle-inventory.v0.json)  
施工计划：[PLAN-0042](../../plans/archive/PLAN-0042-invariant-based-testing.md)

## 为什么需要台账

| 误判 | 事实 |
| --- | --- |
| N/N tests passed = 规则受保护 | 许多例只是表征「脚本今天这样跑」 |
| 有负向断言 = oracle | 若夹具抄 checker 正则，测的是「两份正则仍一致」 |
| 缺测试可以先绿着 | important 行缺 `oracle_pair` 必须显式 `gap`/`deferred` |

## 分类

| classification | 含义 |
| --- | --- |
| `oracle_pair` | 独立 positive + negative；破坏 invariant → 红 |
| `characterization_only` | 行为快照；不计入 Rule protection |
| `gap` | important 缺口；台账表征套件 fail-closed |
| `deferred` | 显式延期（须有理由） |

## important 冻结集

- CTRL-0001–0006（RESEARCH-0011）
- 路由完整性（正/负命中、orphan authority、unknown 不静默全表）
- Safety Kernel 三套件记账（security / generator / payload）

## 维护

- 新增 important 义务 → **同 PR** 登记 JSON。
- 表征：`node tests/run-tests.js --suite oracle-inventory`
- 将某行标 `gap` 不得合入 Active 计划的完成勾选；Exit 要求 important `gap=0`。
